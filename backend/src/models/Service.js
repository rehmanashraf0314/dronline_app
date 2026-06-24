const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  currency: { type: String, default: 'EUR' },
  category: String,
  countries: [{ type: String }],
  isEnabled: { type: Boolean, default: true },
  isComingSoon: { type: Boolean, default: false },
  isTemporarilyClosed: { type: Boolean, default: false },
  imageUrl: String,
  imagePublicId: String,
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
