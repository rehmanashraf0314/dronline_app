const Appointment = require('../models/Appointment');
const User = require('../models/User');
const emailService = require('../services/emailService');

// ── GET /api/appointments/mine (patient) ─────────────────────────────
exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patientEmail: req.user.email })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/appointments/doctor/mine (doctor) ───────────────────────
exports.getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.user._id })
      .sort({ appointmentDate: 1 });
    res.json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/appointments (admin) ────────────────────────────────────
exports.getAllAppointments = async (req, res) => {
  try {
    const { status, country, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (country) filter['patient.address.country'] = country;

    const appointments = await Appointment.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(filter);
    res.json({ success: true, data: appointments, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/appointments/:id ─────────────────────────────────────────
exports.getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/appointments/:id/assign (admin) ──────────────────────────
exports.assignDoctor = async (req, res) => {
  try {
    const { doctorId } = req.body;
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        doctorId: doctor._id,
        doctorName: doctor.fullName,
        doctorEmail: doctor.contact?.email || doctor.email,
        assignedBy: 'admin',
        assignedAt: new Date(),
        forceAssigned: true,
      },
      { new: true }
    );

    res.json({ success: true, data: appointment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/appointments/:id/documents (doctor) ────────────────────
exports.sendDocument = async (req, res) => {
  try {
    const { docType, fileUrl } = req.body;
    // docType: prescription | medicalCertificate | medicalLeave | referralLetter

    const validTypes = ['prescription', 'medicalCertificate', 'medicalLeave', 'referralLetter'];
    if (!validTypes.includes(docType)) {
      return res.status(400).json({ success: false, message: 'Invalid document type' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Not found' });

    appointment.consultationDocuments[docType] = {
      sent: true,
      sentAt: new Date(),
      fileUrl,
    };
    await appointment.save();

    // Send email to patient
    await emailService.sendDocumentEmail({
      patientEmail: appointment.patientEmail,
      patientName: appointment.patientName,
      docType,
      fileUrl,
    });

    res.json({ success: true, message: 'Document sent successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/appointments/:id/meeting-token ───────────────────────────
// Generate Daily.co token for joining the call
exports.getMeetingToken = async (req, res) => {
  try {
    const { createMeetingToken } = require('../services/dailyService');
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment?.meetingCode) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }

    const isDoctor = req.user._id.toString() === appointment.doctorId?.toString();
    const participantName = isDoctor ? appointment.doctorName : appointment.patientName;

    const token = await createMeetingToken({
      roomName: appointment.meetingCode,
      participantName,
      isOwner: isDoctor,
    });

    res.json({ success: true, token, meetingLink: appointment.meetingLink });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
