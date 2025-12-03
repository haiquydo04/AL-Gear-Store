const mongoose = require('mongoose');

const guestCartItemSchema = new mongoose.Schema({
  guest_cart_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GuestCart',
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

guestCartItemSchema.index({ guest_cart_id: 1, product_id: 1 }, { unique: true });

module.exports = mongoose.model('GuestCartItem', guestCartItemSchema);




