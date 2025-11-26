import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthLayout.css';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await register(formData);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="container auth-shell">
        <div className="auth-panel auth-panel--brand">
          <span className="badge">Khởi tạo tài khoản</span>
          <h1>Gia nhập cộng đồng game thủ AL Gear Store</h1>
          <p>Nhận ưu đãi độc quyền, lưu lịch sử build PC và quản lý bảo hành ngay trong một chạm.</p>
          <ul className="auth-perks register-perks">
            <li>Tặng voucher 200k cho đơn đầu tiên</li>
            <li>Ưu tiên đặt lịch build PC</li>
            <li>Báo cáo đơn hàng thời gian thực</li>
          </ul>
        </div>

        <div className="auth-panel auth-panel--form">
          <h2>Đăng ký</h2>
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
            <div>
              <label>Họ và tên:</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                className="input"
              />
            </div>
            <div>
              <label>Email:</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input"
              />
            </div>
            <div>
              <label>Số điện thoại:</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input"
              />
            </div>
            <div>
              <label>Địa chỉ:</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="input"
              />
            </div>
            <button type="submit" className="btn btn-primary">Đăng ký</button>
          </form>
          <p className="auth-switch">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

