const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const UserProfile = require('../models/UserProfile');
const Account = require('../models/Account');
const Role = require('../models/Role');
const { authenticate, authorize } = require('../middleware/auth');

// Get all users (Admin only)
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { search, role } = req.query;
    const users = await UserProfile.find()
      .populate({
        path: 'account_id',
        populate: {
          path: 'role_id',
          select: 'role_name'
        }
      });

    let filtered = users;
    if (role) {
      filtered = filtered.filter(user => user.account_id?.role_id?.role_name === role);
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      filtered = filtered.filter(user =>
        regex.test(user.full_name || '') ||
        regex.test(user.email || '') ||
        regex.test(user.phone || '') ||
        regex.test(user.address || '') ||
        regex.test(user.account_id?.username || '')
      );
    }

    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách người dùng', error: error.message });
  }
});

// Create user (Admin only)
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const {
      username,
      password,
      full_name,
      email,
      phone,
      address,
      gender = 'unspecified',
      role = 'customer'
    } = req.body;

    if (!username || !password || !full_name || !email) {
      return res.status(400).json({ message: 'Bạn nhập sai yêu cầu' });
    }

    const allowedGenders = ['male', 'female', 'other', 'unspecified'];
    if (gender && !allowedGenders.includes(gender)) {
      return res.status(400).json({ message: 'Bạn nhập sai yêu cầu' });
    }

    const existingAccount = await Account.findOne({ username });
    if (existingAccount) {
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
    }

    const existingEmail = await UserProfile.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    const roleDoc = await Role.findOne({ role_name: role });
    if (!roleDoc) {
      return res.status(400).json({ message: 'Quyền không tồn tại' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const account = await Account.create({
      username,
      password: hashedPassword,
      role_id: roleDoc._id,
      status: 'active'
    });

    const userProfile = await UserProfile.create({
      account_id: account._id,
      full_name,
      email,
      phone,
      address,
      gender
    });

    const populatedProfile = await UserProfile.findById(userProfile._id)
      .populate({
        path: 'account_id',
        populate: { path: 'role_id', select: 'role_name' }
      });

    res.status(201).json({ message: 'Thêm tài khoản thành công', user: populatedProfile });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tạo tài khoản', error: error.message });
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
    if (req.user.role !== 'admin' && req.user.userId?.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Không có quyền cập nhật' });
    }

    const { full_name, email, phone, address, gender, avatar_url } = req.body;

    const allowedGenders = ['male', 'female', 'other', 'unspecified'];
    if (gender && !allowedGenders.includes(gender)) {
      return res.status(400).json({ message: 'Bạn nhập sai yêu cầu' });
    }

    const emailInUse = await UserProfile.findOne({ email, _id: { $ne: req.params.id } });
    if (emailInUse) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    const updatedFields = {
      full_name,
      email,
      phone,
      address,
      gender: gender || 'unspecified',
      avatar_url: avatar_url || ''
    };

    const user = await UserProfile.findByIdAndUpdate(
      req.params.id,
      updatedFields,
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
    const { status, role } = req.body;
    const user = await UserProfile.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const update = {};
    if (status) {
      update.status = status;
    }

    if (role) {
      const roleDoc = await Role.findOne({ role_name: role });
      if (!roleDoc) {
        return res.status(400).json({ message: 'Quyền không tồn tại' });
      }
      update.role_id = roleDoc._id;
    }

    const account = await Account.findById(user.account_id);
    if (!account) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }

    Object.assign(account, update);
    await account.save();

    const populatedUser = await UserProfile.findById(req.params.id)
      .populate({
        path: 'account_id',
        populate: { path: 'role_id', select: 'role_name' }
      });

    res.json({ message: 'Cập nhật tài khoản thành công', user: populatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật trạng thái', error: error.message });
  }
});

// Delete user (admin, only if account not active)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const user = await UserProfile.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
    const account = await Account.findById(user.account_id);
    if (!account) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
    }

    if (account.status === 'active') {
      return res.status(400).json({ message: 'Tài khoản đã được kích hoạt, bạn không thể xóa' });
    }

    await UserProfile.findByIdAndDelete(req.params.id);
    await Account.findByIdAndDelete(account._id);

    res.json({ message: 'Xóa tài khoản thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xóa tài khoản', error: error.message });
  }
});

module.exports = router;




