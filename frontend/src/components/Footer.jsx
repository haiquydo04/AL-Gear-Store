import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-glow" />

      <div className="container footer-hero">
        <div>
          <span className="badge">Tech shop Việt Nam</span>
          <h2>GEARVN vibe · Build PC chiến game tại AL Gear Store</h2>
          <p>
            Thưởng thức showroom đậm chất gaming với full dịch vụ lắp ráp, bảo hành 24h và hệ sinh thái gear chính hãng.
          </p>
        </div>
        <div className="footer-hero-actions">
          <Link to="/products" className="btn btn-primary">Khám phá showroom</Link>
          <Link to="/products" className="btn btn-secondary">Đặt lịch build</Link>
        </div>
      </div>

      <div className="container footer-grid">
        <div className="footer-column footer-brand">
          <Link to="/" className="footer-logo">
            <span>AL</span> Gear Store
          </Link>
          <p>
            Hệ sinh thái gaming gear & hi-end PC đậm chất công nghệ. Kết nối cộng đồng game thủ cùng trải nghiệm chuẩn GEARVN.
          </p>
          <div className="footer-badges">
            <span>24/7 Support</span>
            <span>Free Ship 2H</span>
            <span>Bảo hành 24h</span>
          </div>
        </div>

        <div className="footer-column">
          <h4>Khám phá</h4>
          <ul>
            <li><Link to="/products">Sản phẩm</Link></li>
            <li><Link to="/products">PC Gaming</Link></li>
            <li><Link to="/products">Gaming Gear</Link></li>
            <li><Link to="/products">Laptop Gaming</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Hỗ trợ</h4>
          <ul>
            <li><Link to="/orders">Tra cứu đơn hàng</Link></li>
            <li><Link to="/profile">Trung tâm bảo hành</Link></li>
            <li><Link to="/login">Đăng nhập</Link></li>
            <li><Link to="/register">Tạo tài khoản</Link></li>
          </ul>
        </div>

        <div className="footer-column">
          <h4>Liên hệ</h4>
          <ul>
            <li>Hotline: 1900 966 999</li>
            <li>Email: support@algear.vn</li>
            <li>Showroom: 250 Nguyễn Thị Minh Khai, Q.10</li>
          </ul>
          <form className="footer-newsletter" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Nhập email nhận deal hot" />
            <button type="submit" className="btn btn-primary">Đăng ký</button>
          </form>
        </div>
      </div>

      <div className="footer-belt">
        <div className="container belt-grid">
          <div>
            <span className="belt-label">5000+</span>
            <small>Đơn PC mỗi năm</small>
          </div>
          <div>
            <span className="belt-label">15+</span>
            <small>Showroom & pick-up</small>
          </div>
          <div>
            <span className="belt-label">100%</span>
            <small>Hàng chính hãng</small>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-content">
          <p>© {new Date().getFullYear()} AL Gear Store · Inspired by GEARVN</p>
          <div className="footer-socials">
            <a href="https://facebook.com" target="_blank" rel="noreferrer">Facebook</a>
            <a href="https://tiktok.com" target="_blank" rel="noreferrer">TikTok</a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer">YouTube</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

