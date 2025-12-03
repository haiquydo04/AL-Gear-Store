import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        return;
      }
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post('/api/auth/login', { username, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      return { success: true, user };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Đăng nhập thất bại' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Đăng ký thất bại' };
    }
  };

  const requestPasswordReset = async (email) => {
    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Không thể gửi yêu cầu' };
    }
  };

  const completePasswordReset = async (token) => {
    try {
      const response = await axios.post('/api/auth/reset-password', { token });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Không thể đặt lại mật khẩu' };
    }
  };

  const changePassword = async (payload) => {
    try {
      const response = await axios.post('/api/auth/change-password', payload);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Đổi mật khẩu thất bại' };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    requestPasswordReset,
    completePasswordReset,
    changePassword,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

