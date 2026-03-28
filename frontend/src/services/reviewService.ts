export type ReviewStatus = 'pending' | 'approved' | 'hidden';

export interface Review {
  id: string;
  storeId: string;
  productId: string;
  productName: string;
  productImage: string;
  orderId: string;
  rating: number;
  title?: string;
  content: string;
  images?: string[];
  createdAt: string;
  updatedAt?: string;
  helpful: number;
  shopReply?: {
    content: string;
    createdAt: string;
  };
  status: ReviewStatus;
  version: number;
}

export interface ReviewSubmission {
  storeId?: string;
  productId: string;
  productName?: string;
  productImage?: string;
  orderId: string;
  rating: number;
  title?: string;
  content: string;
  images?: string[];
}

const STORAGE_KEY = 'fashionstore_reviews_v1';

const parseStoredReviews = (): Review[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistReviews = (reviews: Review[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
};

const sortByNewest = (rows: Review[]) =>
  [...rows].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());

const isApproved = (review: Review) => review.status === 'approved';

const buildSubmissionRecord = (submission: ReviewSubmission): Review => ({
  id: `rev_${Date.now()}_${Math.round(Math.random() * 1000)}`,
  storeId: submission.storeId || 'store_001',
  productId: submission.productId,
  productName: submission.productName || 'San pham',
  productImage: submission.productImage || '',
  orderId: submission.orderId,
  rating: submission.rating,
  title: submission.title,
  content: submission.content,
  images: submission.images,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  helpful: 0,
  shopReply: undefined,
  status: 'pending',
  version: 1,
});

export const reviewService = {
  async getReviews(): Promise<Review[]> {
    return sortByNewest(parseStoredReviews());
  },

  async getReviewsByStore(storeId: string): Promise<Review[]> {
    const all = await this.getReviews();
    return all.filter((review) => review.storeId === storeId);
  },

  async getReviewsByOrder(orderId: string): Promise<Review[]> {
    const all = await this.getReviews();
    return all.filter((review) => review.orderId === orderId && isApproved(review));
  },

  async getReviewsByProduct(productId: string): Promise<Review[]> {
    const all = await this.getReviews();
    return all.filter((review) => review.productId === productId && isApproved(review));
  },

  async getAverageRating(productId: string): Promise<number> {
    const reviews = await this.getReviewsByProduct(productId);
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Math.round((sum / reviews.length) * 10) / 10;
  },

  async submitReview(submission: ReviewSubmission): Promise<Review> {
    const rows = parseStoredReviews();
    const next = buildSubmissionRecord(submission);
    persistReviews([next, ...rows]);
    return next;
  },

  async hasReviewed(productId: string, orderId: string): Promise<boolean> {
    const all = await this.getReviews();
    return all.some((review) => review.productId === productId && review.orderId === orderId);
  },

  // Backend has no vendor reply endpoint yet, so seller UI must stay read-only for reply action.
  canVendorReply(): boolean {
    return false;
  },
};
