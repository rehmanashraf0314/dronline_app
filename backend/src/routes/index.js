const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const appointmentController = require('../controllers/appointmentController');
const paymentController = require('../controllers/paymentController');
const doctorController = require('../controllers/doctorController');
const { protect, roleGuard } = require('../middleware/auth');

const Country = require('../models/Country');
const Service = require('../models/Service');
const User = require('../models/User');

// ── AUTH ──────────────────────────────────────────────────────────────
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/send-otp', authController.sendOTP);
router.post('/auth/verify-otp', authController.verifyOTP);
router.post('/auth/forgot-password', authController.forgotPassword);
router.get('/auth/me', protect, authController.getMe);
router.post('/auth/set-password', protect, authController.setPassword);
router.put('/auth/complete-guest-profile', protect, authController.completeGuestProfile);

// ── COUNTRIES ─────────────────────────────────────────────────────────
router.get('/countries', async (req, res) => {
  const countries = await Country.find({ isActive: true }).sort('name');
  res.json({ success: true, data: countries });
});
router.post('/countries', protect, roleGuard('admin'), async (req, res) => {
  const country = await Country.create(req.body);
  res.status(201).json({ success: true, data: country });
});
router.put('/countries/:id', protect, roleGuard('admin'), async (req, res) => {
  const country = await Country.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: country });
});
router.delete('/countries/:id', protect, roleGuard('admin'), async (req, res) => {
  await Country.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Deleted' });
});

// ── SERVICES ──────────────────────────────────────────────────────────
router.get('/services', async (req, res) => {
  const { country } = req.query;
  const filter = { isEnabled: true, isTemporarilyClosed: false };
  if (country) filter.countries = country;
  const services = await Service.find(filter);
  res.json({ success: true, data: services });
});
router.get('/services/all', protect, roleGuard('admin'), async (req, res) => {
  const services = await Service.find();
  res.json({ success: true, data: services });
});
router.post('/services', protect, roleGuard('admin'), async (req, res) => {
  const service = await Service.create(req.body);
  res.status(201).json({ success: true, data: service });
});
router.put('/services/:id', protect, roleGuard('admin'), async (req, res) => {
  const service = await Service.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, data: service });
});
router.delete('/services/:id', protect, roleGuard('admin'), async (req, res) => {
  await Service.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Deleted' });
});

// ── DOCTORS ───────────────────────────────────────────────────────────
router.get('/doctors', doctorController.getDoctors);
router.get('/doctors/:id', doctorController.getDoctor);
router.get('/doctors/:id/slots', doctorController.getDoctorSlots);
router.put('/doctors/availability', protect, roleGuard('doctor'), doctorController.updateAvailability);
router.put('/doctors/profile', protect, roleGuard('doctor'), doctorController.updateProfile);

// ── APPOINTMENTS ──────────────────────────────────────────────────────
router.get('/appointments/mine', protect, roleGuard('patient'), appointmentController.getMyAppointments);
router.get('/appointments/doctor/mine', protect, roleGuard('doctor'), appointmentController.getDoctorAppointments);
router.get('/appointments', protect, roleGuard('admin'), appointmentController.getAllAppointments);
router.get('/appointments/:id', protect, appointmentController.getAppointment);
router.put('/appointments/:id/assign', protect, roleGuard('admin'), appointmentController.assignDoctor);
router.post('/appointments/:id/documents', protect, roleGuard('doctor'), appointmentController.sendDocument);
router.get('/appointments/:id/meeting-token', protect, appointmentController.getMeetingToken);

// ── PAYMENTS ──────────────────────────────────────────────────────────
router.post('/payments/create-intent', paymentController.createPaymentIntent);
router.post('/payments/create-appointment-pending', paymentController.createPendingAppointment);
// NOTE: webhook route is registered in index.js (needs raw body parser)

// ── ADMIN ─────────────────────────────────────────────────────────────
router.get('/admin/doctors', protect, roleGuard('admin'), doctorController.getAllDoctors);
router.get('/admin/doctors/:id', protect, roleGuard('admin'), doctorController.getDoctorById);
router.post('/admin/doctors/create', protect, roleGuard('admin'), doctorController.createDoctor);
router.put('/admin/doctors/:id', protect, roleGuard('admin'), doctorController.updateDoctor);
router.delete('/admin/doctors/:id', protect, roleGuard('admin'), doctorController.deleteDoctor);
router.put('/admin/doctors/:id/toggle', protect, roleGuard('admin'), doctorController.toggleDoctorActive);

// ── ADMIN: Services CRUD ───────────────────────────────────────────────
router.get('/admin/services/:id', protect, roleGuard('admin'), async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, data: service });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── ADMIN: Countries CRUD ──────────────────────────────────────────────
router.get('/admin/countries/:id', protect, roleGuard('admin'), async (req, res) => {
  try {
    const country = await Country.findById(req.params.id);
    if (!country) return res.status(404).json({ success: false, message: 'Country not found' });
    res.json({ success: true, data: country });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/admin/stats', protect, roleGuard('admin'), async (req, res) => {
  const Appointment = require('../models/Appointment');
  const [totalAppointments, activeAppointments, totalDoctors, totalPatients] = await Promise.all([
    Appointment.countDocuments(),
    Appointment.countDocuments({ status: 'Active' }),
    User.countDocuments({ role: 'doctor' }),
    User.countDocuments({ role: 'patient' }),
  ]);
  res.json({ success: true, data: { totalAppointments, activeAppointments, totalDoctors, totalPatients } });
});

module.exports = router;
