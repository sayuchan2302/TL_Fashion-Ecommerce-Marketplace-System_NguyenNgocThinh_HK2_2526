export type ReviewStatus = 'pending' | 'approved' | 'hidden';

export interface Review {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  customerName: string;
  customerEmail: string;
  rating: number; // 1-5
  content: string;
  date: string; // ISO string
  status: ReviewStatus;
  reply: string;
  orderId?: string;
  version: number;
}

// Mock data
const initialReviews: Review[] = [
  {
    id: 'rev-001',
    productId: 'prod-101',
    productName: 'Áo Polo Nam Excool',
    productImage: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=80&h=80&fit=crop',
    customerName: 'Nguyễn Văn A',
    customerEmail: 'nguyenvana@email.com',
    rating: 5,
    content: 'Áo rất đẹp, chất vải mát, form vừa vặn. Sẽ mua thêm màu khác.',
    date: '2026-03-20T10:30:00Z',
    status: 'approved',
    reply: 'Cảm ơn bạn đã tin tưởng mua hàng tại Coolmate!',
    orderId: 'CM20260312',
    version: 1,
  },
  {
    id: 'rev-002',
    productId: 'prod-201',
    productName: 'Áo Thun Nam Cổ Tròn Cotton',
    productImage: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=80&h=80&fit=crop',
    customerName: 'Trần Thị B',
    customerEmail: 'tranthib@email.com',
    rating: 4,
    content: 'Chất cotton mặc thoải mái, nhưng size L hơi rộng một chút.',
    date: '2026-03-19T14:15:00Z',
    status: 'pending',
    reply: '',
    orderId: 'CM20260301',
    version: 1,
  },
  {
    id: 'rev-003',
    productId: 'prod-301',
    productName: 'Quần Jeans Nam Slim Fit',
    productImage: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=80&h=80&fit=crop',
    customerName: 'Lê Văn C',
    customerEmail: 'levanc@email.com',
    rating: 2,
    content: 'Quần bị lỗi đường may ở túi sau, rất thất vọng.',
    date: '2026-03-18T09:45:00Z',
    status: 'pending',
    reply: '',
    orderId: 'CM20260220',
    version: 1,
  },
  {
    id: 'rev-004',
    productId: 'prod-401',
    productName: 'Áo Hoodie Oversize Unisex',
    productImage: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=80&h=80&fit=crop',
    customerName: 'Phạm Thị D',
    customerEmail: 'phamthid@email.com',
    rating: 5,
    content: 'Áo ấm lắm, form oversize rất thoải mái. Màu đen đẹp.',
    date: '2026-03-17T16:20:00Z',
    status: 'hidden',
    reply: '',
    orderId: 'CM20260215',
    version: 1,
  },
  {
    id: 'rev-005',
    productId: 'prod-101',
    productName: 'Áo Polo Nam Excool',
    productImage: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=80&h=80&fit=crop',
    customerName: 'Hoàng Văn E',
    customerEmail: 'hoangvane@email.com',
    rating: 3,
    content: 'Chất lượng bình thường, giá hơi cao so với chất lượng.',
    date: '2026-03-16T11:10:00Z',
    status: 'approved',
    reply: 'Cảm ơn góp ý của bạn, chúng tôi sẽ cải thiện chất lượng sản phẩm.',
    orderId: 'CM20260210',
    version: 1,
  },
];

const reviews = [...initialReviews];

export const adminReviewService = {
  getAll: (): Review[] => {
    return [...reviews];
  },

  getById: (id: string): Review | undefined => {
    return reviews.find(r => r.id === id);
  },

  updateStatus: (id: string, status: ReviewStatus): Review | null => {
    const index = reviews.findIndex(r => r.id === id);
    if (index === -1) return null;
    
    reviews[index] = {
      ...reviews[index],
      status,
      version: reviews[index].version + 1,
    };
    return reviews[index];
  },

  addReply: (id: string, reply: string): Review | null => {
    const index = reviews.findIndex(r => r.id === id);
    if (index === -1) return null;
    
    reviews[index] = {
      ...reviews[index],
      reply,
      // If replying to pending, auto-approve
      status: reviews[index].status === 'pending' ? 'approved' : reviews[index].status,
      version: reviews[index].version + 1,
    };
    return reviews[index];
  },

  addReview: (review: Review): Review => {
    reviews.unshift(review);
    return review;
  },

  delete: (id: string): boolean => {
    const index = reviews.findIndex(r => r.id === id);
    if (index === -1) return false;
    reviews.splice(index, 1);
    return true;
  },

  // Statistics
  getStats: () => {
    const total = reviews.length;
    const pending = reviews.filter(r => r.status === 'pending').length;
    const approved = reviews.filter(r => r.status === 'approved').length;
    const hidden = reviews.filter(r => r.status === 'hidden').length;
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;
    
    return { total, pending, approved, hidden, averageRating };
  },

  // Filter helpers
  filterByStatus: (status: ReviewStatus | 'all'): Review[] => {
    if (status === 'all') return [...reviews];
    return reviews.filter(r => r.status === status);
  },

  filterByRating: (rating: number | 'all'): Review[] => {
    if (rating === 'all') return [...reviews];
    return reviews.filter(r => r.rating === rating);
  },

  // Search by product name or customer
  search: (query: string): Review[] => {
    const lowerQuery = query.toLowerCase();
    return reviews.filter(r => 
      r.productName.toLowerCase().includes(lowerQuery) ||
      r.customerName.toLowerCase().includes(lowerQuery) ||
      r.content.toLowerCase().includes(lowerQuery)
    );
  },
};
