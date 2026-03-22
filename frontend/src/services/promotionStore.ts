/**
 * promotionStore.ts — Shared source of truth for promotions/vouchers.
 *
 * Both AdminPromotions (admin management) and couponService (client checkout)
 * read/write from this store, ensuring they are always in sync.
 */

export type DiscountType = 'percent' | 'fixed';
export type PromotionStatus = 'running' | 'paused' | 'expired';

export interface Promotion {
  id: string;
  name: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount: number;
  minOrderValue: number;
  userLimit: number;
  totalIssued: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  status: PromotionStatus;
}

// ── Initial seed data (unified, previously split between couponService and AdminPromotions) ─
const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: 'pr-001',
    name: 'Summer Flash Sale',
    code: 'SUMMER20',
    description: 'Chiến dịch hè giảm sâu cho nhóm sản phẩm bán chạy.',
    discountType: 'percent',
    discountValue: 20,
    maxDiscount: 200000,
    minOrderValue: 300000,
    userLimit: 2,
    totalIssued: 3000,
    usedCount: 1820,
    startDate: '2026-03-01',
    endDate: '2026-08-31',
    status: 'running',
  },
  {
    id: 'pr-002',
    name: 'Chào mừng khách mới',
    code: 'HELLO100K',
    description: 'Voucher chào mừng khách hàng mới, giảm 100K cho đơn từ 699K.',
    discountType: 'fixed',
    discountValue: 100000,
    maxDiscount: 100000,
    minOrderValue: 699000,
    userLimit: 1,
    totalIssued: 5000,
    usedCount: 4960,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'running',
  },
  {
    id: 'pr-003',
    name: 'Weekend Promo',
    code: 'WKND50',
    description: 'Ưu đãi cuối tuần cho toàn bộ danh mục. Giảm 50K cho đơn từ 399K.',
    discountType: 'fixed',
    discountValue: 50000,
    maxDiscount: 50000,
    minOrderValue: 399000,
    userLimit: 3,
    totalIssued: 4500,
    usedCount: 820,
    startDate: '2026-06-01',
    endDate: '2026-07-30',
    status: 'paused',
  },
  {
    id: 'pr-004',
    name: 'Free Ship',
    code: 'FREESHIP',
    description: 'Miễn phí vận chuyển cho mọi đơn hàng.',
    discountType: 'fixed',
    discountValue: 30000,
    maxDiscount: 30000,
    minOrderValue: 0,
    userLimit: 1,
    totalIssued: 9999,
    usedCount: 1200,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'running',
  },
  {
    id: 'pr-005',
    name: 'Coolmate 100K',
    code: 'COOLMATE100',
    description: 'Giảm 100K cho đơn từ 500K.',
    discountType: 'fixed',
    discountValue: 100000,
    maxDiscount: 100000,
    minOrderValue: 500000,
    userLimit: 1,
    totalIssued: 50,
    usedCount: 12,
    startDate: '2026-01-01',
    endDate: '2026-06-30',
    status: 'running',
  },
  {
    id: 'pr-006',
    name: 'Giảm 15%',
    code: 'NHNS153',
    description: 'Giảm 15% tối đa 200K cho mọi đơn hàng.',
    discountType: 'percent',
    discountValue: 15,
    maxDiscount: 200000,
    minOrderValue: 0,
    userLimit: 2,
    totalIssued: 500,
    usedCount: 21,
    startDate: '2026-01-01',
    endDate: '2026-05-01',
    status: 'running',
  },
];

// ── In-memory store ────────────────────────────────────────────────────────
let _rows: Promotion[] = [...INITIAL_PROMOTIONS];

// ── Derived status logic ───────────────────────────────────────────────────
export const derivePromotionStatus = (p: Promotion): PromotionStatus => {
  if (p.status === 'paused') return 'paused';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(p.startDate);
  const end = new Date(p.endDate);
  if (!Number.isNaN(end.getTime())) {
    end.setHours(0, 0, 0, 0);
    if (end < today) return 'expired';
  }
  if (!Number.isNaN(start.getTime())) {
    start.setHours(0, 0, 0, 0);
    if (start > today) return 'paused';
  }
  return 'running';
};

// ── Store API ──────────────────────────────────────────────────────────────
export const promotionStore = {
  /** Returns all promotions with derived status applied */
  getAll(): Promotion[] {
    return _rows.map((p) => ({ ...p, status: derivePromotionStatus(p) }));
  },

  /** Returns promotions that are currently running and have stock remaining */
  getActive(): Promotion[] {
    return this.getAll().filter(
      (p) => p.status === 'running' && p.usedCount < p.totalIssued,
    );
  },

  /** Get a single promotion by code (case-insensitive) */
  getByCode(code: string): Promotion | undefined {
    const normalized = code.trim().toUpperCase();
    const row = _rows.find((p) => p.code.toUpperCase() === normalized);
    if (!row) return undefined;
    return { ...row, status: derivePromotionStatus(row) };
  },

  /** Replace the whole list (used by AdminPromotions after edits) */
  setAll(rows: Promotion[]) {
    _rows = rows.map((p) => ({ ...p }));
  },

  /** Add a new promotion */
  add(promotion: Promotion) {
    _rows = [promotion, ..._rows];
  },

  /** Update an existing promotion by id */
  update(updated: Promotion) {
    _rows = _rows.map((p) => (p.id === updated.id ? { ...updated } : p));
  },

  /** Remove a promotion by id */
  remove(id: string) {
    _rows = _rows.filter((p) => p.id !== id);
  },

  /** Increment usedCount after a successful redemption */
  recordUsage(code: string) {
    const normalized = code.trim().toUpperCase();
    _rows = _rows.map((p) =>
      p.code.toUpperCase() === normalized
        ? { ...p, usedCount: Math.min(p.usedCount + 1, p.totalIssued) }
        : p,
    );
  },
};
