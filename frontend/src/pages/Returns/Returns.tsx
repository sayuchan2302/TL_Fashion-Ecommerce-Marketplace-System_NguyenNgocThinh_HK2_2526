import { useState } from 'react';
import { Check, FileImage, RefreshCw, Upload } from 'lucide-react';
import './Returns.css';
import { useToast } from '../../contexts/ToastContext';
import { returnItems } from '../../mocks/products';
import { CLIENT_TEXT } from '../../utils/texts';
import { adminReturnService, type ReturnReason, type ReturnResolution } from '../Admin/adminReturnService';

const t = CLIENT_TEXT.returns;

type ReturnItem = {
  id: string;
  name: string;
  variant: string;
  price: number;
  image: string;
  selected: boolean;
};

const Returns = () => {
  const { addToast } = useToast();
  const [items, setItems] = useState<ReturnItem[]>(returnItems);
  const [reason, setReason] = useState<ReturnReason>('size');
  const [resolution, setResolution] = useState<ReturnResolution>('exchange');
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, selected: !i.selected } : i));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedItems = items.filter(i => i.selected);
    if (selectedItems.length === 0) {
      addToast(t.validation.selectOne, 'error');
      return;
    }
    setUploading(true);
    setTimeout(() => {
      adminReturnService.submit({
        orderId: 'guest',
        customerName: 'Khách hàng',
        customerEmail: '',
        customerPhone: '',
        items: selectedItems.map(({ id, name, variant, price, image }) => ({ id, name, variant, price, image })),
        reason,
        note: note.trim(),
        resolution,
      });
      setUploading(false);
      setSubmitted(true);
      addToast(t.submitted, 'success');
    }, 600);
  };

  return (
    <div className="returns-page">
      <div className="returns-container">
        <div className="returns-hero">
          <div>
            <p className="hero-kicker">{t.hero.kicker}</p>
            <h1 className="hero-title">{t.hero.title}</h1>
            <p className="hero-sub">{t.hero.subtitle}</p>
          </div>
          <div className="hero-icon"><RefreshCw size={42} /></div>
        </div>

        <form className="returns-grid" onSubmit={handleSubmit}>
          <div className="returns-card">
            <h3>{t.product.title}</h3>
            <div className="returns-items">
              {items.map(item => (
                <label key={item.id} className={`returns-item ${item.selected ? 'selected' : ''}`}>
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => toggleItem(item.id)}
                  />
                  <img src={item.image} alt={item.name} />
                  <div className="item-info">
                    <p className="item-name">{item.name}</p>
                    <p className="item-variant">{item.variant}</p>
                    <p className="item-price">{item.price.toLocaleString('vi-VN')}đ</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="returns-card">
            <h3>{t.info.title}</h3>
            <div className="form-stack">
              <div>
                <label>{t.info.reason}</label>
                <div className="reason-grid">
                  {[
                    { id: 'size' as ReturnReason, label: t.info.reasons.size },
                    { id: 'defect' as ReturnReason, label: t.info.reasons.defect },
                    { id: 'change' as ReturnReason, label: t.info.reasons.change },
                    { id: 'other' as ReturnReason, label: t.info.reasons.other },
                  ].map(opt => (
                    <button
                      type="button"
                      key={opt.id}
                      className={`reason-chip ${reason === opt.id ? 'active' : ''}`}
                      onClick={() => setReason(opt.id)}
                    >
                      {reason === opt.id && <Check size={14} />} {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label>{t.info.description}</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t.info.descriptionPlaceholder}
                />
              </div>

              <div>
                <label>{t.info.image}</label>
                <div className="upload-box">
                  <div className="upload-left">
                    <FileImage size={18} />
                    <div>
                      <p className="upload-title">{t.info.upload.title}</p>
                      <p className="upload-hint">{t.info.upload.hint}</p>
                    </div>
                  </div>
                  <button type="button" className="btn-upload">
                    <Upload size={16} /> {t.info.upload.button}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="returns-card">
            <h3>{t.resolution.title}</h3>
            <div className="resolution-list">
              <label className="resolution-item">
                <input
                  type="radio"
                  name="resolution"
                  checked={resolution === 'exchange'}
                  onChange={() => setResolution('exchange')}
                />
                <div>
                  <p className="resolution-title">{t.resolution.changeSize}</p>
                  <p className="resolution-desc">{t.resolution.changeSizeDesc}</p>
                </div>
              </label>
              <label className="resolution-item">
                <input
                  type="radio"
                  name="resolution"
                  checked={resolution === 'refund'}
                  onChange={() => setResolution('refund')}
                />
                <div>
                  <p className="resolution-title">{t.resolution.refund}</p>
                  <p className="resolution-desc">{t.resolution.refundDesc}</p>
                </div>
              </label>
            </div>
          </div>

          <div className="returns-card summary">
            <div className="summary-row">
              <span>{t.summary.selectedItems}</span>
              <strong>{t.product.title}: {items.filter(i => i.selected).length}</strong>
            </div>
            <div className="summary-row">
              <span>{t.summary.reason}</span>
              <strong>{t.info.reasons[reason as keyof typeof t.info.reasons]}</strong>
            </div>
            <button type="submit" className="btn-submit" disabled={uploading}>
              {uploading ? t.summary.submitting : t.summary.submit}
            </button>
            {submitted && (
              <div className="submitted-note">
                <Check size={16} /> {t.summary.submitted}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Returns;
