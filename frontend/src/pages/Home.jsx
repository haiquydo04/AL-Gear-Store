import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

const heroServiceBadges = [
  { title: 'Build PC theo yêu cầu', desc: 'Kỹ thuật viên GEARVN chuẩn hóa quy trình lắp ráp' },
  { title: 'Giao nhanh 2H', desc: 'Nội thành HCM/Hà Nội, COD toàn quốc' },
  { title: 'Bảo hành 24h', desc: 'Hỗ trợ mang máy đến showroom hoặc onsite' }
];

const comboShowcase = [
  {
    title: 'Combo RTX 4080 Xtreme',
    desc: 'Ryzen 7 7800X3D · 32GB DDR5 · NVMe 2TB · màn 240Hz',
    badge: 'HOT DEAL',
    price: '47.990.000đ'
  },
  {
    title: 'Laptop Gaming OLED',
    desc: 'ROG Zephyrus G16 · RTX 4070 · 240Hz OLED · 1.9kg',
    badge: 'GEARVN DROP',
    price: '39.990.000đ'
  }
];

const trendingFilters = ['RTX 40 Series', 'Laptop OLED', 'Bàn phím custom', 'Ghế công thái học', 'Màn 240Hz', 'Combo stream'];

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [categoriesRes, productsRes] = await Promise.all([
        axios.get('/api/categories'),
        axios.get('/api/products?limit=8')
      ]);
      setCategories(categoriesRes.data);
      setFeaturedProducts(productsRes.data.products || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const heroStats = [
    { label: 'Sản phẩm hot', value: `${featuredProducts.length}+` },
    { label: 'Danh mục cao cấp', value: categories.length },
    { label: 'Bảo hành', value: '24h' }
  ];

  if (loading) {
    return (
      <div className="loading">
        <span>Đang tải showroom GEARVN...</span>
      </div>
    );
  }

  return (
    <div className="home">
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-content">
            <span className="section-eyebrow">GEARVN SIGNATURE</span>
            <h1>
              Siêu thị gaming gear <span>AL Gear Store</span>
            </h1>
            <p>
              Build PC chiến game, gear chính hãng, giao nhanh tại Việt Nam. Trải nghiệm phong cách Tech Shop
              đậm chất gaming với mức giá cực tốt.
            </p>
            <div className="hero-actions">
              <Link to="/products" className="btn btn-primary">Khám phá ngay</Link>
              <Link to="/products" className="btn btn-secondary">Xem combo build</Link>
            </div>
            <div className="hero-stats">
              {heroStats.map(stat => (
                <div key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-gear-card">
              <span className="badge">GEARVN DROP</span>
              <h3>Full set gaming</h3>
              <p>Build RTX + màn 240Hz</p>
              <div className="tag">Limited 2025</div>
              <div className="hero-gradient" />
            </div>
            <div className="hero-panel">
              <div className="hero-panel-headline">
                <p>Miễn phí lắp ráp · Ship nhanh nội thành</p>
                <Link to="/products">Đặt lịch build</Link>
              </div>
              <ul>
                {heroServiceBadges.map(item => (
                  <li key={item.title}>
                    <strong>{item.title}</strong>
                    <span>{item.desc}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="home-marquee">
        <div className="marquee-track">
          {trendingFilters.concat(trendingFilters).map((filter, index) => (
            <span key={`${filter}-${index}`}>{filter}</span>
          ))}
        </div>
      </div>

      <section className="tech-banner">
        <div className="container banner-content">
          <div>
            <span className="badge">Banner</span>
            <h2>GEARVN TECH FEST · GIẢM 25%</h2>
            <p>Tặng kèm quạt ARGB + bảo hành nâng cao cho mọi đơn PC trên 25 triệu.</p>
          </div>
          <Link to="/products" className="btn btn-primary">Săn deal ngay</Link>
        </div>
      </section>

      <section className="home-service section-padding">
        <div className="container service-grid">
          {heroServiceBadges.map(item => (
            <div key={item.title} className="service-card">
              <strong>{item.title}</strong>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="categories section-padding">
        <div className="container">
          <div className="section-heading">
            <span className="section-eyebrow">Danh mục</span>
            <h2 className="section-title">Chọn nhanh theo hệ sinh thái</h2>
            <p className="section-subtitle">Combo PC Gaming, Laptop RTX, Gaming Gear, màn hình 240Hz...</p>
          </div>
          <div className="category-grid">
            {categories.map(category => (
              <Link
                key={category._id}
                to={`/products?category=${category._id}`}
                className="category-card"
              >
                <div>
                  <p className="category-name">{category.category_name}</p>
                  <p className="category-desc">{category.description}</p>
                </div>
                <span>Khám phá</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="home-spotlight section-padding">
        <div className="container spotlight-grid">
          {comboShowcase.map(combo => (
            <div key={combo.title} className="spotlight-card">
              <div className="spotlight-top">
                <span className="badge">{combo.badge}</span>
                <h3>{combo.title}</h3>
                <p>{combo.desc}</p>
              </div>
              <div className="spotlight-bottom">
                <span className="spotlight-price">{combo.price}</span>
                <Link to="/products" className="btn btn-primary">Đặt ngay</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="featured-products section-padding">
        <div className="container">
          <div className="section-heading">
            <span className="section-eyebrow">Sản phẩm nổi bật</span>
            <h2 className="section-title">Deal gaming hot nhất tuần</h2>
          </div>
          <div className="grid featured-grid">
            {featuredProducts.map(product => (
              <Link key={product._id} to={`/products/${product._id}`} className="product-card">
                <img
                  src={product.image_url || 'https://via.placeholder.com/400x220?text=AL+Gear'}
                  alt={product.name}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x220?text=AL+Gear';
                  }}
                />
                <h3>{product.name}</h3>
                <p className="price">{formatPrice(product.price)}</p>
                <p className="stock">Còn {product.stock} sản phẩm</p>
              </Link>
            ))}
          </div>
          <div className="featured-cta">
            <Link to="/products" className="btn btn-primary">Xem toàn bộ showroom</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;


