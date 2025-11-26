const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Account = require('../models/Account');
const UserProfile = require('../models/UserProfile');
const Role = require('../models/Role');
const { authenticate } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, password, full_name, email, phone, address } = req.body;

    // Check if username exists
    const existingAccount = await Account.findOne({ username });
    if (existingAccount) {
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
    }

    // Check if email exists
    const existingProfile = await UserProfile.findOne({ email });
    if (existingProfile) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Get customer role
    const customerRole = await Role.findOne({ role_name: 'customer' });
    if (!customerRole) {
      return res.status(500).json({ message: 'Không tìm thấy role customer' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create account
    const account = await Account.create({
      username,
      password: hashedPassword,
      role_id: customerRole._id,
      status: 'active'
    });

    // Create user profile
    const userProfile = await UserProfile.create({
      account_id: account._id,
      full_name,
      email,
      phone,
      address
    });

    // Generate JWT
    const token = jwt.sign(
      { accountId: account._id },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      message: 'Đăng ký thành công',
      token,
      user: {
        accountId: account._id,
        userId: userProfile._id,
        username: account.username,
        role: 'customer',
        full_name: userProfile.full_name,
        email: userProfile.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi đăng ký', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find account
    const account = await Account.findOne({ username }).populate('role_id');
    if (!account) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // Check status
    if (account.status !== 'active') {
      return res.status(401).json({ message: 'Tài khoản đã bị khóa' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
    }

    // Get user profile
    const userProfile = await UserProfile.findOne({ account_id: account._id });

    // Generate JWT
    const token = jwt.sign(
      { accountId: account._id },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        accountId: account._id,
        userId: userProfile?._id,
        username: account.username,
        role: account.role_id.role_name,
        full_name: userProfile?.full_name,
        email: userProfile?.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi đăng nhập', error: error.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.cookie('token', '', { maxAge: 0 });
  res.json({ message: 'Đăng xuất thành công' });
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const userProfile = await UserProfile.findOne({ account_id: req.user.accountId });
    res.json({
      user: {
        ...req.user,
        full_name: userProfile?.full_name,
        email: userProfile?.email,
        phone: userProfile?.phone,
        address: userProfile?.address
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy thông tin người dùng', error: error.message });
  }
});

module.exports = router;


