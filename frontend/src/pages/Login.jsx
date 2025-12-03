import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthLayout.css';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(formData.username, formData.password);
    if (result.success) {
      if (result.user.role === 'admin') {
        navigate('/admin');
      } else if (result.user.role === 'manager') {
        navigate('/manager');
      } else {
        navigate('/');
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="container auth-shell">
        <div className="auth-panel auth-panel--brand">
          <span className="badge">AL Gear Store</span>
          <h1>Đăng nhập để đồng bộ đơn hàng</h1>
          <p>Truy cập lịch sử mua sắm, theo dõi bảo hành và nhận ưu đãi độc quyền từ showroom GEARVN.</p>
          <ul className="auth-perks login-perks">
            <li>Khóa học build PC miễn phí</li>
            <li>Thông báo bảo hành 24h</li>
            <li>Ưu đãi combo gear mỗi tuần</li>
          </ul>
        </div>

        <div className="auth-panel auth-panel--form">
          <h2>Đăng nhập</h2>
          {error && <div className="error">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div>
              <label>Tên đăng nhập:</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="input"
              />
            </div>
            <div>
              <label>Mật khẩu:</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input"
              />
            </div>
            <button type="submit" className="btn btn-primary">Đăng nhập</button>
          </form>
          <p className="auth-switch">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </p>
          <p className="auth-switch">
            Quên mật khẩu? <Link to="/forgot-password">Khôi phục tại đây</Link>
          </p>
          <div className="demo-accounts">
            <p><strong>Tài khoản demo:</strong></p>
            <p>Admin: admin / 123456</p>
            <p>Manager: manager1 / 123456</p>
            <p>Customer: customer1 / 123456</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

