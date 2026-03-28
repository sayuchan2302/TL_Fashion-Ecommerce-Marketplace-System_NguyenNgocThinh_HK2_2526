import { apiRequest } from './apiClient';

interface BackendVoucher {
  id?: string;
  storeId?: string;
  storeName?: string;
  code?: string;
  description?: string | null;
  discountType?: 'PERCENT' | 'FIXED';
  discountValue?: number;
  minOrderValue?: number;
  totalIssued?: number;
  usedCount?: number;
  startDate?: string;
  endDate?: string;
}

export interface Coupon {
  id?: string;
  storeId?: string;
  storeName?: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  maxDiscount?: number;
  minOrderValue?: number;
  expiresAt: string;
  description: string;
  remaining: number;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discount: number;
  error?: string;
}

interface CouponValidationOptions {
  storeIds?: string[];
  storeSubtotals?: Record<string, number>;
  forceRefresh?: boolean;
}

let cachedCoupons: Coupon[] = [];
let cachedStoreKey = '';

const normalizeCode = (value: string) => value.trim().replace(/\s+/g, '').toUpperCase();

const normalizeStoreIds = (storeIds?: string[]) => {
  const unique = Array.from(new Set((storeIds || []).filter(Boolean)));
  unique.sort();
  return unique;
};

const storeKeyOf = (storeIds?: string[]) => normalizeStoreIds(storeIds).join(',');

const toClientCoupon = (voucher: BackendVoucher): Coupon => {
  const totalIssued = Number(voucher.totalIssued || 0);
  const usedCount = Number(voucher.usedCount || 0);

  return {
    id: voucher.id,
    storeId: voucher.storeId,
    storeName: (voucher.storeName || '').trim() || undefined,
    code: normalizeCode(voucher.code || ''),
    type: (voucher.discountType || '').toUpperCase() === 'FIXED' ? 'fixed' : 'percent',
    value: Number(voucher.discountValue || 0),
    minOrderValue: Number(voucher.minOrderValue || 0),
    expiresAt: voucher.endDate || '',
    description: (voucher.description || '').trim(),
    remaining: Math.max(0, totalIssued - usedCount),
  };
};

const isExpired = (coupon: Coupon) => {
  if (!coupon.expiresAt) return false;
  const expiry = new Date(`${coupon.expiresAt}T23:59:59`);
  return Number.isFinite(expiry.getTime()) && expiry.getTime() < Date.now();
};

const resolveApplicableOrderValue = (
  coupon: Coupon,
  totalOrderValue: number,
  storeSubtotals?: Record<string, number>,
) => {
  if (coupon.storeId && storeSubtotals && Number.isFinite(storeSubtotals[coupon.storeId])) {
    return Math.max(0, Number(storeSubtotals[coupon.storeId]));
  }
  return Math.max(0, totalOrderValue);
};

export const couponService = {
  async getAvailableCoupons(storeIds?: string[], forceRefresh = false): Promise<Coupon[]> {
    const nextStoreKey = storeKeyOf(storeIds);
    if (!forceRefresh && cachedStoreKey === nextStoreKey && cachedCoupons.length > 0) {
      return cachedCoupons;
    }

    const params = new URLSearchParams();
    normalizeStoreIds(storeIds).forEach((storeId) => params.append('storeId', storeId));
    const query = params.toString();

    const response = await apiRequest<BackendVoucher[]>(
      `/api/vouchers/public${query ? `?${query}` : ''}`,
    );

    cachedCoupons = (response || [])
      .map(toClientCoupon)
      .filter((coupon) => coupon.code && coupon.remaining > 0 && !isExpired(coupon));
    cachedStoreKey = nextStoreKey;

    return cachedCoupons;
  },

  async validate(
    code: string,
    totalOrderValue: number,
    options: CouponValidationOptions = {},
  ): Promise<CouponValidationResult> {
    const normalizedCode = normalizeCode(code || '');
    if (!normalizedCode) {
      return { valid: false, discount: 0, error: 'Vui lòng nhập mã giảm giá' };
    }

    const coupons = await this.getAvailableCoupons(options.storeIds, Boolean(options.forceRefresh));
    const candidates = coupons.filter((coupon) => normalizeCode(coupon.code) === normalizedCode);
    if (candidates.length === 0) {
      return { valid: false, discount: 0, error: 'Mã giảm giá không tồn tại hoặc đã hết hiệu lực' };
    }

    const coupon = candidates.length === 1
      ? candidates[0]
      : candidates.find((item) => item.storeId && (options.storeIds || []).includes(item.storeId))
      || null;

    if (!coupon) {
      return { valid: false, discount: 0, error: 'Mã giảm giá bị trùng ở nhiều cửa hàng trong giỏ' };
    }

    if (coupon.remaining <= 0) {
      return { valid: false, discount: 0, error: 'Mã giảm giá đã hết lượt sử dụng' };
    }

    if (isExpired(coupon)) {
      return { valid: false, discount: 0, error: 'Mã giảm giá đã hết hạn' };
    }

    const applicableOrderValue = resolveApplicableOrderValue(
      coupon,
      totalOrderValue,
      options.storeSubtotals,
    );
    if (coupon.minOrderValue && applicableOrderValue < coupon.minOrderValue) {
      return {
        valid: false,
        discount: 0,
        error: `Đơn tối thiểu ${coupon.minOrderValue.toLocaleString('vi-VN')}đ để dùng mã này`,
      };
    }

    const discount = this.calculateDiscount(coupon, applicableOrderValue);
    if (discount <= 0) {
      return { valid: false, discount: 0, error: 'Mã giảm giá không hợp lệ cho đơn hiện tại' };
    }

    return { valid: true, coupon, discount };
  },

  calculateDiscount(coupon: Coupon, orderValue: number): number {
    const safeOrderValue = Math.max(0, orderValue);
    if (coupon.type === 'percent') {
      const raw = Math.floor(safeOrderValue * (coupon.value / 100));
      return coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
    }
    return Math.min(coupon.value, safeOrderValue);
  },

  recordUsage(code: string) {
    const normalizedCode = normalizeCode(code || '');
    cachedCoupons = cachedCoupons.map((coupon) => {
      if (normalizeCode(coupon.code) !== normalizedCode) {
        return coupon;
      }
      return {
        ...coupon,
        remaining: Math.max(0, coupon.remaining - 1),
      };
    });
  },
};

