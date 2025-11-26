const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

// Get all products (public, with optional auth)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, page = 1, limit = 12 } = req.query;
    const query = {};

    if (category) {
      query.category_id = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .populate('category_id', 'category_name')
      .populate('manager_id', 'full_name')
      .skip(skip)
      .limit(Number(limit))
      .sort({ created_at: -1 });

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách sản phẩm', error: error.message });
  }
});

// Get product by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category_id', 'category_name description')
      .populate('manager_id', 'full_name email');

    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy thông tin sản phẩm', error: error.message });
  }
});

// Create product (Manager/Admin only)
router.post('/', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { category_id, name, description, price, stock, image_url } = req.body;

    const product = await Product.create({
      category_id,
      manager_id: req.user.userId,
      name,
      description,
      price,
      stock,
      image_url: image_url || ''
    });

    const populatedProduct = await Product.findById(product._id)
      .populate('category_id', 'category_name')
      .populate('manager_id', 'full_name');

    res.status(201).json({ message: 'Tạo sản phẩm thành công', product: populatedProduct });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tạo sản phẩm', error: error.message });
  }
});

// Update product (Manager/Admin only)
router.put('/:id', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    // Manager can only update their own products unless admin
    if (req.user.role !== 'admin' && product.manager_id.toString() !== req.user.userId?.toString()) {
      return res.status(403).json({ message: 'Không có quyền cập nhật sản phẩm này' });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category_id', 'category_name').populate('manager_id', 'full_name');

    res.json({ message: 'Cập nhật sản phẩm thành công', product: updatedProduct });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật sản phẩm', error: error.message });
  }
});

// Delete product (Admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xóa sản phẩm', error: error.message });
  }
});

module.exports = router;


