const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Account = require('../models/Account');
const UserProfile = require('../models/UserProfile');
const Role = require('../models/Role');
const { authenticate } = require('../middleware/auth');

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
const ACTIVATION_EXPIRES_MS = 24 * 60 * 60 * 1000;
const RESET_EXPIRES_MS = 60 * 60 * 1000;

const generateTokenString = () => crypto.randomBytes(32).toString('hex');
const generateRandomPassword = (length = 10) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let output = '';
  for (let i = 0; i < length; i += 1) {
    output += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return output;
};

const signJwtForAccount = (accountId) => {
  return jwt.sign(
    { accountId },
    process.env.JWT_SECRET || 'your_super_secret_jwt_key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const buildUserPayload = async (account) => {
  const populatedAccount = await Account.findById(account._id).populate('role_id');
  const profile = await UserProfile.findOne({ account_id: account._id });
  return {
    accountId: populatedAccount._id,
    userId: profile?._id,
    username: populatedAccount.username,
    role: populatedAccount.role_id?.role_name,
    full_name: profile?.full_name,
    email: profile?.email,
    phone: profile?.phone,
    address: profile?.address,
    gender: profile?.gender,
    avatar_url: profile?.avatar_url
  };
};

const appendDevPayload = (data) => {
  if (process.env.NODE_ENV === 'production') {
    return {};
  }
  return data;
};

// Register
router.post('/register', async (req, res) => {
  try {
    const {
      username,
      password,
      confirmPassword,
      full_name,
      email,
      phone,
      address
    } = req.body;

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({ message: 'Mật khẩu phải dài tối thiểu 8 ký tự và bao gồm cả chữ và số' });
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return res.status(400).json({ message: 'Mật khẩu xác nhận không khớp' });
    }

    const existingAccount = await Account.findOne({ username });
    if (existingAccount) {
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
    }

    const existingProfile = await UserProfile.findOne({ email });
    if (existingProfile) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    const customerRole = await Role.findOne({ role_name: 'customer' });
    if (!customerRole) {
      return res.status(500).json({ message: 'Không tìm thấy role customer' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const activationToken = generateTokenString();

    const account = await Account.create({
      username,
      password: hashedPassword,
      role_id: customerRole._id,
      status: 'pending',
      activation_token: activationToken,
      activation_expires: new Date(Date.now() + ACTIVATION_EXPIRES_MS)
    });

    await UserProfile.create({
      account_id: account._id,
      full_name,
      email,
      phone,
      address
    });

    res.status(201).json({
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để kích hoạt tài khoản.',
      username: account.username,
      ...appendDevPayload({ activationToken })
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi đăng ký', error: error.message });
  }
});

// Activate account
router.post('/activate', async (req, res) => {
  try {
    const { username, token } = req.body;

    const account = await Account.findOne({ username, activation_token: token });
    if (!account) {
      return res.status(400).json({ message: 'Token kích hoạt không hợp lệ' });
    }

    if (account.status === 'active') {
      return res.status(200).json({ message: 'Tài khoản đã được kích hoạt trước đó' });
    }

    if (account.activation_expires && account.activation_expires < new Date()) {
      return res.status(400).json({ message: 'Token kích hoạt đã hết hạn. Vui lòng đăng ký lại.' });
    }

    account.status = 'active';
    account.activation_token = null;
    account.activation_expires = null;
    await account.save();

    res.json({ message: 'Kích hoạt tài khoản thành công. Bạn có thể đăng nhập.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi kích hoạt tài khoản', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const account = await Account.findOne({ username }).populate('role_id');
    if (!account) {
      return res.status(401).json({ message: 'Bạn nhập sai Username hoặc Password' });
    }

    if (account.status === 'pending') {
      return res.status(401).json({ message: 'Bạn chưa kích hoạt tài khoản, vui lòng kiểm tra email đăng kí để được kích hoạt' });
    }

    if (account.status !== 'active') {
      return res.status(401).json({ message: 'Tài khoản đã bị khóa' });
    }

    const isPasswordValid = await bcrypt.compare(password, account.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Bạn nhập sai Username hoặc Password' });
    }

    const token = signJwtForAccount(account._id);
    const userPayload = await buildUserPayload(account);

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: userPayload
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

// Change password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Thiếu thông tin mật khẩu' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Mật khẩu xác nhận không khớp' });
    }

    if (!PASSWORD_REGEX.test(newPassword)) {
      return res.status(400).json({ message: 'Mật khẩu phải dài tối thiểu 8 ký tự và bao gồm cả chữ và số' });
    }

    const account = await Account.findById(req.user.accountId);
    const isPasswordValid = await bcrypt.compare(currentPassword, account.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Mật khẩu cũ không đúng' });
    }

    account.password = await bcrypt.hash(newPassword, 10);
    await account.save();

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi đổi mật khẩu', error: error.message });
  }
});

// Forgot password - request
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const userProfile = await UserProfile.findOne({ email });

    if (!userProfile) {
      return res.status(404).json({ message: 'Email không tồn tại hoặc chưa được đăng kí' });
    }

    const account = await Account.findById(userProfile.account_id);
    const token = generateTokenString();

    account.reset_password_token = token;
    account.reset_password_expires = new Date(Date.now() + RESET_EXPIRES_MS);
    await account.save();

    res.json({
      message: 'Thành công, vui lòng kiểm tra email của bạn để lấy lại password',
      ...appendDevPayload({ token })
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi yêu cầu quên mật khẩu', error: error.message });
  }
});

// Forgot password - verify token & issue new password
router.post('/reset-password', async (req, res) => {
  try {
    const { token } = req.body;

    const account = await Account.findOne({
      reset_password_token: token,
      reset_password_expires: { $gt: new Date() }
    });

    if (!account) {
      return res.status(400).json({ message: 'Token invalid' });
    }

    const newPassword = generateRandomPassword();
    account.password = await bcrypt.hash(newPassword, 10);
    account.reset_password_token = null;
    account.reset_password_expires = null;
    await account.save();

    res.json({
      message: 'Mật khẩu mới đã được tạo, vui lòng kiểm tra email',
      ...appendDevPayload({ newPassword })
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi đặt lại mật khẩu', error: error.message });
  }
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
        address: userProfile?.address,
        gender: userProfile?.gender,
        avatar_url: userProfile?.avatar_url
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy thông tin người dùng', error: error.message });
  }
});

module.exports = router;




