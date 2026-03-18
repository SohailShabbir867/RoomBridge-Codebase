const mongoose = require('mongoose');

const preferenceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  smoking: { type: Boolean, default: false },
  pets: { type: Boolean, default: false },
  budget: { type: Number },
  location: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Preference', preferenceSchema);
