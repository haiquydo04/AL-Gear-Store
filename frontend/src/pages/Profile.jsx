import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

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
        address: res.data.address || ''
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
    try {
      await axios.put(`/api/users/${user.userId}`, formData);
      setMessage('Cập nhật thông tin thành công!');
      fetchProfile();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Lỗi cập nhật thông tin');
    }
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
            <button type="submit" className="btn btn-primary">Cập nhật thông tin</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;


