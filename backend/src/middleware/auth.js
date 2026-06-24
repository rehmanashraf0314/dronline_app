const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated. Please login.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });
    }

    const user = await User.findById(decoded.userId).select('-passwordHash -otp -otpExpires -resetPasswordToken');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Account not found.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact support.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Authentication failed.' });
  }
};

exports.roleGuard = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Access denied. Required role: ${roles.join(' or ')}` });
  }
  next();
};
