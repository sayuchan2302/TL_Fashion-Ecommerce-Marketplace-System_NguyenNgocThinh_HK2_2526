import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, SlidersHorizontal, ChevronRight } from 'lucide-react';
import './Search.css';

// Mock data for demo
const MOCK_PRODUCTS = [
  { id: '1', name: 'Áo Thun Cotton Compact', price: 299000, originalPrice: 399000, image: 'https://media2.coolmate.me/cdn-cgi/image/quality=80,format=auto/uploads/November2024/ao-thun-nam-co-tron-compact_139.jpg', category: 'Áo thun' },
  { id: '2', name: 'Áo Polo Pique Cotton', price: 349000, originalPrice: 449000, image: 'https://media2.coolmate.me/cdn-cgi/image/quality=80,format=auto/uploads/November2024/ao-polo-nam-pique-cotton_39.jpg', category: 'Áo polo' },
  { id: '3', name: 'Quần Jeans Slim Fit', price: 499000, originalPrice: 599000, image: 'https://media2.coolmate.me/cdn-cgi/image/quality=80,format=auto/uploads/November2024/quan-jeans-slim-fit-nam_44.jpg', category: 'Quần jeans' },
  { id: '4', name: 'Áo Hoodie Basic', price: 399000, originalPrice: null, image: 'https://media2.coolmate.me/cdn-cgi/image/quality=80,format=auto/uploads/November2024/ao-hoodie-basic-nam_86.jpg', category: 'Áo hoodie' },
  { id: '5', name: 'Quần Short Chạy Bộ', price: 259000, originalPrice: 329000, image: 'https://media2.coolmate.me/cdn-cgi/image/quality=80,format=auto/uploads/November2024/quan-short-chay-bo-nam_78.jpg', category: 'Quần short' },
  { id: '6', name: 'Áo Sơ Mi Oxford', price: 389000, originalPrice: null, image: 'https://media2.coolmate.me/cdn-cgi/image/quality=80,format=auto/uploads/November2024/ao-so-mi-oxford-nam_31.jpg', category: 'Áo sơ mi' },
];

const POPULAR_KEYWORDS = ['Áo thun', 'Polo', 'Quần jeans', 'Hoodie', 'Sale', 'Quần short'];

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [inputValue, setInputValue] = useState(query);

  const filteredProducts = query
    ? MOCK_PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim() });
    }
  };

  const handleKeywordClick = (keyword: string) => {
    setInputValue(keyword);
    setSearchParams({ q: keyword });
  };

  const formatPrice = (price: number) =>
    price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';

  return (
    <div className="search-page">
      <div className="search-page-container">
        {/* Breadcrumb */}
        <div className="search-breadcrumb">
          <Link to="/">Trang chủ</Link>
          <ChevronRight size={14} />
          <span>Tìm kiếm</span>
        </div>

        {/* Search bar */}
        <form className="search-bar-form" onSubmit={handleSearch}>
          <div className="search-bar-wrapper">
            <SearchIcon size={20} className="search-bar-icon" />
            <input
              type="text"
              className="search-bar-input"
              placeholder="Tìm kiếm sản phẩm..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus
            />
            <button type="submit" className="search-bar-btn">Tìm kiếm</button>
          </div>
        </form>

        {/* Popular keywords */}
        {!query && (
          <div className="search-popular">
            <h3 className="search-popular-title">
              <SlidersHorizontal size={16} /> Từ khoá phổ biến
            </h3>
            <div className="search-keywords">
              {POPULAR_KEYWORDS.map(kw => (
                <button key={kw} className="search-keyword-chip" onClick={() => handleKeywordClick(kw)}>
                  {kw}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {query && (
          <div className="search-results-section">
            <h2 className="search-results-title">
              {filteredProducts.length > 0
                ? `Tìm thấy ${filteredProducts.length} kết quả cho "${query}"`
                : `Không tìm thấy kết quả cho "${query}"`}
            </h2>

            {filteredProducts.length > 0 ? (
              <div className="search-results-grid">
                {filteredProducts.map(product => (
                  <Link to={`/product/${product.id}`} key={product.id} className="search-product-card">
                    <div className="search-product-img-wrap">
                      <img src={product.image} alt={product.name} className="search-product-img" />
                      {product.originalPrice && (
                        <span className="search-discount-badge">
                          -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                        </span>
                      )}
                    </div>
                    <div className="search-product-info">
                      <p className="search-product-category">{product.category}</p>
                      <h3 className="search-product-name">{product.name}</h3>
                      <div className="search-product-prices">
                        <span className="search-price-current">{formatPrice(product.price)}</span>
                        {product.originalPrice && (
                          <span className="search-price-original">{formatPrice(product.originalPrice)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="search-empty-state">
                <SearchIcon size={64} strokeWidth={1} />
                <p>Thử tìm kiếm với từ khoá khác hoặc duyệt các danh mục sản phẩm.</p>
                <Link to="/" className="search-back-btn">Về trang chủ</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
