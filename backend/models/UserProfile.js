const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
  account_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    unique: true
  },
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'unspecified'],
    default: 'unspecified'
  },
  avatar_url: {
    type: String,
    trim: true,
    default: ''
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UserProfile', userProfileSchema);




