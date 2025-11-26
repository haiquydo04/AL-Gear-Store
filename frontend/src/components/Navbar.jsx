import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="navbar">
      <div className="container nav-wrapper">
        <Link to="/" className="nav-logo" onClick={closeMenu}>
          <span className="nav-logo-mark">AL</span>
          <div>
            <strong>Gear Store</strong>
            <small>GEARVN DNA</small>
          </div>
        </Link>

        <div className="nav-kpis">
          <span>Ship 2H nội thành</span>
          <span>COD toàn quốc</span>
          <span>Hotline 1900 966 999</span>
        </div>

        <button
          className={`nav-toggle ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(prev => !prev)}
          aria-label="Toggle navigation"
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav-menu ${menuOpen ? 'open' : ''}`}>
          <nav className="nav-links">
            <Link to="/" onClick={closeMenu}>Trang chủ</Link>
            <Link to="/products" onClick={closeMenu}>Sản phẩm</Link>
            <Link to="/products" onClick={closeMenu}>Khuyến mãi</Link>
            <Link to="/products" onClick={closeMenu}>Bộ sưu tập</Link>
          </nav>

          <div className="nav-quick-meta">
            <span>Support 24/7</span>
            <span>Bảo hành 24h</span>
            <span>Build PC theo yêu cầu</span>
          </div>

          <div className="nav-actions">
            <Link to="/cart" className="nav-cart" onClick={closeMenu}>
              <div className="nav-cart-icon">🛒</div>
              <div>
              <span>Giỏ hàng</span>
                <small>Ưu đãi freeship</small>
              </div>
              <span className="nav-cart-pill">New</span>
            </Link>
            {user ? (
              <>
                <Link to="/orders" className="nav-link" onClick={closeMenu}>Đơn hàng</Link>
                <Link to="/profile" className="nav-link" onClick={closeMenu}>Tài khoản</Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="nav-pill" onClick={closeMenu}>
                    Admin
                  </Link>
                )}
                {user.role === 'manager' && (
                  <Link to="/manager" className="nav-pill" onClick={closeMenu}>
                    Manager
                  </Link>
                )}
                <button onClick={handleLogout} className="btn btn-primary nav-logout">
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-pill" onClick={closeMenu}>
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn btn-primary" onClick={closeMenu}>
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;


