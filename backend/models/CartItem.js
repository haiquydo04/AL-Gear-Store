const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  cart_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart',
    required: true
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
});

cartItemSchema.index({ cart_id: 1, product_id: 1 }, { unique: true });

module.exports = mongoose.model('CartItem', cartItemSchema);




