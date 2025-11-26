const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  manager_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserProfile',
    required: true
  },
  report_type: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
    required: true
  },
  report_period: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  total_sales: {
    type: Number,
    default: 0,
    min: 0
  }
});

module.exports = mongoose.model('Report', reportSchema);


