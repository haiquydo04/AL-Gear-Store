const mongoose = require('mongoose');

const rolePermissionSchema = new mongoose.Schema({
  role_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  permission_key: {
    type: String,
    required: true
  },
  is_allowed: {
    type: Boolean,
    default: true
  }
});

rolePermissionSchema.index({ role_id: 1, permission_key: 1 }, { unique: true });

module.exports = mongoose.model('RolePermission', rolePermissionSchema);


