import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, changePassword } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    gender: 'unspecified',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`/api/users/${user.userId}`);
      setProfile(res.data);
      setFormData({
        full_name: res.data.full_name || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        address: res.data.address || '',
        gender: res.data.gender || 'unspecified',
        avatar_url: res.data.avatar_url || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage('Bạn nhập sai yêu cầu');
      return;
    }

    if (formData.phone && !/^[0-9]{9,15}$/.test(formData.phone)) {
      setMessage('Bạn nhập sai yêu cầu');
      return;
    }

    const confirmed = window.confirm('Bạn có muốn cập nhật thông tin tài khoản ?');
    if (!confirmed) {
      return;
    }

    try {
      await axios.put(`/api/users/${user.userId}`, formData);
      setMessage('Cập nhật thông tin thành công!');
      fetchProfile();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Lỗi cập nhật thông tin');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage('Mật khẩu xác nhận không khớp');
      return;
    }

    if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(passwordForm.newPassword)) {
      setPasswordMessage('Mật khẩu phải có ít nhất 8 ký tự bao gồm chữ và số');
      return;
    }

    const result = await changePassword(passwordForm);
    if (result.success) {
      setPasswordMessage('Đổi mật khẩu thành công');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setPasswordMessage(result.message);
    }
  };

  const handleAvatarUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setMessage('Ảnh đại diện vượt quá 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, avatar_url: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="profile-page">
      <div className="container">
        <h1>Thông tin tài khoản</h1>
        {message && (
          <div className={message.includes('thành công') ? 'success' : 'error'}>
            {message}
          </div>
        )}
        <div className="profile-card">
          <div className="profile-avatar">
            <img
              src={formData.avatar_url || 'https://via.placeholder.com/120?text=Avatar'}
              alt="Avatar"
            />
            <label className="upload-btn">
              Tải ảnh đại diện
              <input type="file" accept="image/*" onChange={handleAvatarUpload} />
            </label>
          </div>
          <form onSubmit={handleSubmit}>
            <div>
              <label>Tên đăng nhập:</label>
              <input
                type="text"
                value={user.username}
                disabled
                className="input"
              />
            </div>
            <div>
              <label>Vai trò:</label>
              <input
                type="text"
                value={user.role}
                disabled
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
            <div>
              <label>Giới tính:</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input"
              >
                <option value="unspecified">Không xác định</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Cập nhật thông tin</button>
          </form>
        </div>

        <div className="profile-card">
          <h2>Đổi mật khẩu</h2>
          {passwordMessage && (
            <div className={passwordMessage.includes('thành công') ? 'success' : 'error'}>
              {passwordMessage}
            </div>
          )}
          <form onSubmit={handlePasswordSubmit}>
            <div>
              <label>Mật khẩu cũ:</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                required
                className="input"
              />
            </div>
            <div>
              <label>Mật khẩu mới:</label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                required
                className="input"
              />
            </div>
            <div>
              <label>Xác nhận mật khẩu:</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                required
                className="input"
              />
            </div>
            <button type="submit" className="btn btn-secondary">Xác định</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;




