const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  timezone: { type: String, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Country', countrySchema);
