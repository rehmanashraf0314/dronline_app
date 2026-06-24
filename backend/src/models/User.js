const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    required: true,
  },

  // ── Shared fields ──────────────────────────────────────
  fullName: { type: String },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String },
  isEmailVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  profilePhoto: { resource_type: String, url: String, public_id: String },

  // ── OTP ────────────────────────────────────────────────
  otp: { type: String },
  otpExpires: { type: Date },

  // ── Patient-specific ───────────────────────────────────
  patient: {
    firstName: String,
    lastName: String,
    dob: String,
    gender: String,
    phone: String,
    nationalId: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    // Medical info
    allergies: [String],
    conditions: [String],
    medications: [String],
    pharmacy: String,
  },

  // ── Doctor-specific ────────────────────────────────────
  gender: String,
  contact: {
    email: String,
    phone: String,
    address: { country: String },
  },
  specialization: String,
  imcNumber: String,
  licenseAuthority: String,
  education: [String],
  bio: String,
  dateOfBirth: Date,
  yearsOfExperience: Number,
  availability: [
    {
      dayOfWeek: String,
      timeRanges: [String],
    },
  ],
  slotDuration: { type: Number, default: 30 },
  services: [
    {
      serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
      fee: Number,
    },
  ],
  consentToPlatformTerms: Boolean,
  documents: [{ url: String, public_id: String, name: String }],
  signature: {
    url: String,
    public_id: String,
    uploadedAt: Date,
    isActive: Boolean,
  },
  fhir: { profile: String },

  // ── Reset password ─────────────────────────────────────
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
