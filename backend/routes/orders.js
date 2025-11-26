const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const OrderDetail = require('../models/OrderDetail');
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');
const { authenticate, authorize } = require('../middleware/auth');

// Get all orders (Admin/Manager can see all, Customer sees only their own)
router.get('/', authenticate, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'customer') {
      query.user_id = req.user.userId;
    }

    const orders = await Order.find(query)
      .populate('user_id', 'full_name email')
      .sort({ order_date: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách đơn hàng', error: error.message });
  }
});

// Get order by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user_id', 'full_name email');

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Check permission
    if (req.user.role === 'customer' && order.user_id._id.toString() !== req.user.userId?.toString()) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    const orderDetails = await OrderDetail.find({ order_id: order._id })
      .populate('product_id');

    res.json({ order, orderDetails });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy thông tin đơn hàng', error: error.message });
  }
});

// Create order from cart
router.post('/', authenticate, async (req, res) => {
  try {
    const { payment_method } = req.body;

    const cart = await Cart.findOne({ user_id: req.user.userId });
    if (!cart) {
      return res.status(404).json({ message: 'Giỏ hàng trống' });
    }

    const cartItems = await CartItem.find({ cart_id: cart._id }).populate('product_id');
    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }

    // Check stock
    for (const item of cartItems) {
      if (item.product_id.stock < item.quantity) {
        return res.status(400).json({
          message: `Sản phẩm ${item.product_id.name} không đủ số lượng`
        });
      }
    }

    // Create order
    const order = await Order.create({
      user_id: req.user.userId,
      total_amount: cart.total_price,
      payment_method,
      payment_status: 'pending',
      status: 'pending'
    });

    // Create order details and update stock
    for (const item of cartItems) {
      await OrderDetail.create({
        order_id: order._id,
        product_id: item.product_id._id,
        quantity: item.quantity,
        price: item.product_id.price
      });

      // Update product stock
      await Product.findByIdAndUpdate(item.product_id._id, {
        $inc: { stock: -item.quantity }
      });
    }

    // Clear cart
    await CartItem.deleteMany({ cart_id: cart._id });
    cart.total_price = 0;
    await cart.save();

    const orderDetails = await OrderDetail.find({ order_id: order._id })
      .populate('product_id');

    res.status(201).json({ message: 'Đặt hàng thành công', order, orderDetails });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi tạo đơn hàng', error: error.message });
  }
});

// Update order status (Manager/Admin only)
router.patch('/:id/status', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    res.json({ message: 'Cập nhật trạng thái đơn hàng thành công', order });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật trạng thái', error: error.message });
  }
});

// Update payment status (Manager/Admin only)
router.patch('/:id/payment', authenticate, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { payment_status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { payment_status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    res.json({ message: 'Cập nhật trạng thái thanh toán thành công', order });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật trạng thái thanh toán', error: error.message });
  }
});

module.exports = router;


