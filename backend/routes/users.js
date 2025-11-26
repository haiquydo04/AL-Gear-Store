const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');
const Account = require('../models/Account');
const { authenticate, authorize } = require('../middleware/auth');

// Get all users (Admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const users = await UserProfile.find().populate('account_id');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách người dùng', error: error.message });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    // Users can only view their own profile unless admin
    if (req.user.role !== 'admin' && req.user.userId?.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    const user = await UserProfile.findById(req.params.id).populate('account_id');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy thông tin người dùng', error: error.message });
  }
});

// Update user profile
router.put('/:id', authenticate, async (req, res) => {
  try {
    // Users can only update their own profile unless admin
    if (req.user.role !== 'admin' && req.user.userId?.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Không có quyền cập nhật' });
    }

    const { full_name, email, phone, address } = req.body;
    const user = await UserProfile.findByIdAndUpdate(
      req.params.id,
      { full_name, email, phone, address },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    res.json({ message: 'Cập nhật thành công', user });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật người dùng', error: error.message });
  }
});

// Update account status (Admin only)
router.patch('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const user = await UserProfile.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const account = await Account.findByIdAndUpdate(
      user.account_id,
      { status },
      { new: true }
    );

    res.json({ message: 'Cập nhật trạng thái thành công', account });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật trạng thái', error: error.message });
  }
});

module.exports = router;


