const mongoose = require('mongoose');

const guestCartSchema = new mongoose.Schema({
  session_id: {
    type: String,
    required: true,
    unique: true
  },
  total_price: {
    type: Number,
    default: 0,
    min: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  expired_at: {
    type: Date,
    required: true
  }
});

module.exports = mongoose.model('GuestCart', guestCartSchema);




