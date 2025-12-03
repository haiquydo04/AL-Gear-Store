const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const CartItem = require('../models/CartItem');
const GuestCart = require('../models/GuestCart');
const GuestCartItem = require('../models/GuestCartItem');
const Product = require('../models/Product');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Get user cart
router.get('/', authenticate, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user_id: req.user.userId })
      .populate({
        path: 'user_id',
        select: 'full_name email'
      });

    if (!cart) {
      cart = await Cart.create({
        user_id: req.user.userId,
        total_price: 0
      });
    }

    const items = await CartItem.find({ cart_id: cart._id })
      .populate('product_id');

    res.json({ cart, items });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy giỏ hàng', error: error.message });
  }
});

// Add item to cart
router.post('/items', authenticate, async (req, res) => {
  try {
    const { product_id, quantity } = req.body;

    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    if (product.stock === 0) {
      return res.status(400).json({ message: 'Sản phẩm này đã hết hàng' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Số lượng sản phẩm không đủ' });
    }

    let cart = await Cart.findOne({ user_id: req.user.userId });
    if (!cart) {
      cart = await Cart.create({
        user_id: req.user.userId,
        total_price: 0
      });
    }

    const subtotal = product.price * quantity;
    let cartItem = await CartItem.findOne({ cart_id: cart._id, product_id });

    if (cartItem) {
      cartItem.quantity += quantity;
      cartItem.subtotal = cartItem.quantity * product.price;
      await cartItem.save();
    } else {
      cartItem = await CartItem.create({
        cart_id: cart._id,
        product_id,
        quantity,
        subtotal
      });
    }

    // Update cart total
    const items = await CartItem.find({ cart_id: cart._id });
    cart.total_price = items.reduce((sum, item) => sum + item.subtotal, 0);
    await cart.save();

    res.json({ message: 'Thêm vào giỏ hàng thành công', cartItem });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi thêm vào giỏ hàng', error: error.message });
  }
});

// Update cart item
router.put('/items/:id', authenticate, async (req, res) => {
  try {
    const { quantity } = req.body;
    const cartItem = await CartItem.findById(req.params.id).populate('product_id');

    if (!cartItem) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }

    const cart = await Cart.findById(cartItem.cart_id);
    if (cart.user_id.toString() !== req.user.userId?.toString()) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    if (cartItem.product_id.stock === 0) {
      return res.status(400).json({ message: 'Sản phẩm này đã hết hàng' });
    }

    if (cartItem.product_id.stock < quantity) {
      return res.status(400).json({ message: 'Số lượng sản phẩm không đủ' });
    }

    cartItem.quantity = quantity;
    cartItem.subtotal = cartItem.product_id.price * quantity;
    await cartItem.save();

    // Update cart total
    const items = await CartItem.find({ cart_id: cart._id });
    cart.total_price = items.reduce((sum, item) => sum + item.subtotal, 0);
    await cart.save();

    res.json({ message: 'Cập nhật giỏ hàng thành công', cartItem });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật giỏ hàng', error: error.message });
  }
});

// Remove item from cart
router.delete('/items/:id', authenticate, async (req, res) => {
  try {
    const cartItem = await CartItem.findById(req.params.id);
    if (!cartItem) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
    }

    const cart = await Cart.findById(cartItem.cart_id);
    if (cart.user_id.toString() !== req.user.userId?.toString()) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    await CartItem.findByIdAndDelete(req.params.id);

    // Update cart total
    const items = await CartItem.find({ cart_id: cart._id });
    cart.total_price = items.reduce((sum, item) => sum + item.subtotal, 0);
    await cart.save();

    res.json({ message: 'Xóa sản phẩm khỏi giỏ hàng thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi xóa sản phẩm khỏi giỏ hàng', error: error.message });
  }
});

// Guest cart operations
router.post('/guest', optionalAuth, async (req, res) => {
  try {
    const { session_id, product_id, quantity } = req.body;

    const product = await Product.findById(product_id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    let guestCart = await GuestCart.findOne({ session_id });
    if (!guestCart) {
      guestCart = await GuestCart.create({
        session_id,
        total_price: 0,
        expired_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });
    }

    const subtotal = product.price * quantity;
    let cartItem = await GuestCartItem.findOne({ guest_cart_id: guestCart._id, product_id });

    if (cartItem) {
      cartItem.quantity += quantity;
      cartItem.subtotal = cartItem.quantity * product.price;
      await cartItem.save();
    } else {
      cartItem = await GuestCartItem.create({
        guest_cart_id: guestCart._id,
        product_id,
        quantity,
        subtotal
      });
    }

    const items = await GuestCartItem.find({ guest_cart_id: guestCart._id });
    guestCart.total_price = items.reduce((sum, item) => sum + item.subtotal, 0);
    await guestCart.save();

    res.json({ message: 'Thêm vào giỏ hàng thành công', cartItem });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi thêm vào giỏ hàng', error: error.message });
  }
});

router.get('/guest/:sessionId', optionalAuth, async (req, res) => {
  try {
    const guestCart = await GuestCart.findOne({ session_id: req.params.sessionId });
    if (!guestCart) {
      return res.json({ cart: null, items: [] });
    }

    const items = await GuestCartItem.find({ guest_cart_id: guestCart._id })
      .populate('product_id');

    res.json({ cart: guestCart, items });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy giỏ hàng', error: error.message });
  }
});

module.exports = router;




