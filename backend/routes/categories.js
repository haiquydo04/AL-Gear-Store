const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

// Get all categories (public)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const categories = await Category.find().sort({ created_at: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách danh mục', error: error.message });
  }
});

// Get category by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy thông tin danh mục', error: error.message });
  }
});

// Create category (Manager/Admin only)
router.post('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { category_name, description } = req.body;
    const category = await Category.create({ category_name, description });
    res.status(201).json({ message: 'Tạo danh mục thành công', category });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tạo danh mục', error: error.message });
  }
});

// Update category (Manager/Admin only)
router.put('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }
    res.json({ message: 'Cập nhật danh mục thành công', category });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật danh mục', error: error.message });
  }
});

// Delete category (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }
    res.json({ message: 'Xóa danh mục thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xóa danh mục', error: error.message });
  }
});

module.exports = router;


