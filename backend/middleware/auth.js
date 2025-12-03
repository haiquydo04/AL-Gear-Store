const jwt = require('jsonwebtoken');
const UserProfile = require('../models/UserProfile');
const Account = require('../models/Account');
const Role = require('../models/Role');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Không có token xác thực' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key');
    
    const account = await Account.findById(decoded.accountId).populate('role_id');
    if (!account || account.status !== 'active') {
      return res.status(401).json({ message: 'Tài khoản không hợp lệ' });
    }

    const userProfile = await UserProfile.findOne({ account_id: account._id });
    
    req.user = {
      accountId: account._id,
      userId: userProfile?._id,
      username: account.username,
      role: account.role_id?.role_name,
      roleId: account.role_id?._id
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }
};

// Check role permission
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Chưa xác thực' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    
    next();
  };
};

// Optional authentication (for guest users)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key');
      const account = await Account.findById(decoded.accountId).populate('role_id');
      
      if (account && account.status === 'active') {
        const userProfile = await UserProfile.findOne({ account_id: account._id });
        req.user = {
          accountId: account._id,
          userId: userProfile?._id,
          username: account.username,
          role: account.role_id?.role_name,
          roleId: account.role_id?._id
        };
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

module.exports = { authenticate, authorize, optionalAuth };




