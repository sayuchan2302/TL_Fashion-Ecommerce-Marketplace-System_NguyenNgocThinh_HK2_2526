import './Stores.css';
import { MapPin, Clock3, Phone, Map } from 'lucide-react';
import { useMemo, useState } from 'react';

const stores = [
  { city: 'Hà Nội', name: 'HUB Hà Nội', address: 'Tầng 3-4, Tòa nhà BMM, KM2, Đường Phùng Hưng, Phường Phúc La, Hà Đông', hours: '8:30 - 21:30', phone: '028.7777.2737', map: 'https://maps.google.com/?q=Tòa nhà BMM Phùng Hưng Hà Đông' },
  { city: 'TP.HCM', name: 'HUB Quận 7', address: 'Lầu 1, 163 Trần Trọng Cung, P. Tân Thuận Đông, Quận 7', hours: '8:30 - 21:30', phone: '028.7777.2737', map: 'https://maps.google.com/?q=163 Trần Trọng Cung Quận 7' },
  { city: 'Đà Nẵng', name: 'Điểm gửi hàng Đà Nẵng', address: '123 Nguyễn Văn Linh, Quận Hải Châu', hours: '9:00 - 20:30', phone: '028.7777.2737', map: 'https://maps.google.com/?q=123 Nguyễn Văn Linh Hải Châu Đà Nẵng' },
];

const cityOptions = ['Tất cả', ...Array.from(new Set(stores.map(s => s.city)))];

const Stores = () => {
  const [city, setCity] = useState('Tất cả');
  const filtered = useMemo(() => city === 'Tất cả' ? stores : stores.filter(s => s.city === city), [city]);

  return (
    <div className="stores-page">
      <section className="stores-hero">
        <div className="container stores-hero-inner">
          <div>
            <p className="stores-eyebrow">Cửa hàng & điểm nhận hàng</p>
            <h1 className="stores-title">Tìm cửa hàng gần bạn</h1>
            <p className="stores-subtitle">Xem giờ mở cửa, địa chỉ và chỉ đường nhanh qua Google Maps.</p>
            <div className="stores-filter">
              <label htmlFor="city-select">Chọn khu vực</label>
              <select id="city-select" value={city} onChange={(e) => setCity(e.target.value)}>
                {cityOptions.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
          <div className="stores-map-hint">
            <Map size={18} />
            <span>Nhấn "Xem bản đồ" để mở Google Maps và chỉ đường.</span>
          </div>
        </div>
      </section>

      <section className="stores-list">
        <div className="container stores-grid">
          {filtered.map(store => (
            <div className="store-card" key={store.name}>
              <div className="store-header">
                <div>
                  <p className="store-city">{store.city}</p>
                  <h3 className="store-name">{store.name}</h3>
                </div>
                <a className="store-map" href={store.map} target="_blank" rel="noreferrer">Xem bản đồ</a>
              </div>
              <div className="store-row"><MapPin size={16} /> <span>{store.address}</span></div>
              <div className="store-row"><Clock3 size={16} /> <span>{store.hours}</span></div>
              <div className="store-row"><Phone size={16} /> <span>{store.phone}</span></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Stores;
