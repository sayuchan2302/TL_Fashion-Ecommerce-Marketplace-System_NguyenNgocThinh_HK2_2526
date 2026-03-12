import './Header.css';
import { Search, ShoppingCart, User } from 'lucide-react';

const Header = () => {
  return (
    <header className="header">
      <div className="header-container container">
        {/* Logo */}
        <div className="header-logo">
          <a href="/">
            <img src="/vite.svg" alt="Coolmate Logo" className="logo-img" />
            <span className="logo-text">COOLMATE</span>
          </a>
        </div>

        {/* Navigation */}
        <nav className="header-nav">
          <ul className="nav-list">
            <li><a href="#" className="nav-link">NAM</a></li>
            <li><a href="#" className="nav-link">NỮ</a></li>
            <li><a href="#" className="nav-link">TRẺ EM</a></li>
            <li><a href="#" className="nav-link">THỂ THAO</a></li>
            <li><a href="#" className="nav-link nav-sale">KHUYẾN MÃI</a></li>
            <li><a href="#" className="nav-link">VỀ CHÚNG TÔI</a></li>
          </ul>
        </nav>

        {/* Actions (Search, Account, Cart) */}
        <div className="header-actions">
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input type="text" placeholder="Tìm kiếm sản phẩm..." className="search-input" />
          </div>
          <button className="icon-btn" aria-label="Tài khoản">
            <User size={22} />
          </button>
          <button className="icon-btn cart-btn" aria-label="Giỏ hàng">
            <ShoppingCart size={22} />
            <span className="cart-badge">0</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
