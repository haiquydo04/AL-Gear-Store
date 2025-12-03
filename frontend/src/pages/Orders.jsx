import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Orders.css';

const Orders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState('success');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/orders');
      setOrders(res.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const res = await axios.get(`/api/orders/${orderId}`);
      setSelectedOrder(res.data);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const handleCancelOrder = async (orderId) => {
    const confirmCancel = window.confirm('Bạn có muốn hủy đơn hàng này?');
    if (!confirmCancel) return;
    try {
      await axios.post(`/api/orders/${orderId}/cancel`);
      setFeedback('Đơn hàng đã được hủy');
      setFeedbackType('success');
      fetchOrders();
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Không thể hủy đơn hàng');
      setFeedbackType('error');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ffc107',
      processing: '#17a2b8',
      shipped: '#007bff',
      delivered: '#28a745',
      cancelled: '#dc3545'
    };
    return colors[status] || '#666';
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="orders-page">
      <div className="container">
        <h1>Đơn hàng của tôi</h1>
        {feedback && (
          <div className={feedbackType === 'success' ? 'success' : 'error'}>
            {feedback}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="no-orders">
            <p>Bạn chưa có đơn hàng nào</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div>
                    <strong>Mã đơn: #{order._id.slice(-8)}</strong>
                    <p>Ngày đặt: {new Date(order.order_date).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div className="order-status">
                    <span
                      style={{ backgroundColor: getStatusColor(order.status) }}
                      className="status-badge"
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
                <div className="order-info">
                  <p><strong>Tổng tiền:</strong> {formatPrice(order.total_amount)}</p>
                  <p><strong>Phương thức thanh toán:</strong> {order.payment_method}</p>
                  <p><strong>Trạng thái thanh toán:</strong> {order.payment_status}</p>
                  <p><strong>Người nhận:</strong> {order.shipping_name}</p>
                  <p><strong>Số điện thoại:</strong> {order.shipping_phone}</p>
                  <p><strong>Địa chỉ:</strong> {order.shipping_address}</p>
                </div>
                <button
                  onClick={() => fetchOrderDetails(order._id)}
                  className="btn btn-primary"
                >
                  Xem chi tiết
                </button>
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleCancelOrder(order._id)}
                    className="btn btn-secondary"
                  >
                    Hủy đơn hàng
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {selectedOrder && (
          <div className="order-details-modal" onClick={() => setSelectedOrder(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Chi tiết đơn hàng</h2>
              {selectedOrder.order && (
                <div className="order-shipping">
                  <p><strong>Người nhận:</strong> {selectedOrder.order.shipping_name}</p>
                  <p><strong>Số điện thoại:</strong> {selectedOrder.order.shipping_phone}</p>
                  <p><strong>Địa chỉ:</strong> {selectedOrder.order.shipping_address}</p>
                </div>
              )}
              <div className="order-details">
                {selectedOrder.orderDetails?.map((detail, idx) => (
                  <div key={idx} className="detail-item">
                    <img
                      src={detail.product_id?.image_url || 'https://via.placeholder.com/100'}
                      alt={detail.product_id?.name}
                    />
                    <div>
                      <h3>{detail.product_id?.name}</h3>
                      <p>Số lượng: {detail.quantity}</p>
                      <p>Giá: {formatPrice(detail.price)}</p>
                      <p>Tổng: {formatPrice(detail.quantity * detail.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="btn btn-secondary"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;




