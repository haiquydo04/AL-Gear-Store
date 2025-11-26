import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Cart.css';

const progressSteps = ['Giỏ hàng', 'Thông tin', 'Thanh toán', 'Hoàn tất'];

const Cart = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    try {
      const res = await axios.get('/api/cart');
      setCart(res.data.cart);
      setItems(res.data.items);
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    try {
      await axios.put(`/api/cart/items/${itemId}`, { quantity: newQuantity });
      fetchCart();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi cập nhật giỏ hàng');
    }
  };

  const removeItem = async (itemId) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      try {
        await axios.delete(`/api/cart/items/${itemId}`);
        fetchCart();
      } catch (error) {
        alert(error.response?.data?.message || 'Lỗi xóa sản phẩm');
      }
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      alert('Giỏ hàng trống!');
      return;
    }

    try {
      const res = await axios.post('/api/orders', { payment_method: paymentMethod });
      alert('Đặt hàng thành công!');
      navigate('/orders');
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi đặt hàng');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-header">
          <span className="section-eyebrow">Giỏ hàng</span>
          <h1>Setup của bạn</h1>
        </div>

        <div className="cart-progress">
          {progressSteps.map((step, index) => (
            <div key={step} className={`progress-step ${index === 0 ? 'active' : ''}`}>
              <span>{index + 1}</span>
              <p>{step}</p>
            </div>
          ))}
        </div>

        {items.length === 0 ? (
          <div className="empty-cart">
            <p>Giỏ hàng đang trống. Thêm sản phẩm để nhận ưu đãi ship 0đ.</p>
            <Link to="/products" className="btn btn-primary">Tiếp tục mua sắm</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              {items.map(item => (
                <div key={item._id} className="cart-item">
                  <Link to={`/products/${item.product_id._id}`}>
                    <img
                      src={item.product_id.image_url || 'https://via.placeholder.com/180x150?text=AL+Gear'}
                      alt={item.product_id.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/180x150?text=AL+Gear';
                      }}
                    />
                  </Link>
                  <div className="item-info">
                    <Link to={`/products/${item.product_id._id}`}>
                      <h3>{item.product_id.name}</h3>
                    </Link>
                    <p className="price">{formatPrice(item.product_id.price)}</p>
                  </div>
                  <div className="item-quantity">
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      disabled={item.quantity >= item.product_id.stock}
                    >
                      +
                    </button>
                  </div>
                  <div className="item-subtotal">
                    {formatPrice(item.subtotal)}
                  </div>
                  <button
                    onClick={() => removeItem(item._id)}
                    className="btn-remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="summary-card">
                <h2>Tổng kết đơn hàng</h2>
                <div className="summary-row">
                  <span>Thành tiền</span>
                  <strong>{formatPrice(cart?.total_price || 0)}</strong>
                </div>
                <div className="summary-row muted">
                  <span>Phí ship</span>
                  <strong>0đ (miễn phí nội thành)</strong>
                </div>
                <div className="payment-method">
                  <label>Phương thức thanh toán</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="cash">Tiền mặt</option>
                    <option value="credit_card">Thẻ tín dụng</option>
                    <option value="bank_transfer">Chuyển khoản</option>
                    <option value="e_wallet">Ví điện tử</option>
                  </select>
                </div>
                <button
                  onClick={handleCheckout}
                  className="btn btn-primary btn-checkout"
                >
                  Thanh toán
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;


