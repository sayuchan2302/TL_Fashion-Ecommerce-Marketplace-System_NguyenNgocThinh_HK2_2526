import './SizeGuide.css';
import { Link } from 'react-router-dom';
import { Ruler, Activity, Shirt, MoveVertical, MoveHorizontal, MessageCircle } from 'lucide-react';

const sizeRowsMen = [
  { size: 'S', height: '160 - 167', weight: '50 - 57', chest: '88 - 92', waist: '72 - 76' },
  { size: 'M', height: '168 - 172', weight: '58 - 66', chest: '92 - 96', waist: '76 - 82' },
  { size: 'L', height: '173 - 177', weight: '67 - 74', chest: '96 - 100', waist: '82 - 88' },
  { size: 'XL', height: '178 - 182', weight: '75 - 83', chest: '100 - 106', waist: '88 - 94' },
  { size: '2XL', height: '183 - 187', weight: '84 - 95', chest: '106 - 112', waist: '94 - 100' },
];

const sizeRowsWomen = [
  { size: 'XS', height: '150 - 156', weight: '40 - 46', bust: '78 - 82', waist: '60 - 64', hip: '84 - 88' },
  { size: 'S', height: '157 - 162', weight: '47 - 52', bust: '82 - 86', waist: '64 - 68', hip: '88 - 92' },
  { size: 'M', height: '163 - 167', weight: '53 - 58', bust: '86 - 90', waist: '68 - 72', hip: '92 - 96' },
  { size: 'L', height: '168 - 172', weight: '59 - 64', bust: '90 - 96', waist: '72 - 78', hip: '96 - 102' },
  { size: 'XL', height: '173 - 177', weight: '65 - 72', bust: '96 - 102', waist: '78 - 84', hip: '102 - 108' },
];

const SizeGuide = () => {
  return (
    <div className="size-guide-page">
      <section className="sg-hero">
        <div className="container sg-hero-inner">
          <div>
            <p className="sg-eyebrow">Size Guide & Fit Finder</p>
            <h1 className="sg-title">Chọn size chuẩn trong 1 phút</h1>
            <p className="sg-subtitle">Dựa trên chiều cao, cân nặng và số đo thực tế. Nếu phân vân giữa 2 size, ưu tiên form rộng cho đồ basic và vừa/sát cho đồ thể thao.</p>
            <div className="sg-cta-row">
              <a className="sg-btn primary" href="#men">Bảng size Nam</a>
              <a className="sg-btn ghost" href="#women">Bảng size Nữ</a>
              <Link className="sg-btn text" to="/contact"><MessageCircle size={16} /> Nhờ tư vấn</Link>
            </div>
          </div>
          <div className="sg-measure-card">
            <div className="sg-measure-header">
              <Ruler size={18} /> 3 bước đo nhanh
            </div>
            <ul>
              <li><span>1.</span> Ngực/Bust: đo vòng qua điểm nở nhất, thước song song mặt đất.</li>
              <li><span>2.</span> Eo/Waist: đo tại điểm hẹp nhất, thở bình thường.</li>
              <li><span>3.</span> Hông/Hip: đo qua điểm nở nhất của hông.</li>
            </ul>
            <div className="sg-note">Mẹo: đo vào cuối ngày để có số đo thực tế nhất.</div>
          </div>
        </div>
      </section>

      <section className="sg-section" id="men">
        <div className="container">
          <div className="sg-section-header">
            <div>
              <p className="sg-eyebrow">Nam</p>
              <h2>Bảng size Nam</h2>
              <p className="sg-desc">Khuyến nghị theo chiều cao/cân nặng và số đo ngực, eo (cm).</p>
            </div>
            <div className="sg-fit-chips">
              <span className="sg-chip"><Shirt size={14} /> Form Regular</span>
              <span className="sg-chip"><Activity size={14} /> Form Athletic</span>
            </div>
          </div>
          <div className="sg-table" role="table" aria-label="Bảng size nam">
            <div className="sg-row sg-head" role="row">
              <div role="columnheader">Size</div>
              <div role="columnheader">Cao (cm)</div>
              <div role="columnheader">Nặng (kg)</div>
              <div role="columnheader">Ngực</div>
              <div role="columnheader">Eo</div>
            </div>
            {sizeRowsMen.map((r) => (
              <div className="sg-row" role="row" key={r.size}>
                <div role="cell" className="sg-bold">{r.size}</div>
                <div role="cell">{r.height}</div>
                <div role="cell">{r.weight}</div>
                <div role="cell">{r.chest}</div>
                <div role="cell">{r.waist}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sg-section" id="women">
        <div className="container">
          <div className="sg-section-header">
            <div>
              <p className="sg-eyebrow">Nữ</p>
              <h2>Bảng size Nữ</h2>
              <p className="sg-desc">Khuyến nghị theo chiều cao/cân nặng và số đo ngực, eo, hông (cm).</p>
            </div>
            <div className="sg-fit-chips">
              <span className="sg-chip"><MoveVertical size={14} /> Dáng cao</span>
              <span className="sg-chip"><MoveHorizontal size={14} /> Dáng chuẩn</span>
            </div>
          </div>
          <div className="sg-table" role="table" aria-label="Bảng size nữ">
            <div className="sg-row sg-head" role="row">
              <div role="columnheader">Size</div>
              <div role="columnheader">Cao (cm)</div>
              <div role="columnheader">Nặng (kg)</div>
              <div role="columnheader">Ngực</div>
              <div role="columnheader">Eo</div>
              <div role="columnheader">Hông</div>
            </div>
            {sizeRowsWomen.map((r) => (
              <div className="sg-row" role="row" key={r.size}>
                <div role="cell" className="sg-bold">{r.size}</div>
                <div role="cell">{r.height}</div>
                <div role="cell">{r.weight}</div>
                <div role="cell">{r.bust}</div>
                <div role="cell">{r.waist}</div>
                <div role="cell">{r.hip}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sg-section sg-tips">
        <div className="container sg-tips-grid">
          <div className="sg-tip-card">
            <h3>Chọn size theo form</h3>
            <ul>
              <li><strong>Basic/Relaxed:</strong> nếu số đo ở giữa hai size, chọn size lớn hơn.</li>
              <li><strong>Active/Fit:</strong> chọn size đúng ngực/eo để tránh thừa vải.</li>
              <li><strong>Quần jeans:</strong> ưu tiên vòng eo/hông, có co giãn hãy chọn nhỏ hơn 1 size.</li>
            </ul>
          </div>
          <div className="sg-tip-card">
            <h3>Bảng quy đổi nhanh</h3>
            <div className="sg-pill-row">
              <span className="sg-pill">EU 38 ≈ S</span>
              <span className="sg-pill">EU 40 ≈ M</span>
              <span className="sg-pill">EU 42 ≈ L</span>
              <span className="sg-pill">EU 44 ≈ XL</span>
            </div>
            <p className="sg-desc">Nếu đang mặc size quốc tế, dùng quy đổi trên và đối chiếu thêm số đo cm.</p>
          </div>
          <div className="sg-tip-card">
            <h3>Vẫn chưa chắc chắn?</h3>
            <p className="sg-desc">Liên hệ CSKH và gửi chiều cao/cân nặng/số đo, chúng tôi sẽ tư vấn size và gợi ý sản phẩm phù hợp.</p>
            <Link to="/contact" className="sg-btn ghost">Chat ngay</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SizeGuide;
