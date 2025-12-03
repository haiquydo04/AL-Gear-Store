import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './ProductDetail.css';

const assuranceList = [
  { title: 'Lắp ráp chuẩn GEARVN', desc: 'Dán tem bảo hành · Test burn-in 12h' },
  { title: 'Ưu đãi nâng cấp', desc: 'Giảm 10% phụ kiện kèm combo' },
  { title: 'Hỗ trợ tận nơi', desc: 'Kỹ thuật viên onsite trong 24h' }
];

const supportList = [
  { title: 'Chat tư vấn', value: 'Messenger · Zalo · Hotline' },
  { title: 'Mở rộng bảo hành', value: 'Từ 24 - 36 tháng' },
  { title: 'Trả góp 0%', value: 'Thẻ tín dụng · Ví điện tử' }
];

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await axios.get(`/api/products/${id}`);
      setProduct(res.data);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`/api/reviews/product/${id}`);
      setReviews(res.data.reviews);
      setAvgRating(res.data.avgRating);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (product?.stock === 0) {
      alert('Sản phẩm này đã hết hàng');
      return;
    }

    try {
      await axios.post('/api/cart/items', {
        product_id: id,
        quantity
      });
      alert('Đã thêm vào giỏ hàng!');
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi thêm vào giỏ hàng');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await axios.post('/api/reviews', {
        product_id: id,
        ...reviewForm
      });
      setReviewForm({ rating: 5, comment: '' });
      setShowReviewForm(false);
      fetchReviews();
      alert('Đánh giá thành công!');
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi gửi đánh giá');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  if (loading) {
    return <div className="loading">Đang tải chi tiết sản phẩm...</div>;
  }

  if (!product) {
    return <div className="error">Không tìm thấy sản phẩm</div>;
  }

  return (
    <div className="product-detail">
      <div className="container">
        <div className="detail-grid">
          <div className="detail-gallery">
            <img
              src={product.image_url || 'https://via.placeholder.com/600x480?text=AL+Gear'}
              alt={product.name}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/600x480?text=AL+Gear';
              }}
            />
            <div className="gallery-note">
              <span>hình demo</span>
              <p>Hình ảnh mang tính chất minh họa bộ PC/gear.</p>
            </div>
          </div>

          <div className="detail-info">
            <span className="badge">GEARVN EXCLUSIVE</span>
            <h1>{product.name}</h1>
            {product.short_description && <p className="short-description">{product.short_description}</p>}
            <p className="price">{formatPrice(product.price)}</p>
            <div className="detail-meta">
              <span>Đánh giá {avgRating.toFixed(1)} / 5 ({reviews.length} đánh giá)</span>
              <span>Kho: {product.stock} sản phẩm</span>
              <span>Bảo hành: {product.warranty_months} tháng</span>
              <span>Xuất xứ: {product.origin || 'Đang cập nhật'}</span>
            </div>
            <p className="description">{product.description}</p>

            <div className="detail-actions">
              <div className="quantity-input">
                <label>Số lượng</label>
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
              <button
                onClick={handleAddToCart}
                className="btn btn-primary"
                disabled={product.stock === 0}
              >
                {product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
              </button>
            </div>

            <div className="detail-perks">
              {assuranceList.map(item => (
                <div key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="detail-panels">
          <div className="glow-card">
            <h3>Thông tin chi tiết</h3>
            <p className="description">{product.description}</p>
            {product.details && (
              <>
                <h4>Chi tiết kỹ thuật</h4>
                <p className="description">{product.details}</p>
              </>
            )}
          </div>
          <div className="glow-card detail-support">
            <h3>Dịch vụ kèm theo</h3>
            <ul>
              {supportList.map(item => (
                <li key={item.title}>
                  <strong>{item.title}</strong>
                  <span>{item.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="reviews-section">
          <div className="reviews-heading">
            <div>
              <span className="section-eyebrow">Đánh giá</span>
              <h2>Khách hàng nói gì?</h2>
            </div>
            {user && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="btn btn-secondary"
              >
                {showReviewForm ? 'Hủy' : 'Viết đánh giá'}
              </button>
            )}
          </div>

          {showReviewForm && user && (
            <form onSubmit={handleSubmitReview} className="review-form">
              <div>
                <label>Đánh giá</label>
                <select
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, rating: Number(e.target.value) }))}
                >
                  <option value="5">5 sao</option>
                  <option value="4">4 sao</option>
                  <option value="3">3 sao</option>
                  <option value="2">2 sao</option>
                  <option value="1">1 sao</option>
                </select>
              </div>
              <div>
                <label>Nhận xét</label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  rows="4"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">Gửi đánh giá</button>
            </form>
          )}

          <div className="reviews-list">
            {reviews.map(review => (
              <div key={review._id} className="review-item">
                <div className="review-header">
                  <strong>{review.user_id?.full_name || 'Khách'}</strong>
                  <span className="rating-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                </div>
                <p>{review.comment}</p>
                <small>{new Date(review.created_at).toLocaleDateString('vi-VN')}</small>
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="no-review">Chưa có đánh giá nào</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;


