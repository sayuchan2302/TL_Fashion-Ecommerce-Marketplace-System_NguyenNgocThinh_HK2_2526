import { useState, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { addressService } from '../../services/addressService';
import { useAddressLocation } from '../../hooks/useAddressLocation';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export interface AddressData {
  fullName: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detail: string;
  isDefault: boolean;
}

const AddressModal = ({ isOpen, onClose, onSave }: AddressModalProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [detail, setDetail] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const addressLocation = useAddressLocation({ loadOnMount: isOpen });

  useEffect(() => {
    if (isOpen) {
      addressLocation.clearSelection();
    }
  }, [isOpen, addressLocation.clearSelection]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addressService.add({
      fullName: name,
      phone,
      province: addressLocation.selectedProvinceName,
      district: addressLocation.selectedDistrictName,
      ward: addressLocation.selectedWardName,
      detail,
      isDefault,
    });
    if (onSave) onSave();
    setName('');
    setPhone('');
    setDetail('');
    setIsDefault(false);
    addressLocation.clearSelection();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal address-modal" onClick={(e) => e.stopPropagation()}>
        <button className="profile-modal-close" onClick={onClose} aria-label="Đóng">
          <X size={20} aria-hidden="true" />
        </button>
        <h2 className="profile-modal-title">Thêm địa chỉ mới</h2>

        <form className="profile-modal-form" onSubmit={handleSubmit}>
          {/* Name */}
          <div className="modal-input-group mt-10">
            <span className="modal-floating-label">Họ và tên người nhận</span>
            <input
              type="text"
              className="modal-input"
              style={{ paddingLeft: '16px' }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              name="fullName"
              required
            />
          </div>

          {/* Phone */}
          <div className="modal-input-group mt-10">
            <span className="modal-floating-label">Số điện thoại</span>
            <input
              type="tel"
              className="modal-input"
              style={{ paddingLeft: '16px' }}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              name="phone"
              required
            />
          </div>

          {/* Province Select */}
          <div className="modal-input-group mt-10">
            <span className="modal-floating-label">Tỉnh / Thành phố</span>
            <select
              className="modal-input modal-select"
              value={addressLocation.selectedProvinceCode}
              onChange={(e) => addressLocation.setSelectedProvinceCode(e.target.value)}
              required
            >
              <option value="">
                {addressLocation.loadingProvinces ? 'Đang tải...' : '-- Chọn Tỉnh / Thành phố --'}
              </option>
              {addressLocation.provinces.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="modal-select-arrow" size={16} aria-hidden="true" />
          </div>

          {/* District Select */}
          <div className="modal-input-group mt-10">
            <span className="modal-floating-label">Quận / Huyện</span>
            <select
              className="modal-input modal-select"
              value={addressLocation.selectedDistrictCode}
              onChange={(e) => addressLocation.setSelectedDistrictCode(e.target.value)}
              disabled={!addressLocation.selectedProvinceCode}
              required
            >
              <option value="">
                {addressLocation.loadingDistricts ? 'Đang tải...' : '-- Chọn Quận / Huyện --'}
              </option>
              {addressLocation.districts.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </select>
            <ChevronDown className="modal-select-arrow" size={16} aria-hidden="true" />
          </div>

          {/* Ward Select */}
          <div className="modal-input-group mt-10">
            <span className="modal-floating-label">Phường / Xã</span>
            <select
              className="modal-input modal-select"
              value={addressLocation.selectedWardCode}
              onChange={(e) => addressLocation.setSelectedWardCode(e.target.value)}
              disabled={!addressLocation.selectedDistrictCode}
              required
            >
              <option value="">
                {addressLocation.loadingWards ? 'Đang tải...' : '-- Chọn Phường / Xã --'}
              </option>
              {addressLocation.wards.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.name}
                </option>
              ))}
            </select>
            <ChevronDown className="modal-select-arrow" size={16} aria-hidden="true" />
          </div>

          {/* Detail Address */}
          <div className="modal-input-group mt-10">
            <span className="modal-floating-label">Địa chỉ cụ thể</span>
            <input
              type="text"
              className="modal-input"
              style={{ paddingLeft: '16px' }}
              placeholder="Số nhà, tên đường..."
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              required
            />
          </div>

          {/* Default Address Checkbox */}
          <label className="address-default-check mt-10">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            <span className="address-check-custom"></span>
            Đặt làm địa chỉ mặc định
          </label>

          <button type="submit" className="modal-submit-btn mt-10">
            LƯU ĐỊA CHỈ
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddressModal;
