const User = require('../models/User');
const Service = require('../models/Service');

// ── GET /api/doctors — list active doctors (patient browsing) ─────────
exports.getDoctors = async (req, res) => {
  try {
    const { country, serviceId } = req.query;
    const filter = { role: 'doctor', isActive: true };
    if (country) filter['contact.address.country'] = country;
    if (serviceId) filter['services.serviceId'] = serviceId;

    const doctors = await User.find(filter).select(
      'fullName specialization yearsOfExperience bio profilePhoto contact.address.country availability slotDuration services'
    );
    res.json({ success: true, data: doctors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/doctors/:id — single doctor profile ──────────────────────
exports.getDoctor = async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' }).select('-passwordHash');
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/doctors/:id/slots?date=2026-06-20 ────────────────────────
// Returns available 5-min slots for a given day based on doctor's availability
exports.getDoctorSlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'date query param required' });

    const doctor = await User.findById(req.params.id).select('availability slotDuration');
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
    const dayAvailability = doctor.availability.find(a => a.dayOfWeek === dayName);

    if (!dayAvailability) return res.json({ success: true, slots: [] });

    const slotDuration = doctor.slotDuration || 30;
    const slots = [];

    for (const range of dayAvailability.timeRanges) {
      const [startStr, endStr] = range.split('-');
      const [startH, startM] = startStr.split(':').map(Number);
      const [endH, endM] = endStr.split(':').map(Number);

      let current = startH * 60 + startM;
      const end = endH * 60 + endM;

      while (current + slotDuration <= end) {
        const h = Math.floor(current / 60).toString().padStart(2, '0');
        const m = (current % 60).toString().padStart(2, '0');
        slots.push(`${h}:${m}`);
        current += slotDuration;
      }
    }

    res.json({ success: true, slots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/doctors/availability (doctor updates own) ────────────────
exports.updateAvailability = async (req, res) => {
  try {
    const { availability, slotDuration } = req.body;
    const doctor = await User.findByIdAndUpdate(
      req.user._id,
      { availability, slotDuration },
      { new: true }
    ).select('availability slotDuration');
    res.json({ success: true, data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/doctors/profile (doctor updates own profile) ─────────────
exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['fullName', 'bio', 'specialization', 'yearsOfExperience', 'education'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const doctor = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-passwordHash');
    res.json({ success: true, data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: GET /api/admin/doctors ─────────────────────────────────────
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('-passwordHash');
    res.json({ success: true, data: doctors });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: PUT /api/admin/doctors/:id/toggle ──────────────────────────
exports.toggleDoctorActive = async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Not found' });
    doctor.isActive = !doctor.isActive;
    await doctor.save();
    res.json({ success: true, data: { isActive: doctor.isActive } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: GET /api/admin/doctors/:id ─────────────────────────────────
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' }).select('-passwordHash');
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: PUT /api/admin/doctors/:id ──────────────────────────────────
exports.updateDoctor = async (req, res) => {
  try {
    const allowedFields = [
      'fullName', 'specialization', 'imcNumber', 'licenseAuthority',
      'yearsOfExperience', 'bio', 'availability', 'slotDuration',
    ];
    const updates = {};
    allowedFields.forEach(f => {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    });

    const doctor = await User.findByIdAndUpdate(
      req.params.id,
      { ...updates },
      { new: true }
    ).select('-passwordHash');

    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, data: doctor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: DELETE /api/admin/doctors/:id ───────────────────────────────
exports.deleteDoctor = async (req, res) => {
  try {
    const doctor = await User.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' });
    res.json({ success: true, message: 'Doctor deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── Admin: POST /api/admin/doctors/create ─────────────────────────────
// Creates doctor account + sends email with credentials
exports.createDoctor = async (req, res) => {
  try {
    const crypto = require('crypto');
    const emailService = require('../services/emailService');

    const {
      fullName, email, specialization, imcNumber, licenseAuthority,
      country, yearsOfExperience, bio, availability, slotDuration,
      serviceId, serviceFee,
    } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

    // Generate random password
    const tempPassword = crypto.randomBytes(6).toString('hex').toUpperCase();

    const doctorServices = [];
    if (serviceId) {
      const service = await Service.findById(serviceId);
      if (!service) return res.status(400).json({ success: false, message: 'Selected service not found' });
      doctorServices.push({
        serviceId: service._id,
        fee: Number(serviceFee || service.price || 0),
      });
    }

    const doctor = await User.create({
      fullName,
      email,
      passwordHash: tempPassword,
      role: 'doctor',
      isEmailVerified: true,
      isActive: true,
      specialization,
      imcNumber,
      licenseAuthority,
      contact: { email, address: { country } },
      yearsOfExperience: Number(yearsOfExperience) || 0,
      bio,
      availability: availability || [],
      slotDuration: Number(slotDuration) || 30,
      services: doctorServices,
      fhir: { profile: 'http://hl7.org/fhir/StructureDefinition/Practitioner' },
    });

    let emailSent = true;
    let emailError = null;
    try {
      await emailService.sendDoctorWelcome({
        email,
        fullName,
        tempPassword,
      });
    } catch (err) {
      emailSent = false;
      emailError = err.message || 'Email send failed';
      console.error('Doctor welcome email failed:', err);
    }

    res.status(201).json({
      success: true,
      message: emailSent
        ? 'Doctor created and credentials emailed.'
        : `Doctor created but welcome email failed: ${emailError}`,
      data: { _id: doctor._id, fullName, email, emailSent },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
