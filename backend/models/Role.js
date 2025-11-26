const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  role_name: {
    type: String,
    required: true,
    enum: ['admin', 'manager', 'customer', 'guest'],
    unique: true
  },
  description: {
    type: String,
    required: true
  }
}, {
  timestamps: false
});

module.exports = mongoose.model('Role', roleSchema);


