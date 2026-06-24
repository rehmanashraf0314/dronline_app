const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Pending', 'Active', 'Completed', 'Cancelled'],
    default: 'Pending',
  },
  service: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
    name: String,
    amount: Number,
    currency: { type: String, default: 'EUR' },
  },
  patient: {
    firstName: String,
    lastName: String,
    dob: String,
    gender: String,
    email: String,
    phone: String,
    mrn: String,
    nationalId: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
  },
  medical: {
    allergies: [String],
    conditions: [String],
    meds: [String],
    symptoms: String,
    symptomDuration: String,
    urgency: { type: String, enum: ['Routine', 'Soon', 'Urgent'], default: 'Routine' },
    pharmacy: String,
  },
  appointment: {
    preferredMode: { type: String, enum: ['video', 'phone', 'other'] },
    date: String,
    time: String,
    referralCode: String,
  },
  consent: {
    gdpr: Boolean,
    treatment: Boolean,
    shareFHIR: Boolean,
    marketing: Boolean,
  },
  payment: {
    provider: { type: String, default: 'stripe' },
    paymentIntentId: String,
    amount: Number,
    currency: { type: String, default: 'EUR' },
    status: { type: String, enum: ['pending', 'succeeded', 'failed'], default: 'pending' },
  },

  // Doctor assignment
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  doctorName: String,
  doctorEmail: String,
  assignedBy: { type: String, enum: ['auto', 'admin'], default: 'auto' },
  assignedAt: Date,
  forceAssigned: { type: Boolean, default: false },

  // Computed fields
  patientName: String,
  patientEmail: String,
  patientPhone: String,
  appointmentDate: Date,
  appointmentTimezone: String,
  doctorCountry: String,
  serviceType: String,
  paymentStatus: { type: String, default: 'Unpaid' },

  // Meeting
  meetingCode: String,
  meetingId: String,
  meetingLink: String,

  // Documents
  consultationDocuments: {
    prescription: { sent: { type: Boolean, default: false }, sentAt: Date, fileUrl: String },
    medicalCertificate: { sent: { type: Boolean, default: false }, sentAt: Date, fileUrl: String },
    medicalLeave: { sent: { type: Boolean, default: false }, sentAt: Date, fileUrl: String },
    referralLetter: { sent: { type: Boolean, default: false }, sentAt: Date, fileUrl: String },
  },

  // Guest patient user ref (optional)
  patientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isGuest: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
