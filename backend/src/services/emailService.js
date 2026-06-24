const nodemailer = require('nodemailer');

// ── Initialize Nodemailer SMTP Transporter ─────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FROM = process.env.EMAIL_USER; // Use EMAIL_USER directly as FROM address

// ── Helper ─────────────────────────────────────────────────────────────
async function send({ to, subject, html }) {
  try {
    const result = await transporter.sendMail({
      from: FROM,
      to,
      subject,
      html,
    });
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (err) {
    console.error('Email send failed:', err.message || err);
    throw err;
  }
}

// ── 1. OTP Verification ────────────────────────────────────────────────
exports.sendOTP = async ({ email, otp, name }) => {
  await send({
    to: email,
    subject: 'Your DrOnline Verification Code',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:#1e40af;">DrOnline Verification</h2>
        <p>Hi ${name || 'there'},</p>
        <p>Your one-time verification code is:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1e40af;text-align:center;padding:20px;background:#fff;border-radius:8px;margin:20px 0;">
          ${otp}
        </div>
        <p style="color:#6b7280;font-size:13px;">This code expires in ${process.env.OTP_EXPIRES_MINUTES || 10} minutes. Do not share it with anyone.</p>
      </div>
    `,
  });
};

// ── 2. Appointment Confirmation → Patient ─────────────────────────────
exports.sendAppointmentConfirmationPatient = async ({ appointment }) => {
  const { patientName, patientEmail, serviceType, appointment: appt, meetingLink, payment, service } = appointment;
  const patientFirstName = patientName?.split(' ')[0] || 'there';
  
  await send({
    to: patientEmail,
    subject: `Appointment Confirmed — ${serviceType || 'Consultation'}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:#16a34a;">✅ Appointment Confirmed</h2>
        <p>Hi ${patientFirstName},</p>
        <p>Your appointment has been booked successfully.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#fff;border-radius:8px;">
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:12px;color:#6b7280;font-weight:500;">Service</td><td style="padding:12px;font-weight:bold;">${serviceType || service?.name || 'N/A'}</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:12px;color:#6b7280;font-weight:500;">Date</td><td style="padding:12px;font-weight:bold;">${appt?.date || 'N/A'}</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:12px;color:#6b7280;font-weight:500;">Time</td><td style="padding:12px;font-weight:bold;">${appt?.time || 'N/A'}</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:12px;color:#6b7280;font-weight:500;">Mode</td><td style="padding:12px;font-weight:bold;">${appt?.preferredMode || 'Video'}</td></tr>
          <tr><td style="padding:12px;color:#6b7280;font-weight:500;">Amount Paid</td><td style="padding:12px;font-weight:bold;color:#16a34a;">€${payment?.amount || '0'}</td></tr>
        </table>
        ${meetingLink ? `
        <div style="text-align:center;margin:24px 0;">
          <a href="${meetingLink}" style="display:inline-block;background:#1e40af;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">
            📹 Join Video Consultation
          </a>
        </div>
        <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:12px;">Meeting link: <a href="${meetingLink}" style="color:#1e40af;text-decoration:none;">${meetingLink}</a></p>
        ` : '<p style="color:#f59e0b;font-size:12px;background:#fffbeb;padding:12px;border-radius:6px;">⚠️ Meeting link will be generated shortly. Check your email for updates.</p>'}
        <p style="color:#6b7280;font-size:13px;margin-top:20px;text-align:center;">If you have questions, contact us at support@dronline247.eu</p>
      </div>
    `,
  });
};

// ── 3. Appointment Notification → Doctor ──────────────────────────────
exports.sendAppointmentNotificationDoctor = async ({ appointment, doctorEmail, doctorName }) => {
  const { patientName, patientPhone, serviceType, appointment: appt, meetingLink, medical } = appointment;
  const doctorFirstName = doctorName?.split(' ')[0] || 'there';
  
  await send({
    to: doctorEmail,
    subject: `New Appointment — ${patientName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:#1e40af;">📋 New Patient Appointment</h2>
        <p>Hi Dr. ${doctorFirstName},</p>
        <p>You have a new appointment booked.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#fff;border-radius:8px;">
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:12px;color:#6b7280;font-weight:500;">Patient</td><td style="padding:12px;font-weight:bold;">${patientName}</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:12px;color:#6b7280;font-weight:500;">Contact</td><td style="padding:12px;">${patientPhone || 'N/A'}</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:12px;color:#6b7280;font-weight:500;">Service</td><td style="padding:12px;font-weight:bold;">${serviceType || 'Consultation'}</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:12px;color:#6b7280;font-weight:500;">Date</td><td style="padding:12px;font-weight:bold;">${appt?.date || 'N/A'}</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:12px;color:#6b7280;font-weight:500;">Time</td><td style="padding:12px;font-weight:bold;">${appt?.time || 'N/A'}</td></tr>
          <tr style="border-bottom:1px solid #e5e7eb;"><td style="padding:12px;color:#6b7280;font-weight:500;">Urgency</td><td style="padding:12px;font-weight:bold;color:${medical?.urgency === 'Urgent' ? '#dc2626' : '#16a34a'};">${medical?.urgency || 'Routine'}</td></tr>
          <tr><td style="padding:12px;color:#6b7280;font-weight:500;">Symptoms</td><td style="padding:12px;">${medical?.symptoms || 'Not specified'}</td></tr>
        </table>
        ${meetingLink ? `
        <div style="text-align:center;margin:24px 0;">
          <a href="${meetingLink}" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;">
            📹 Join Video Call
          </a>
        </div>
        <p style="color:#6b7280;font-size:12px;text-align:center;">Link: <a href="${meetingLink}" style="color:#16a34a;text-decoration:none;word-break:break-all;">${meetingLink}</a></p>
        ` : '<p style="color:#f59e0b;font-size:12px;background:#fffbeb;padding:12px;border-radius:6px;">⚠️ Meeting link will be generated before the appointment time.</p>'}
        <p style="color:#6b7280;font-size:13px;margin-top:20px;text-align:center;">For support: support@dronline247.eu</p>
      </div>
    `,
  });
};

// ── 4. Document Sent → Patient ─────────────────────────────────────────
exports.sendDocumentEmail = async ({ patientEmail, patientName, docType, fileUrl }) => {
  const labels = {
    prescription: 'Prescription',
    medicalCertificate: 'Medical Certificate',
    medicalLeave: 'Medical Leave',
    referralLetter: 'Referral Letter',
  };
  await send({
    to: patientEmail,
    subject: `Your ${labels[docType]} from DrOnline`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:#1e40af;">📄 Your Medical Document</h2>
        <p>Hi ${patientName},</p>
        <p>Your doctor has sent you a <strong>${labels[docType]}</strong>.</p>
        ${fileUrl ? `
        <div style="text-align:center;margin:24px 0;">
          <a href="${fileUrl}" style="background:#1e40af;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Download ${labels[docType]}
          </a>
        </div>` : ''}
        <p style="color:#6b7280;font-size:13px;">If you did not expect this, please contact support@dronline247.eu</p>
      </div>
    `,
  });
};

// ── 5. Password Reset ──────────────────────────────────────────────────
exports.sendPasswordReset = async ({ email, resetUrl }) => {
  await send({
    to: email,
    subject: 'Reset Your DrOnline Password',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:#1e40af;">🔐 Password Reset</h2>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${resetUrl}" style="background:#dc2626;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">
            Reset Password
          </a>
        </div>
        <p style="color:#6b7280;font-size:13px;">If you didn't request this, ignore this email.</p>
      </div>
    `,
  });
};

// ── 6. Doctor Welcome Email ────────────────────────────────────────────
exports.sendDoctorWelcome = async ({ email, fullName, tempPassword }) => {
  await send({
    to: email,
    subject: 'Welcome to DrOnline — Your Doctor Account',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f9fafb;border-radius:12px;">
        <h2 style="color:#1e40af;">Welcome to DrOnline, Dr. ${fullName}!</h2>
        <p>Your doctor account has been created. Here are your login credentials:</p>
        <div style="background:#fff;border-radius:10px;padding:20px;margin:20px 0;border:1px solid #e5e7eb;">
          <p style="margin:0 0 8px;"><strong>Email:</strong> ${email}</p>
          <p style="margin:0;"><strong>Temporary Password:</strong>
            <span style="font-size:20px;font-weight:bold;letter-spacing:4px;color:#1e40af;">${tempPassword}</span>
          </p>
        </div>
        <p style="color:#dc2626;font-size:13px;">⚠️ Please change your password after your first login.</p>
        <p style="color:#6b7280;font-size:13px;">Download the DrOnline app and sign in with these credentials to view your appointments.</p>
      </div>
    `,
  });
};
