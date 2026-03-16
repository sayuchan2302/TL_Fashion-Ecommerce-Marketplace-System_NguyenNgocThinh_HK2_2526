import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Home } from 'lucide-react';
import './OrderSuccess.css';

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('id') || Math.floor(Math.random() * 1000000).toString();

  return (
    <div className="order-success-page">
      <div className="order-success-card">
        <div className="success-check-wrapper">
          <div className="success-check-circle">
            <CheckCircle size={48} />
          </div>
        </div>

        <h1 className="os-title">Đặt hàng thành công!</h1>
        <p className="os-subtitle">Cảm ơn bạn đã mua sắm tại Coolmate</p>

        <div className="os-order-info">
          <div className="os-info-row">
            <span className="os-label">Mã đơn hàng</span>
            <span className="os-value os-order-id">#{orderId}</span>
          </div>
          <div className="os-info-row">
            <span className="os-label">Trạng thái</span>
            <span className="os-value os-status">
              <Package size={14} /> Đang xử lý
            </span>
          </div>
          <div className="os-info-row">
            <span className="os-label">Phương thức thanh toán</span>
            <span className="os-value">Thanh toán khi nhận hàng</span>
          </div>
        </div>

        <p className="os-note">
          Bạn sẽ nhận được email xác nhận đơn hàng trong vài phút tới.
          Kiểm tra trạng thái đơn hàng trong phần <strong>Lịch sử đơn hàng</strong>.
        </p>

        <div className="os-actions">
          <Link to="/profile" className="os-btn os-btn-outline">
            <Package size={16} />
            Theo dõi đơn hàng
          </Link>
          <Link to="/" className="os-btn os-btn-primary">
            <Home size={16} />
            Tiếp tục mua sắm
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
