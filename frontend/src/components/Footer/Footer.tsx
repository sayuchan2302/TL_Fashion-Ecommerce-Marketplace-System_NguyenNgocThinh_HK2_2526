import './Footer.css';
import { Facebook, Instagram, Youtube, MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-column">
          <h3 className="footer-title">COOLMATE LẮNG NGHE BẠN!</h3>
          <p className="footer-text">Chúng tôi luôn trân trọng và mong đợi nhận được mọi ý kiến đóng góp từ khách hàng để có thể nâng cấp trải nghiệm dịch vụ và sản phẩm tốt hơn nữa.</p>
          <div className="contact-info">
            <div className="contact-item">
              <Phone size={20} />
              <span>Hotline: <strong>1900.27.27.37</strong> (028.7777.2737)</span>
            </div>
            <div className="contact-item">
              <Mail size={20} />
              <span>Email: Cool@coolmate.me</span>
            </div>
          </div>
          <div className="social-links">
            <a href="#" className="social-btn"><Facebook size={24} /></a>
            <a href="#" className="social-btn"><Instagram size={24} /></a>
            <a href="#" className="social-btn"><Youtube size={24} /></a>
          </div>
        </div>

        <div className="footer-column">
          <h3 className="footer-title">CHÍNH SÁCH</h3>
          <ul className="footer-links">
            <li><a href="#">Chính sách đổi trả 60 ngày</a></li>
            <li><a href="#">Chính sách khuyến mãi</a></li>
            <li><a href="#">Chính sách bảo mật</a></li>
            <li><a href="#">Chính sách giao hàng</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3 className="footer-title">VỀ COOLMATE</h3>
          <ul className="footer-links">
            <li><a href="#">Câu chuyện Coolmate</a></li>
            <li><a href="#">Showroom</a></li>
            <li><a href="#">Tin tức</a></li>
            <li><a href="#">Tuyển dụng</a></li>
            <li><a href="#">Liên hệ</a></li>
          </ul>
        </div>

        <div className="footer-column">
          <h3 className="footer-title">ĐỊA CHỈ LIÊN HỆ</h3>
          <div className="address-item">
            <MapPin size={24} className="address-icon" />
            <p><strong>HUB Hà Nội:</strong> Tầng 3-4, Tòa nhà BMM, KM2, Đường Phùng Hưng, Phường Phúc La, Quận Hà Đông, TP Hà Nội</p>
          </div>
          <div className="address-item">
            <MapPin size={24} className="address-icon" />
            <p><strong>HUB Tp. Hồ Chí Minh:</strong> Lầu 1, Số 163 Trần Trọng Cung, Phường Tân Thuận Đông, Quận 7, Tp. Hồ Chí Minh</p>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="container bottom-content">
          <p>&copy; 2024 COOLMATE. All rights reserved. (Clone for academic purposes)</p>
          <div className="payment-methods">
            <span style={{ fontSize: '10px', opacity: 0.5, border: '1px solid currentColor', padding: '4px', borderRadius: '4px'}}>ĐÃ THÔNG BÁO BỘ CÔNG THƯƠNG</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
