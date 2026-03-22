/**
 * adminReturnService.ts — Shared return request store.
 * Client Returns.tsx submits to this store; AdminReturns reads from it.
 */

export type ReturnReason = 'size' | 'defect' | 'change' | 'other';
export type ReturnResolution = 'exchange' | 'refund';
export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface ReturnItem {
  id: string;
  name: string;
  variant: string;
  price: number;
  image: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: ReturnItem[];
  reason: ReturnReason;
  note: string;
  resolution: ReturnResolution;
  status: ReturnStatus;
  createdAt: string;
  updatedAt: string;
  adminNote?: string;
}

const REASON_LABELS: Record<ReturnReason, string> = {
  size: 'Sai size',
  defect: 'Hàng lỗi',
  change: 'Đổi ý',
  other: 'Lý do khác',
};

const RESOLUTION_LABELS: Record<ReturnResolution, string> = {
  exchange: 'Đổi size/màu',
  refund: 'Hoàn tiền',
};

const SEED_RETURNS: ReturnRequest[] = [
  {
    id: 'RET-001',
    orderId: 'DH123455',
    customerName: 'Anh Thịnh',
    customerEmail: 'anhthinh@example.com',
    customerPhone: '0382253049',
    items: [
      { id: '208', name: 'Áo Dây Cami Lụa Mát Mẻ', variant: 'Trắng - S', price: 159000, image: 'https://media.coolmate.me/cdn-cgi/image/width=320,height=470,quality=85/uploads/November2024/24CMCW.AT005.5_88.jpg' },
    ],
    reason: 'size',
    note: 'Size S hơi chật, muốn đổi sang M',
    resolution: 'exchange',
    status: 'pending',
    createdAt: '2026-03-15T09:00:00Z',
    updatedAt: '2026-03-15T09:00:00Z',
  },
  {
    id: 'RET-002',
    orderId: 'ORD-10233',
    customerName: 'Trần Thị Lan',
    customerEmail: 'thilan@example.com',
    customerPhone: '0905 111 222',
    items: [
      { id: '4', name: 'Váy Midi Floral', variant: 'Hồng - S', price: 459000, image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?auto=format&fit=crop&w=200&h=260&q=80' },
    ],
    reason: 'defect',
    note: 'Đường chỉ may bị lỗi ở phần gấu váy',
    resolution: 'refund',
    status: 'approved',
    createdAt: '2026-03-12T14:30:00Z',
    updatedAt: '2026-03-13T10:00:00Z',
    adminNote: 'Đã xác nhận lỗi, đang xử lý hoàn tiền',
  },
];

let _returns: ReturnRequest[] = [...SEED_RETURNS];

export const reasonLabel = (reason: ReturnReason) => REASON_LABELS[reason] || reason;
export const resolutionLabel = (resolution: ReturnResolution) => RESOLUTION_LABELS[resolution] || resolution;

export const adminReturnService = {
  getAll(): ReturnRequest[] {
    return [..._returns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getById(id: string): ReturnRequest | undefined {
    return _returns.find((r) => r.id === id);
  },

  /** Called by client Returns.tsx on submit */
  submit(request: Omit<ReturnRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>): ReturnRequest {
    const now = new Date().toISOString();
    const newRequest: ReturnRequest = {
      ...request,
      id: `RET-${Date.now()}`,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    _returns = [newRequest, ..._returns];
    return newRequest;
  },

  /** Admin approves or rejects a return request */
  updateStatus(id: string, status: ReturnStatus, adminNote?: string): ReturnRequest | null {
    const index = _returns.findIndex((r) => r.id === id);
    if (index < 0) return null;
    const updated: ReturnRequest = {
      ..._returns[index],
      status,
      adminNote: adminNote || _returns[index].adminNote,
      updatedAt: new Date().toISOString(),
    };
    _returns = _returns.map((r) => (r.id === id ? updated : r));
    return updated;
  },

  delete(id: string): boolean {
    const len = _returns.length;
    _returns = _returns.filter((r) => r.id !== id);
    return _returns.length < len;
  },

  getStats() {
    const all = this.getAll();
    return {
      total: all.length,
      pending: all.filter((r) => r.status === 'pending').length,
      approved: all.filter((r) => r.status === 'approved').length,
      completed: all.filter((r) => r.status === 'completed').length,
      rejected: all.filter((r) => r.status === 'rejected').length,
    };
  },
};
