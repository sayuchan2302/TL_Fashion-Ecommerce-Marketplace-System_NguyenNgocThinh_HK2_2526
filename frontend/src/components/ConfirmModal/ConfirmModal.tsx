import { X, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import './ConfirmModal.css';

export type ConfirmModalVariant = 'danger' | 'warning' | 'info';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmModalVariant;
  isLoading?: boolean;
}

const variantConfig: Record<ConfirmModalVariant, { icon: typeof AlertTriangle; iconBg: string; iconColor: string; confirmBg: string; confirmHoverBg: string }> = {
  danger: {
    icon: XCircle,
    iconBg: '#fee2e2',
    iconColor: '#dc2626',
    confirmBg: '#dc2626',
    confirmHoverBg: '#b91c1c',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: '#fef3c7',
    iconColor: '#d97706',
    confirmBg: '#d97706',
    confirmHoverBg: '#b45309',
  },
  info: {
    icon: HelpCircle,
    iconBg: '#dbeafe',
    iconColor: '#2563eb',
    confirmBg: '#2f5acf',
    confirmHoverBg: '#1e40af',
  },
};

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  const config = variantConfig[variant];
  const Icon = config.icon;

  const content = (
    <div className="client-confirm-modal-overlay" onClick={onClose}>
      <div className="client-confirm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="client-confirm-modal-close" onClick={onClose} aria-label="Đóng">
          <X size={20} />
        </button>

        <div className="client-confirm-modal-icon" style={{ background: config.iconBg, color: config.iconColor }}>
          <Icon size={28} />
        </div>

        <h3 className="client-confirm-modal-title">{title}</h3>
        <p className="client-confirm-modal-message">{message}</p>

        <div className="client-confirm-modal-actions">
          <button
            className="client-confirm-modal-btn cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className="client-confirm-modal-btn confirm"
            onClick={onConfirm}
            disabled={isLoading}
            style={{ background: config.confirmBg }}
            onMouseEnter={(e) => {
              (e.target as HTMLButtonElement).style.background = config.confirmHoverBg;
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLButtonElement).style.background = config.confirmBg;
            }}
          >
            {isLoading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};

export default ConfirmModal;
