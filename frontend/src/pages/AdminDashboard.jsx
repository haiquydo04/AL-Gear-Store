import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0
  });
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const [usersRes, productsRes, ordersRes] = await Promise.all([
        axios.get('/api/users'),
        axios.get('/api/products'),
        axios.get('/api/orders')
      ]);
      
      const totalSales = ordersRes.data.reduce((sum, order) => sum + order.total_amount, 0);
      
      setStats({
        totalUsers: usersRes.data.length,
        totalProducts: productsRes.data.products?.length || 0,
        totalOrders: ordersRes.data.length,
        totalSales
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div className="admin-dashboard">
      <div className="container">
        <h1>Bảng điều khiển Admin</h1>
        
        <div className="dashboard-tabs">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Tổng quan
          </button>
          <button
            className={activeTab === 'users' ? 'active' : ''}
            onClick={() => setActiveTab('users')}
          >
            Người dùng
          </button>
          <button
            className={activeTab === 'products' ? 'active' : ''}
            onClick={() => setActiveTab('products')}
          >
            Sản phẩm
          </button>
          <button
            className={activeTab === 'orders' ? 'active' : ''}
            onClick={() => setActiveTab('orders')}
          >
            Đơn hàng
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Tổng người dùng</h3>
              <p className="stat-value">{stats.totalUsers}</p>
            </div>
            <div className="stat-card">
              <h3>Tổng sản phẩm</h3>
              <p className="stat-value">{stats.totalProducts}</p>
            </div>
            <div className="stat-card">
              <h3>Tổng đơn hàng</h3>
              <p className="stat-value">{stats.totalOrders}</p>
            </div>
            <div className="stat-card">
              <h3>Tổng doanh thu</h3>
              <p className="stat-value">{formatPrice(stats.totalSales)}</p>
            </div>
          </div>
        )}

        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'products' && <ProductManagement />}
        {activeTab === 'orders' && <OrderManagement />}
      </div>
    </div>
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/users');
      setUsers(res.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId, status) => {
    try {
      await axios.patch(`/api/users/${userId}/status`, { status });
      fetchUsers();
    } catch (error) {
      alert('Lỗi cập nhật trạng thái');
    }
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div className="management-section">
      <h2>Quản lý người dùng</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Tên đăng nhập</th>
              <th>Họ tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>{user.account_id?.username}</td>
                <td>{user.full_name}</td>
                <td>{user.email}</td>
                <td>{user.account_id?.role_id?.role_name || 'N/A'}</td>
                <td>{user.account_id?.status || 'N/A'}</td>
                <td>
                  <select
                    value={user.account_id?.status}
                    onChange={(e) => updateUserStatus(user._id, e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/products');
      setProducts(res.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      try {
        await axios.delete(`/api/products/${productId}`);
        fetchProducts();
      } catch (error) {
        alert('Lỗi xóa sản phẩm');
      }
    }
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div className="management-section">
      <h2>Quản lý sản phẩm</h2>
      <div className="products-grid">
        {products.map(product => (
          <div key={product._id} className="product-admin-card">
            <img src={product.image_url || 'https://via.placeholder.com/200'} alt={product.name} />
            <h3>{product.name}</h3>
            <p>Giá: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</p>
            <p>Tồn kho: {product.stock}</p>
            <button
              onClick={() => deleteProduct(product._id)}
              className="btn btn-danger"
            >
              Xóa
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

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

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.patch(`/api/orders/${orderId}/status`, { status });
      fetchOrders();
    } catch (error) {
      alert('Lỗi cập nhật trạng thái đơn hàng');
    }
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div className="management-section">
      <h2>Quản lý đơn hàng</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Thanh toán</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order._id}>
                <td>#{order._id.slice(-8)}</td>
                <td>{order.user_id?.full_name || 'N/A'}</td>
                <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total_amount)}</td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td>{order.payment_status}</td>
                <td>
                  <button
                    onClick={() => updateOrderStatus(order._id, order.payment_status === 'paid' ? 'pending' : 'paid')}
                    className="btn btn-sm"
                  >
                    {order.payment_status === 'paid' ? 'Hủy thanh toán' : 'Đánh dấu đã thanh toán'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;


