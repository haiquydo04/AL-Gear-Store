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
  const [selectedItems, setSelectedItems] = useState([]);
  const [useProfileInfo, setUseProfileInfo] = useState(true);
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [checkoutMessage, setCheckoutMessage] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchCart();
  }, [user]);

  useEffect(() => {
    if (user && useProfileInfo) {
      setShippingInfo({
        name: user.full_name || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user, useProfileInfo]);

  const fetchCart = async () => {
    try {
      const res = await axios.get('/api/cart');
      setCart(res.data.cart);
      setItems(res.data.items);
      setSelectedItems((prev) => {
        const availableIds = res.data.items
          .filter(item => item.product_id?.stock > 0)
          .map(item => item._id);
        if (prev.length === 0) {
          return availableIds;
        }
        const validIds = availableIds.filter(id => prev.includes(id));
        return validIds.length > 0 ? validIds : availableIds;
      });
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
        setSelectedItems(prev => prev.filter(id => id !== itemId));
        fetchCart();
      } catch (error) {
        alert(error.response?.data?.message || 'Lỗi xóa sản phẩm');
      }
    }
  };

  const toggleSelectItem = (itemId) => {
    setSelectedItems(prev => (
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    ));
  };

  const toggleSelectAll = (checked) => {
    if (checked) {
      const selectable = items
        .filter(item => item.product_id.stock > 0)
        .map(item => item._id);
      setSelectedItems(selectable);
    } else {
      setSelectedItems([]);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      setCheckoutMessage('Giỏ hàng trống!');
      return;
    }

    if (selectedItems.length === 0) {
      setCheckoutMessage('Bạn cần chọn ít nhất một sản phẩm để thanh toán');
      return;
    }

    if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
      setCheckoutMessage('Bạn cần phải điền đầy đủ thông tin trước khi thanh toán');
      return;
    }

    try {
      await axios.post('/api/orders', {
        payment_method: paymentMethod,
        selectedItems,
        shippingInfo: {
          name: shippingInfo.name.trim(),
          phone: shippingInfo.phone.trim(),
          address: shippingInfo.address.trim()
        }
      });
      setCheckoutMessage('Đặt hàng thành công! Đang chuyển đến trang đơn hàng.');
      fetchCart();
      setTimeout(() => navigate('/orders'), 800);
    } catch (error) {
      setCheckoutMessage(error.response?.data?.message || 'Lỗi đặt hàng');
    }
  };

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({ ...prev, [name]: value }));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const selectedTotal = items
    .filter(item => selectedItems.includes(item._id))
    .reduce((sum, item) => sum + item.subtotal, 0);

  const selectableIds = items.filter(item => item.product_id.stock > 0).map(item => item._id);
  const allSelected = selectableIds.length > 0 && selectedItems.length === selectableIds.length;

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
              <div className="cart-list-header">
                <label>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                  Chọn tất cả ({selectedItems.length}/{items.length})
                </label>
              </div>
              {items.map(item => (
                <div key={item._id} className="cart-item">
                  <div className="item-select">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item._id)}
                      onChange={() => toggleSelectItem(item._id)}
                      disabled={item.product_id.stock === 0}
                    />
                    {item.product_id.stock === 0 && (
                      <small className="inline-alert">Sản phẩm này đã hết hàng</small>
                    )}
                  </div>
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
                <h2>Thông tin nhận hàng</h2>
                <label className="checkbox-inline">
                  <input
                    type="checkbox"
                    checked={useProfileInfo}
                    onChange={(e) => setUseProfileInfo(e.target.checked)}
                  />
                  Mua cho tôi (dùng thông tin tài khoản)
                </label>
                <div className="shipping-fields">
                  <div>
                    <label>Họ và tên</label>
                    <input
                      type="text"
                      name="name"
                      value={shippingInfo.name}
                      onChange={handleShippingChange}
                      required
                    />
                  </div>
                  <div>
                    <label>Số điện thoại</label>
                    <input
                      type="tel"
                      name="phone"
                      value={shippingInfo.phone}
                      onChange={handleShippingChange}
                      required
                    />
                  </div>
                  <div>
                    <label>Địa chỉ nhận hàng</label>
                    <textarea
                      name="address"
                      value={shippingInfo.address}
                      onChange={handleShippingChange}
                      rows={3}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="summary-card">
                <h2>Tổng kết đơn hàng</h2>
                <p className="muted">Đã chọn {selectedItems.length} sản phẩm</p>
                <div className="summary-row">
                  <span>Thành tiền</span>
                  <strong>{formatPrice(selectedTotal)}</strong>
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
                {checkoutMessage && (
                  <div className={checkoutMessage.includes('thành công') ? 'success' : 'error'}>
                    {checkoutMessage}
                  </div>
                )}
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


