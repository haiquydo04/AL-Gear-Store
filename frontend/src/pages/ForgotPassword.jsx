import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthLayout.css';
import './Login.css';

const ForgotPassword = () => {
  const { requestPasswordReset, completePasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [devToken, setDevToken] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');

  const handleRequest = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setGeneratedPassword('');

    const result = await requestPasswordReset(email);
    if (result.success) {
      setMessage(result.data?.message || 'Đã gửi yêu cầu khôi phục mật khẩu.');
      setDevToken(result.data?.token || '');
      setStep(2);
    } else {
      setError(result.message);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const result = await completePasswordReset(token);
    if (result.success) {
      setMessage(result.data?.message || 'Đã đặt lại mật khẩu.');
      setGeneratedPassword(result.data?.newPassword || '');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="container auth-shell">
        <div className="auth-panel auth-panel--brand">
          <span className="badge">Khôi phục tài khoản</span>
          <h1>Quên mật khẩu?</h1>
          <p>Nhập email đăng ký, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu và mật khẩu mới sau khi xác thực.</p>
        </div>

        <div className="auth-panel auth-panel--form">
          <h2>Quên mật khẩu</h2>
          {error && <div className="error">{error}</div>}
          {message && <div className="success">{message}</div>}

          {step === 1 && (
            <form onSubmit={handleRequest}>
              <div>
                <label>Email đã đăng ký:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="input"
                />
              </div>
              <button type="submit" className="btn btn-primary">Gửi yêu cầu</button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleReset}>
              <div>
                <label>Nhập token xác nhận:</label>
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  className="input"
                />
                {devToken && (
                  <small className="dev-hint">
                    Token DEV: <code>{devToken}</code>
                  </small>
                )}
              </div>
              <button type="submit" className="btn btn-primary">Xác nhận</button>
            </form>
          )}

          {generatedPassword && (
            <div className="info-box">
              <p>Mật khẩu mới (DEV): <code>{generatedPassword}</code></p>
              <small>Đăng nhập và đổi mật khẩu ngay sau khi vào hệ thống.</small>
            </div>
          )}

          <p className="auth-switch">
            <Link to="/login">Quay về đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

