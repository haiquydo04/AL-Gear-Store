import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './Products.css';

const quickFilters = ['RTX 40 Series', 'Laptop OLED', 'Combo stream', 'Bàn phím custom'];

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    search: searchParams.get('search') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || ''
  });
  const [pagination, setPagination] = useState({ page: Number(searchParams.get('page')) || 1, total: 0, pages: 0 });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const nextFilters = {
      category: searchParams.get('category') || '',
      search: searchParams.get('search') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || ''
    };
    setFilters(nextFilters);

    const pageFromParams = Number(searchParams.get('page')) || 1;
    setPagination(prev => ({ ...prev, page: pageFromParams }));
    fetchProducts(pageFromParams, nextFilters);
  }, [searchParams]);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      setCategories(res.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async (page = pagination.page, appliedFilters = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (appliedFilters.category) params.append('category', appliedFilters.category);
      if (appliedFilters.search) params.append('search', appliedFilters.search);
      if (appliedFilters.minPrice) params.append('minPrice', appliedFilters.minPrice);
      if (appliedFilters.maxPrice) params.append('maxPrice', appliedFilters.maxPrice);
      params.append('page', page);

      const res = await axios.get(`/api/products?${params.toString()}`);
      setProducts(res.data.products);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncSearchParams = (nextFilters, page = 1) => {
    const params = {};
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });
    params.page = page;
    setSearchParams(params);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    syncSearchParams(filters, 1);
  };

  const handleResetFilters = () => {
    const baseFilters = { category: '', search: '', minPrice: '', maxPrice: '' };
    setFilters(baseFilters);
    syncSearchParams(baseFilters, 1);
  };

  const clearFilter = (key) => {
    const updated = { ...filters, [key]: '' };
    setFilters(updated);
    syncSearchParams(updated, 1);
  };

  const handlePageChange = (nextPage) => {
    setPagination(prev => ({ ...prev, page: nextPage }));
    syncSearchParams(filters, nextPage);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const activeFilters = [
    filters.search && { key: 'search', label: `Từ khóa: ${filters.search}` },
    filters.category && {
      key: 'category',
      label: `Danh mục: ${categories.find(cat => cat._id === filters.category)?.category_name || 'Đã chọn'}`
    },
    filters.minPrice && { key: 'minPrice', label: `Giá từ ${formatPrice(Number(filters.minPrice))}` },
    filters.maxPrice && { key: 'maxPrice', label: `Giá đến ${formatPrice(Number(filters.maxPrice))}` }
  ].filter(Boolean);

  const totalVisible = pagination.total || products.length;

  return (
    <div className="products-page">
      <div className="container">
        <div className="products-toolbar">
          <div className="toolbar-copy">
            <span className="section-eyebrow">Showroom sản phẩm</span>
            <h1>Săn gear chính hãng</h1>
            <p>Chọn nhanh combo build PC, laptop RTX, gear streamer với bộ lọc thông minh.</p>
          </div>
          <div className="toolbar-meta">
            <div className="chip">
              <strong>{totalVisible}</strong>
              <span>Sản phẩm</span>
            </div>
            <div className="chip">
              <strong>{categories.length}</strong>
              <span>Danh mục</span>
            </div>
            <button className="btn btn-secondary" onClick={handleResetFilters}>
              Xóa bộ lọc
            </button>
          </div>
        </div>

        <div className="filters-panel">
          <div className="filter-inputs">
            <input
              type="text"
              name="search"
              placeholder="Tìm theo tên, mã sản phẩm..."
              value={filters.search}
              onChange={handleFilterChange}
            />
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.category_name}</option>
              ))}
            </select>
            <input
              type="number"
              name="minPrice"
              placeholder="Giá tối thiểu"
              value={filters.minPrice}
              onChange={handleFilterChange}
            />
            <input
              type="number"
              name="maxPrice"
              placeholder="Giá tối đa"
              value={filters.maxPrice}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-actions">
            <button onClick={handleSearch} className="btn btn-primary">Áp dụng</button>
          </div>
        </div>

        <div className="filter-suggestions">
          {quickFilters.map(suggestion => (
            <button
              type="button"
              key={suggestion}
              className="filter-chip ghost"
              onClick={() => {
                const updated = { ...filters, search: suggestion };
                setFilters(updated);
                syncSearchParams(updated, 1);
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>

        {activeFilters.length > 0 && (
          <div className="active-filters">
            {activeFilters.map(filter => (
              <button
                type="button"
                key={filter.key}
                className="filter-chip"
                onClick={() => clearFilter(filter.key)}
              >
                {filter.label}
                <span>✕</span>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="loading">Đang tải sản phẩm...</div>
        ) : (
          <>
            <div className="grid products-grid">
              {products.map(product => (
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
                  <p className="stock">Tồn kho: {product.stock}</p>
                </Link>
              ))}
            </div>

            {products.length === 0 && (
              <div className="no-products">Không tìm thấy sản phẩm nào phù hợp</div>
            )}

            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="btn btn-secondary"
                >
                  Trước
                </button>
                <span>Trang {pagination.page} / {pagination.pages}</span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="btn btn-secondary"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Products;


