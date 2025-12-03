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
    const { search, status, from, to } = req.query;
    const query = {};

    if (req.user.role === 'customer') {
      query.user_id = req.user.userId;
    }

    if (status) {
      query.status = status;
    }

    if (from || to) {
      query.order_date = {};
      if (from) query.order_date.$gte = new Date(from);
      if (to) query.order_date.$lte = new Date(to);
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { shipping_name: { $regex: regex } },
        { shipping_phone: { $regex: regex } },
        { shipping_address: { $regex: regex } }
      ];
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
    const { payment_method, selectedItems, shippingInfo } = req.body;

    if (!shippingInfo?.name || !shippingInfo?.phone || !shippingInfo?.address) {
      return res.status(400).json({ message: 'Bạn cần phải điền đầy đủ thông tin trước khi thanh toán' });
    }

    if (!Array.isArray(selectedItems) || selectedItems.length === 0) {
      return res.status(400).json({ message: 'Bạn cần chọn ít nhất một sản phẩm để thanh toán' });
    }

    const cart = await Cart.findOne({ user_id: req.user.userId });
    if (!cart) {
      return res.status(404).json({ message: 'Giỏ hàng trống' });
    }

    const cartItems = await CartItem.find({
      cart_id: cart._id,
      _id: { $in: selectedItems }
    }).populate('product_id');

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Không tìm thấy sản phẩm hợp lệ trong giỏ hàng' });
    }

    for (const item of cartItems) {
      if (!item.product_id || item.product_id.stock <= 0) {
        return res.status(400).json({ message: `Sản phẩm ${item.product_id?.name || ''} đã hết hàng` });
      }
      if (item.product_id.stock < item.quantity) {
        return res.status(400).json({ message: `Sản phẩm ${item.product_id.name} không đủ số lượng` });
      }
    }

    const totalAmount = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

    const order = await Order.create({
      user_id: req.user.userId,
      total_amount: totalAmount,
      payment_method,
      payment_status: 'pending',
      status: 'pending',
      shipping_name: shippingInfo.name,
      shipping_phone: shippingInfo.phone,
      shipping_address: shippingInfo.address
    });

    for (const item of cartItems) {
      await OrderDetail.create({
        order_id: order._id,
        product_id: item.product_id._id,
        quantity: item.quantity,
        price: item.product_id.price
      });

      await Product.findByIdAndUpdate(item.product_id._id, {
        $inc: { stock: -item.quantity }
      });
    }

    await CartItem.deleteMany({ _id: { $in: selectedItems } });
    const remainingItems = await CartItem.find({ cart_id: cart._id });
    cart.total_price = remainingItems.reduce((sum, item) => sum + item.subtotal, 0);
    await cart.save();

    const orderDetails = await OrderDetail.find({ order_id: order._id })
      .populate('product_id');

    res.status(201).json({ message: 'Đơn hàng của bạn đã được tạo, cảm ơn bạn đã mua hàng tại AL, Vui lòng chờ xác nhận đơn hàng', order, orderDetails });
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

// Cancel order (customer before confirmation)
router.post('/:id/cancel', authenticate, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    if (req.user.role === 'customer' && order.user_id.toString() !== req.user.userId?.toString()) {
      return res.status(403).json({ message: 'Không có quyền hủy đơn hàng' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Đơn hàng đã được xác nhận, không thể hủy' });
    }

    order.status = 'cancelled';
    await order.save();

    res.json({ message: 'Đơn hàng đã được hủy', order });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi hủy đơn hàng', error: error.message });
  }
});

module.exports = router;




