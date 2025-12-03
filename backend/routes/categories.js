const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

// Get all categories (public)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { category_name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    const categories = await Category.find(filter).sort({ created_at: -1 });
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
    const { category_name, code, description } = req.body;
    if (!category_name || !code) {
      return res.status(400).json({ message: 'Bạn nhập sai yêu cầu' });
    }

    const existing = await Category.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: 'Mã code đã tồn tại' });
    }

    const category = await Category.create({
      category_name,
      code: code.toUpperCase(),
      description
    });
    res.status(201).json({ message: 'Tạo danh mục thành công', category });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tạo danh mục', error: error.message });
  }
});

// Update category (Manager/Admin only)
router.put('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { category_name, code, description } = req.body;
    const update = {};
    if (category_name) update.category_name = category_name;
    if (code) update.code = code.toUpperCase();
    if (description !== undefined) update.description = description;

    if (update.code) {
      const exists = await Category.findOne({ code: update.code, _id: { $ne: req.params.id } });
      if (exists) {
        return res.status(400).json({ message: 'Mã code đã tồn tại' });
      }
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      update,
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
    const productsUsingCategory = await Product.findOne({ category_id: req.params.id });
    if (productsUsingCategory) {
      return res.status(400).json({ message: 'Không thể xóa danh mục sản phẩm' });
    }

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




