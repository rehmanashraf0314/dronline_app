const stripeService = require('../services/stripeService');
const dailyService = require('../services/dailyService');
const emailService = require('../services/emailService');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Service = require('../models/Service');

// ── POST /api/payments/create-intent ──────────────────────────────────
exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount, currency, appointmentData } = req.body;
    const paymentIntent = await stripeService.createPaymentIntent({
      amount,
      currency: currency || 'eur',
      metadata: {
        patientEmail: appointmentData?.patient?.email || '',
        serviceId: appointmentData?.service?.id || '',
      },
    });
    res.json({ success: true, clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (err) {
    console.error('createPaymentIntent error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/payments/create-appointment-pending ─────────────────────
exports.createPendingAppointment = async (req, res) => {
  try {
    const { appointmentData, paymentIntentId } = req.body;

    const patientCountry = appointmentData.patient?.address?.country;
    const serviceId = appointmentData.service?.id;
    const doctorId = appointmentData.appointment?.doctorId; // frontend passes selected doctor id

    console.log('Creating pending appointment:', { patientCountry, serviceId, doctorId });

    // Find doctor — use doctorId passed from frontend first
    let doctor = null;
    if (doctorId) {
      doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
    }
    // Fallback: auto-assign by country
    if (!doctor && patientCountry) {
      doctor = await User.findOne({ role: 'doctor', isActive: true, 'contact.address.country': patientCountry });
    }

    const appointment = await Appointment.create({
      ...appointmentData,
      status: 'Pending',
      payment: {
        provider: 'stripe',
        paymentIntentId,
        amount: appointmentData.service?.amount,
        currency: 'EUR',
        status: 'pending',
      },
      doctorId: doctor?._id || null,
      doctorName: doctor?.fullName || null,
      doctorEmail: doctor?.contact?.email || doctor?.email || null,
      doctorCountry: doctor?.contact?.address?.country || null,
      assignedBy: 'auto',
      assignedAt: doctor ? new Date() : null,
      patientName: `${appointmentData.patient.firstName} ${appointmentData.patient.lastName}`,
      patientEmail: appointmentData.patient.email,
      patientPhone: appointmentData.patient.phone,
      appointmentDate: new Date(`${appointmentData.appointment.date}T${appointmentData.appointment.time}`),
      appointmentTimezone: 'Europe/Lisbon',
      serviceType: appointmentData.service?.name,
      paymentStatus: 'Unpaid',
    });

    console.log(`✅ Pending appointment created: ${appointment._id}, doctor: ${doctor?.fullName || 'unassigned'}`);
    res.json({ success: true, appointmentId: appointment._id });
  } catch (err) {
    console.error('createPendingAppointment error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/payments/webhook ─────────────────────────────────────────
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripeService.constructWebhookEvent(req.body, sig);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    console.log(`💳 Payment succeeded: ${paymentIntent.id}`);

    try {
      const appointment = await Appointment.findOne({ 'payment.paymentIntentId': paymentIntent.id });

      if (!appointment) {
        console.warn('⚠️ No appointment found for paymentIntent:', paymentIntent.id);
        return res.json({ received: true });
      }

      // Update payment status
      appointment.payment.status = 'succeeded';
      appointment.paymentStatus = 'Paid';
      appointment.status = 'Active';

      // ── Link guest user if exists ──────────────────────────────────
      const patientUser = await User.findOne({ email: appointment.patientEmail });
      if (patientUser) {
        appointment.patientUserId = patientUser._id;
        appointment.isGuest = !patientUser.passwordHash;
        console.log(`✅ Linked patient user: ${patientUser._id}`);
      }

      // ── Create Daily.co meeting room ──────────────────────────────
      try {
        console.log('Creating Daily.co room...');
        const meeting = await dailyService.createMeetingRoom(appointment._id.toString());
        appointment.meetingId = meeting.meetingId;
        appointment.meetingCode = meeting.meetingCode;
        appointment.meetingLink = meeting.meetingLink;
        console.log(`✅ Meeting created: ${meeting.meetingLink}`);
      } catch (dailyErr) {
        console.error('❌ Daily.co failed:', dailyErr.response?.data || dailyErr.message);
        // Don't fail the webhook — meeting link can be created later
        appointment.meetingLink = null;
      }

      await appointment.save();
      const saved = await Appointment.findById(appointment._id);

      // ── Send email to Patient ─────────────────────────────────────
      try {
        await emailService.sendAppointmentConfirmationPatient({ appointment: saved });
        console.log(`✅ Patient email sent to: ${saved.patientEmail}`);
      } catch (e) {
        console.error('❌ Patient email failed:', e.message);
        // Log but don't fail — appointment is still confirmed
      }

      // ── Send email to Doctor ──────────────────────────────────────
      if (saved.doctorEmail) {
        try {
          await emailService.sendAppointmentNotificationDoctor({
            appointment: saved,
            doctorEmail: saved.doctorEmail,
            doctorName: saved.doctorName,
          });
          console.log(`✅ Doctor email sent to: ${saved.doctorEmail}`);
        } catch (e) {
          console.error('❌ Doctor email failed:', e.message);
          // Log but don't fail
        }
      } else {
        console.warn('⚠️ No doctor assigned — doctor email not sent');
      }

      console.log(`✅ Appointment ${appointment._id} fully confirmed`);
    } catch (err) {
      console.error('❌ Webhook processing error:', err.message);
      // Still return success so Stripe doesn't retry
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object;
    try {
      const result = await Appointment.findOneAndUpdate(
        { 'payment.paymentIntentId': paymentIntent.id },
        { 'payment.status': 'failed', paymentStatus: 'Failed', status: 'Cancelled' }
      );
      console.log(`❌ Payment failed for appointment: ${result?._id}`);
    } catch (err) {
      console.error('Error updating failed payment:', err.message);
    }
  }

  res.json({ received: true });
};
