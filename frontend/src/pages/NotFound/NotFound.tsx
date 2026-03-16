import { Link } from 'react-router-dom';
import { Home, ArrowLeft, SearchX } from 'lucide-react';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-icon">
          <SearchX size={80} strokeWidth={1.2} />
        </div>
        <h1 className="not-found-code">404</h1>
        <h2 className="not-found-title">Trang không tồn tại</h2>
        <p className="not-found-desc">
          Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
        </p>
        <div className="not-found-actions">
          <Link to="/" className="nf-btn nf-btn-primary">
            <Home size={18} />
            Về trang chủ
          </Link>
          <button className="nf-btn nf-btn-outline" onClick={() => window.history.back()}>
            <ArrowLeft size={18} />
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
