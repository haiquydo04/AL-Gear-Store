const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'suspended'],
    default: 'pending'
  },
  activation_token: {
    type: String,
    default: null
  },
  activation_expires: {
    type: Date,
    default: null
  },
  reset_password_token: {
    type: String,
    default: null
  },
  reset_password_expires: {
    type: Date,
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Account', accountSchema);




