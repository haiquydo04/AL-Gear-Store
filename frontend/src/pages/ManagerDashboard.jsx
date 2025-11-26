import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './ManagerDashboard.css';

const ManagerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0
  });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [newProduct, setNewProduct] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    stock: '',
    image_url: ''
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!user || (user.role !== 'manager' && user.role !== 'admin')) {
      navigate('/');
      return;
    }
    fetchStats();
    fetchCategories();
  }, [user]);

  const fetchStats = async () => {
    try {
      const [productsRes, ordersRes] = await Promise.all([
        axios.get('/api/products'),
        axios.get('/api/orders')
      ]);
      
      const totalSales = ordersRes.data.reduce((sum, order) => sum + order.total_amount, 0);
      
      setStats({
        totalProducts: productsRes.data.products?.length || 0,
        totalOrders: ordersRes.data.length,
        totalSales
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      setCategories(res.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/products', newProduct);
      alert('Tạo sản phẩm thành công!');
      setNewProduct({
        category_id: '',
        name: '',
        description: '',
        price: '',
        stock: '',
        image_url: ''
      });
      fetchStats();
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi tạo sản phẩm');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div className="manager-dashboard">
      <div className="container">
        <h1>Bảng điều khiển Quản lý</h1>
        
        <div className="dashboard-tabs">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Tổng quan
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
          <button
            className={activeTab === 'reports' ? 'active' : ''}
            onClick={() => setActiveTab('reports')}
          >
            Báo cáo
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="stats-grid">
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

        {activeTab === 'products' && (
          <div className="management-section">
            <h2>Quản lý sản phẩm</h2>
            <div className="create-product-form">
              <h3>Tạo sản phẩm mới</h3>
              <form onSubmit={handleCreateProduct}>
                <div>
                  <label>Danh mục:</label>
                  <select
                    value={newProduct.category_id}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, category_id: e.target.value }))}
                    required
                    className="input"
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.category_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Tên sản phẩm:</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label>Mô tả:</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                    className="input"
                    rows="4"
                  />
                </div>
                <div>
                  <label>Giá:</label>
                  <input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label>Số lượng:</label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, stock: e.target.value }))}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label>URL hình ảnh:</label>
                  <input
                    type="text"
                    value={newProduct.image_url}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, image_url: e.target.value }))}
                    className="input"
                  />
                </div>
                <button type="submit" className="btn btn-primary">Tạo sản phẩm</button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'orders' && <OrderManagement />}
        {activeTab === 'reports' && <ReportsManagement />}
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
                <td>
                  <button className="btn btn-sm">Xem chi tiết</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ReportsManagement = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('monthly');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await axios.get('/api/reports');
      setReports(res.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      await axios.post('/api/reports/generate', {
        report_type: reportType,
        report_period: new Date().toISOString().split('T')[0]
      });
      alert('Tạo báo cáo thành công!');
      fetchReports();
    } catch (error) {
      alert('Lỗi tạo báo cáo');
    }
  };

  if (loading) return <div className="loading">Đang tải...</div>;

  return (
    <div className="management-section">
      <h2>Quản lý báo cáo</h2>
      <div className="generate-report">
        <h3>Tạo báo cáo mới</h3>
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="input"
        >
          <option value="daily">Hàng ngày</option>
          <option value="weekly">Hàng tuần</option>
          <option value="monthly">Hàng tháng</option>
          <option value="yearly">Hàng năm</option>
        </select>
        <button onClick={generateReport} className="btn btn-primary">Tạo báo cáo</button>
      </div>
      <div className="reports-list">
        {reports.map(report => (
          <div key={report._id} className="report-card">
            <h4>Báo cáo {report.report_type}</h4>
            <p>Kỳ: {report.report_period}</p>
            <p>Tổng doanh thu: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(report.total_sales)}</p>
            <p>Ngày tạo: {new Date(report.created_at).toLocaleDateString('vi-VN')}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManagerDashboard;


