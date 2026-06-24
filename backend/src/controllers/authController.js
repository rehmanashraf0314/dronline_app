const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const emailService = require('../services/emailService');

const signToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ── POST /api/auth/register ────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { email, password, role = 'patient' } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing && existing.passwordHash) {
      return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + (process.env.OTP_EXPIRES_MINUTES || 10) * 60 * 1000);

    let user;
    if (existing) {
      // Update existing guest user with password
      existing.passwordHash = password;
      existing.otp = otp;
      existing.otpExpires = otpExpires;
      existing.role = role;
      await existing.save();
      user = existing;
    } else {
      user = await User.create({ email: email.toLowerCase(), passwordHash: password, role, otp, otpExpires, isEmailVerified: false });
    }

    await emailService.sendOTP({ email, otp, name: email });
    res.status(201).json({ success: true, message: 'OTP sent to your email.', userId: user._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/auth/send-otp ────────────────────────────────────────────
// Handles both existing users and guest account creation
exports.sendOTP = async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    const emailNormalized = email.toLowerCase().trim();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNormalized)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + (process.env.OTP_EXPIRES_MINUTES || 10) * 60 * 1000);

    let user = await User.findOne({ email: emailNormalized });
    
    // Determine account status
    let accountStatus = 'new';
    if (user) {
      if (user.passwordHash) {
        accountStatus = 'existing'; // Has password = registered account
      } else {
        accountStatus = 'guest'; // No password = guest account
      }
    }

    // Create or update user
    if (!user) {
      user = await User.create({
        email: emailNormalized,
        role: 'patient',
        otp,
        otpExpires,
        isEmailVerified: false,
        // Auto-populate name if provided
        ...(name && { patient: { firstName: name.split(' ')[0], lastName: name.split(' ').slice(1).join(' ') } }),
      });
    } else {
      user.otp = otp;
      user.otpExpires = otpExpires;
      await user.save();
    }

    // Send OTP email
    try {
      await emailService.sendOTP({ email: emailNormalized, otp, name: name || email });
    } catch (emailErr) {
      console.error('OTP email failed:', emailErr.message);
      // Don't fail the API call, but log the error
      // User can try again if they don't receive OTP
    }

    res.json({
      success: true,
      message: 'OTP sent to your email',
      userId: user._id,
      emailExists: accountStatus === 'existing',
      isGuest: accountStatus === 'guest',
      accountStatus, // 'new' | 'guest' | 'existing'
    });
  } catch (err) {
    console.error('sendOTP error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/auth/verify-otp ─────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.otp !== otp) return res.status(400).json({ success: false, message: 'Invalid OTP' });
    if (user.otpExpires < new Date()) return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });

    user.isEmailVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const isGuest = !user.passwordHash;
    const token = signToken(user._id, user.role);

    res.json({
      success: true,
      token,
      isGuest,
      user: { _id: user._id, email: user.email, role: user.role, isEmailVerified: true },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/auth/login ───────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const token = signToken(user._id, user.role);
    res.json({
      success: true,
      token,
      user: { _id: user._id, email: user.email, role: user.role, fullName: user.fullName, isEmailVerified: user.isEmailVerified },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── GET /api/auth/me ───────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// ── POST /api/auth/set-password ───────────────────────────────────────
exports.setPassword = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    const user = await User.findById(req.user._id);
    user.passwordHash = password;
    await user.save();
    res.json({ success: true, message: 'Account created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── PUT /api/auth/complete-guest-profile ───────────────────────────────
// Allow guest users to convert their account to full by adding details + password
exports.completeGuestProfile = async (req, res) => {
  try {
    const { password, firstName, lastName, phone, dob, gender, allergies, conditions, medications } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Only guest users (without password) should use this
    if (user.passwordHash) {
      return res.status(400).json({ success: false, message: 'Your account is already active' });
    }

    // Set password and patient details
    user.passwordHash = password;
    user.fullName = `${firstName || ''} ${lastName || ''}`.trim();
    user.patient = {
      firstName: firstName || '',
      lastName: lastName || '',
      phone: phone || '',
      dob: dob || '',
      gender: gender || '',
      allergies: allergies || [],
      conditions: conditions || [],
      medications: medications || [],
    };

    await user.save();

    const token = signToken(user._id, user.role);
    res.json({
      success: true,
      message: 'Profile completed successfully',
      token,
      user: { _id: user._id, email: user.email, role: user.role, fullName: user.fullName },
    });
  } catch (err) {
    console.error('completeGuestProfile error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── POST /api/auth/forgot-password ────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) return res.json({ success: true, message: 'If that email exists, a reset link was sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await emailService.sendPasswordReset({ email, resetUrl });
    res.json({ success: true, message: 'Password reset email sent.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
