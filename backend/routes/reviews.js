const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

// Get reviews for a product
router.get('/product/:productId', optionalAuth, async (req, res) => {
  try {
    const reviews = await Review.find({
      product_id: req.params.productId,
      is_hidden: false
    })
      .populate('user_id', 'full_name')
      .sort({ created_at: -1 });

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({ reviews, avgRating, total: reviews.length });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy đánh giá', error: error.message });
  }
});

// Admin/Manager review listing
router.get('/admin', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { search } = req.query;
    const query = {};
    if (search) {
      query.comment = { $regex: search, $options: 'i' };
    }

    let reviews = await Review.find(query)
      .populate('product_id', 'name code')
      .populate('user_id', 'full_name')
      .sort({ created_at: -1 });

    if (search) {
      const regex = new RegExp(search, 'i');
      reviews = reviews.filter(review =>
        regex.test(review.comment || '') ||
        regex.test(review.product_id?.name || '') ||
        regex.test(review.product_id?.code || '') ||
        regex.test(review.user_id?.full_name || '')
      );
    }

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách đánh giá', error: error.message });
  }
});

// Get user's reviews
router.get('/user', authenticate, async (req, res) => {
  try {
    const reviews = await Review.find({ user_id: req.user.userId })
      .populate('product_id', 'name image_url')
      .sort({ created_at: -1 });

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy đánh giá', error: error.message });
  }
});

// Create review
router.post('/', authenticate, async (req, res) => {
  try {
    const { product_id, rating, comment } = req.body;

    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    const existingReview = await Review.findOne({
      product_id,
      user_id: req.user.userId
    });

    if (existingReview) {
      return res.status(400).json({ message: 'Bạn đã đánh giá sản phẩm này rồi' });
    }

    const review = await Review.create({
      product_id,
      user_id: req.user.userId,
      rating,
      comment
    });

    const populatedReview = await Review.findById(review._id)
      .populate('user_id', 'full_name');

    res.status(201).json({ message: 'Đánh giá thành công', review: populatedReview });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tạo đánh giá', error: error.message });
  }
});

// Update review
router.put('/:id', authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
    }

    // Users can only update their own reviews unless admin/manager
    if (req.user.role !== 'admin' && req.user.role !== 'manager' &&
        review.user_id.toString() !== req.user.userId?.toString()) {
      return res.status(403).json({ message: 'Không có quyền cập nhật' });
    }

    const updatedReview = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user_id', 'full_name');

    res.json({ message: 'Cập nhật đánh giá thành công', review: updatedReview });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật đánh giá', error: error.message });
  }
});

// Delete review (Admin/Manager can delete any, users can delete their own)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'manager' &&
        review.user_id.toString() !== req.user.userId?.toString()) {
      return res.status(403).json({ message: 'Không có quyền xóa' });
    }

    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Xóa đánh giá thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xóa đánh giá', error: error.message });
  }
});

// Toggle review visibility
router.patch('/:id/toggle-visibility', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
    }

    review.is_hidden = !review.is_hidden;
    review.hidden_at = review.is_hidden ? new Date() : null;
    review.hidden_by = review.is_hidden ? req.user.accountId : null;
    await review.save();

    const populated = await Review.findById(review._id)
      .populate('product_id', 'name code')
      .populate('user_id', 'full_name');

    res.json({
      message: review.is_hidden ? 'Đã ẩn đánh giá' : 'Đã hiển thị đánh giá',
      review: populated
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật đánh giá', error: error.message });
  }
});

module.exports = router;




