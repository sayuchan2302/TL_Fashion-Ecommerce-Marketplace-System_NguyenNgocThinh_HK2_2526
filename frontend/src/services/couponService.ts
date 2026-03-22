/**
 * couponService.ts — Client-facing coupon validation.
 *
 * Now reads from promotionStore (shared with AdminPromotions) so that
 * vouchers created/paused/expired in admin are immediately reflected here.
 */
import { promotionStore, type Promotion } from './promotionStore';

export interface Coupon {
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

const toClientCoupon = (p: Promotion): Coupon => ({
  code: p.code,
  type: p.discountType,
  value: p.discountValue,
  maxDiscount: p.maxDiscount,
  minOrderValue: p.minOrderValue,
  expiresAt: p.endDate,
  description: p.description,
  remaining: Math.max(0, p.totalIssued - p.usedCount),
});

const calculateDiscount = (p: Promotion, orderValue: number): number => {
  if (p.discountType === 'percent') {
    const raw = Math.floor(orderValue * (p.discountValue / 100));
    return p.maxDiscount ? Math.min(raw, p.maxDiscount) : raw;
  }
  return Math.min(p.discountValue, orderValue);
};

export const couponService = {
  /** Returns all currently usable coupons (running + have stock) */
  getAvailableCoupons(): Coupon[] {
    return promotionStore.getActive().map(toClientCoupon);
  },

  /** Validates a coupon code against the current order value */
  validate(code: string, orderValue: number): CouponValidationResult {
    const promotion = promotionStore.getByCode(code);

    if (!promotion) {
      return { valid: false, discount: 0, error: 'Mã giảm giá không tồn tại' };
    }

    if (promotion.status === 'paused') {
      return { valid: false, discount: 0, error: 'Mã giảm giá tạm thời không khả dụng' };
    }

    if (promotion.status === 'expired') {
      return { valid: false, discount: 0, error: 'Mã giảm giá đã hết hạn' };
    }

    const remaining = promotion.totalIssued - promotion.usedCount;
    if (remaining <= 0) {
      return { valid: false, discount: 0, error: 'Mã giảm giá đã hết lượt sử dụng' };
    }

    if (promotion.minOrderValue && orderValue < promotion.minOrderValue) {
      return {
        valid: false,
        discount: 0,
        error: `Đơn hàng tối thiểu ${promotion.minOrderValue.toLocaleString('vi-VN')}đ để sử dụng mã này`,
      };
    }

    const discount = calculateDiscount(promotion, orderValue);
    return { valid: true, coupon: toClientCoupon(promotion), discount };
  },

  /** Calculate discount amount for an already-validated coupon */
  calculateDiscount(coupon: Coupon, orderValue: number): number {
    if (coupon.type === 'percent') {
      const raw = Math.floor(orderValue * (coupon.value / 100));
      return coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw;
    }
    return Math.min(coupon.value, orderValue);
  },

  /** Record usage after a successful order placement */
  recordUsage(code: string) {
    promotionStore.recordUsage(code);
  },
};
