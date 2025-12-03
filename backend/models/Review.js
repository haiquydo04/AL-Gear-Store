const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserProfile',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  },
  is_hidden: {
    type: Boolean,
    default: false
  },
  hidden_at: {
    type: Date,
    default: null
  },
  hidden_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Review', reviewSchema);




