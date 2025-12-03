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
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchStats();
    refreshCategories();
  }, [user]);

  const refreshCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      setCategories(res.data);
    } catch (error) {
      console.error('Error fetching categories', error);
    }
  };

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
          {['dashboard', 'categories', 'products', 'reviews', 'users', 'orders'].map(tab => (
            <button
              key={tab}
              className={activeTab === tab ? 'active' : ''}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'dashboard' && 'Tổng quan'}
              {tab === 'categories' && 'Danh mục'}
              {tab === 'products' && 'Sản phẩm'}
              {tab === 'reviews' && 'Đánh giá'}
              {tab === 'users' && 'Tài khoản'}
              {tab === 'orders' && 'Đơn hàng'}
            </button>
          ))}
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

        {activeTab === 'categories' && (
          <CategoryManagement categories={categories} onRefresh={refreshCategories} />
        )}
        {activeTab === 'products' && (
          <ProductManagement categories={categories} onRefreshCategories={refreshCategories} />
        )}
        {activeTab === 'reviews' && <ReviewManagement />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'orders' && <OrderManagement />}
      </div>
    </div>
  );
};

const CategoryManagement = ({ categories, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [formData, setFormData] = useState({
    category_name: '',
    code: '',
    description: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  const filteredCategories = categories.filter(cat => {
    const keyword = search.toLowerCase();
    return (
      cat.category_name.toLowerCase().includes(keyword) ||
      cat.code?.toLowerCase().includes(keyword)
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      if (editingId) {
        await axios.put(`/api/categories/${editingId}`, formData);
        setMessage('Cập nhật danh mục thành công');
      } else {
        await axios.post('/api/categories', formData);
        setMessage('Thêm danh mục thành công');
      }
      setFormData({ category_name: '', code: '', description: '' });
      setEditingId(null);
      onRefresh();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (category) => {
    setEditingId(category._id);
    setFormData({
      category_name: category.category_name,
      code: category.code,
      description: category.description || ''
    });
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục?')) return;
    try {
      await axios.delete(`/api/categories/${id}`);
      onRefresh();
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể xóa danh mục');
    }
  };

  return (
    <div className="management-section split-layout">
      <div>
        <h2>Danh sách danh mục</h2>
        <input
          type="text"
          placeholder="Tìm theo tên hoặc mã"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
        />
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tên</th>
                <th>Mã</th>
                <th>Mô tả</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map(cat => (
                <tr key={cat._id}>
                  <td>{cat.category_name}</td>
                  <td>{cat.code}</td>
                  <td>{cat.description}</td>
                  <td>
                    <button className="btn btn-sm" onClick={() => handleEdit(cat)}>Sửa</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleRemove(cat._id)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="form-card">
        <h3>{editingId ? 'Cập nhật danh mục' : 'Thêm danh mục'}</h3>
        {message && <div className={message.includes('thành công') ? 'success' : 'error'}>{message}</div>}
        <form onSubmit={handleSubmit}>
          <label>Tên danh mục</label>
          <input
            type="text"
            value={formData.category_name}
            onChange={(e) => setFormData(prev => ({ ...prev, category_name: e.target.value }))}
            required
          />
          <label>Mã code</label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
            required
          />
          <label>Mô tả</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
          />
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Cập nhật' : 'Thêm'}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEditingId(null);
                setFormData({ category_name: '', code: '', description: '' });
              }}
            >
              Hủy
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

const ProductManagement = ({ categories = [] }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    category_id: '',
    code: '',
    name: '',
    short_description: '',
    description: '',
    details: '',
    price: '',
    stock: '',
    warranty_months: 12,
    origin: '',
    image_url: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (search) params.append('search', search);
      const res = await axios.get(`/api/products?${params.toString()}`);
      setProducts(res.data.products || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      if (editingId) {
        await axios.put(`/api/products/${editingId}`, formData);
        setMessage('Cập nhật sản phẩm thành công');
      } else {
        await axios.post('/api/products', formData);
        setMessage('Thêm sản phẩm thành công');
      }
      setFormData({
        category_id: '',
        code: '',
        name: '',
        short_description: '',
        description: '',
        details: '',
        price: '',
        stock: '',
        warranty_months: 12,
        origin: '',
        image_url: ''
      });
      setEditingId(null);
      fetchProducts();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setFormData({
      category_id: product.category_id?._id || '',
      code: product.code,
      name: product.name,
      short_description: product.short_description,
      description: product.description || '',
      details: product.details || '',
      price: product.price,
      stock: product.stock,
      warranty_months: product.warranty_months || 12,
      origin: product.origin || '',
      image_url: product.image_url || ''
    });
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;
    try {
      await axios.delete(`/api/products/${id}`);
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể xóa sản phẩm');
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div className="management-section">
      <h2>Quản lý sản phẩm</h2>
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Tìm theo tên, mã, mô tả..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
          <option value="">Tất cả danh mục</option>
          {categories.map(cat => (
            <option key={cat._id} value={cat._id}>{cat.category_name}</option>
          ))}
        </select>
        <button className="btn btn-secondary" onClick={fetchProducts}>Lọc</button>
      </div>

      <div className="split-layout">
        <div className="table-container">
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên</th>
                  <th>Danh mục</th>
                  <th>Giá</th>
                  <th>Tồn</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product._id}>
                    <td>{product.code}</td>
                    <td>{product.name}</td>
                    <td>{product.category_id?.category_name}</td>
                    <td>{formatPrice(product.price)}</td>
                    <td>{product.stock}</td>
                    <td>
                      <button className="btn btn-sm" onClick={() => handleEdit(product)}>Sửa</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteProduct(product._id)}>Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="form-card">
          <h3>{editingId ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}</h3>
          {message && <div className={message.includes('thành công') ? 'success' : 'error'}>{message}</div>}
          <form onSubmit={handleSubmit}>
            <label>Danh mục</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
              required
            >
              <option value="">Chọn danh mục</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.category_name}</option>
              ))}
            </select>
            <label>Mã sản phẩm</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
              required
            />
            <label>Tên sản phẩm</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <label>Mô tả ngắn</label>
            <input
              type="text"
              value={formData.short_description}
              onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
              required
            />
            <label>Mô tả</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
            <label>Chi tiết</label>
            <textarea
              rows={3}
              value={formData.details}
              onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
            />
            <label>Giá</label>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
              min="0"
              required
            />
            <label>Số lượng tồn</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData(prev => ({ ...prev, stock: Number(e.target.value) }))}
              min="0"
              required
            />
            <label>Bảo hành (tháng)</label>
            <input
              type="number"
              value={formData.warranty_months}
              onChange={(e) => setFormData(prev => ({ ...prev, warranty_months: Number(e.target.value) }))}
              min="0"
            />
            <label>Xuất xứ</label>
            <input
              type="text"
              value={formData.origin}
              onChange={(e) => setFormData(prev => ({ ...prev, origin: e.target.value }))}
            />
            <label>Ảnh sản phẩm</label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
            />
            <button type="submit" className="btn btn-primary">
              {editingId ? 'Cập nhật' : 'Thêm'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    category_id: '',
                    code: '',
                    name: '',
                    short_description: '',
                    description: '',
                    details: '',
                    price: '',
                    stock: '',
                    warranty_months: 12,
                    origin: '',
                    image_url: ''
                  });
                }}
              >
                Hủy
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

const ReviewManagement = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = search ? `?search=${search}` : '';
      const res = await axios.get(`/api/reviews/admin${params}`);
      setReviews(res.data);
    } catch (error) {
      console.error('Error fetching reviews', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (id) => {
    try {
      await axios.patch(`/api/reviews/${id}/toggle-visibility`);
      fetchReviews();
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể cập nhật đánh giá');
    }
  };

  return (
    <div className="management-section">
      <h2>Quản lý đánh giá</h2>
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Tìm theo nội dung, sản phẩm, người dùng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn btn-secondary" onClick={fetchReviews}>Tìm kiếm</button>
      </div>
      <div className="table-container">
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Người dùng</th>
                <th>Đánh giá</th>
                <th>Nội dung</th>
                <th>Hiển thị</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map(review => (
                <tr key={review._id}>
                  <td>{review.product_id?.name}</td>
                  <td>{review.user_id?.full_name}</td>
                  <td>{review.rating}★</td>
                  <td>{review.comment}</td>
                  <td>{review.is_hidden ? 'Đang ẩn' : 'Đang hiển thị'}</td>
                  <td>
                    <button className="btn btn-sm" onClick={() => toggleVisibility(review._id)}>
                      {review.is_hidden ? 'Hiển thị' : 'Ẩn'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    phone: '',
    address: '',
    gender: 'unspecified',
    role: 'customer'
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      const res = await axios.get(`/api/users?${params.toString()}`);
      setUsers(res.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await axios.post('/api/users', formData);
      setMessage('Thêm tài khoản thành công');
      setFormData({
        username: '',
        password: '',
        full_name: '',
        email: '',
        phone: '',
        address: '',
        gender: 'unspecified',
        role: 'customer'
      });
      fetchUsers();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Không thể tạo tài khoản');
    }
  };

  const updateAccount = async (userId, payload) => {
    try {
      await axios.patch(`/api/users/${userId}/status`, payload);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể cập nhật tài khoản');
    }
  };

  const deleteAccount = async (userId) => {
    if (!window.confirm('Xóa tài khoản chưa kích hoạt?')) return;
    try {
      await axios.delete(`/api/users/${userId}`);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Không thể xóa tài khoản');
    }
  };

  return (
    <div className="management-section">
      <h2>Quản lý tài khoản</h2>
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Tìm theo tên, email, username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">Tất cả vai trò</option>
          <option value="customer">Customer</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <button className="btn btn-secondary" onClick={fetchUsers}>Tìm kiếm</button>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Username</th>
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
                  <td>
                    <select
                      value={user.account_id?.role_id?.role_name}
                      onChange={(e) => updateAccount(user._id, { role: e.target.value })}
                    >
                      <option value="customer">Customer</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={user.account_id?.status}
                      onChange={(e) => updateAccount(user._id, { status: e.target.value })}
                    >
                      <option value="active">active</option>
                      <option value="pending">pending</option>
                      <option value="inactive">inactive</option>
                      <option value="suspended">suspended</option>
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteAccount(user._id)}>
                      Xóa nếu chưa kích hoạt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="form-card">
        <h3>Thêm tài khoản mới</h3>
        {message && <div className={message.includes('thành công') ? 'success' : 'error'}>{message}</div>}
        <form onSubmit={handleCreate}>
          <label>Username</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
            required
          />
          <label>Mật khẩu</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            required
          />
          <label>Họ tên</label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            required
          />
          <label>Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
          <label>Số điện thoại</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          />
          <label>Địa chỉ</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          />
          <label>Giới tính</label>
          <select
            value={formData.gender}
            onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
          >
            <option value="unspecified">Không xác định</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </select>
          <label>Vai trò</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
          >
            <option value="customer">Customer</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" className="btn btn-primary">Thêm tài khoản</button>
        </form>
      </div>
    </div>
  );
};

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      const res = await axios.get(`/api/orders?${params.toString()}`);
      setOrders(res.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, value) => {
    try {
      await axios.patch(`/api/orders/${orderId}/status`, { status: value });
      fetchOrders();
    } catch (error) {
      alert('Lỗi cập nhật trạng thái đơn hàng');
    }
  };

  const updatePaymentStatus = async (orderId, value) => {
    try {
      await axios.patch(`/api/orders/${orderId}/payment`, { payment_status: value });
      fetchOrders();
    } catch (error) {
      alert('Lỗi cập nhật thanh toán');
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div className="management-section">
      <h2>Quản lý đơn hàng</h2>
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Tìm theo người nhận, số điện thoại, địa chỉ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ duyệt</option>
          <option value="processing">Đang xử lý</option>
          <option value="shipped">Đang giao</option>
          <option value="delivered">Đã giao</option>
          <option value="cancelled">Đã hủy</option>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        <button className="btn btn-secondary" onClick={fetchOrders}>Lọc</button>
      </div>
      <div className="table-container">
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Người nhận</th>
                <th>Tổng tiền</th>
                <th>Trạng thái</th>
                <th>Thanh toán</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td>#{order._id.slice(-8)}</td>
                  <td>{order.user_id?.full_name}</td>
                  <td>
                    <div>{order.shipping_name}</div>
                    <small>{order.shipping_phone}</small>
                    <br />
                    <small>{order.shipping_address}</small>
                  </td>
                  <td>{formatPrice(order.total_amount)}</td>
                  <td>
                    <select value={order.status} onChange={(e) => updateOrderStatus(order._id, e.target.value)}>
                      <option value="pending">pending</option>
                      <option value="processing">processing</option>
                      <option value="shipped">shipped</option>
                      <option value="delivered">delivered</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={order.payment_status}
                      onChange={(e) => updatePaymentStatus(order._id, e.target.value)}
                    >
                      <option value="pending">pending</option>
                      <option value="paid">paid</option>
                      <option value="failed">failed</option>
                      <option value="refunded">refunded</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;




