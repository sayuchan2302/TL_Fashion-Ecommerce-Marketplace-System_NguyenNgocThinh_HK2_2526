import { apiRequest } from './apiClient';

interface BackendStoreFollowResponse {
  storeId: string;
  followerCount?: number;
  followedByCurrentUser?: boolean;
}

export interface StoreFollowState {
  storeId: string;
  followerCount: number;
  followedByCurrentUser: boolean;
}

interface BackendFollowedStoreItem {
  storeId: string;
  storeName?: string;
  storeSlug?: string;
  storeLogo?: string;
  rating?: number;
  totalOrders?: number;
  followerCount?: number;
  followedAt?: string;
}

export interface FollowedStoreItem {
  storeId: string;
  storeName: string;
  storeSlug: string;
  storeLogo?: string;
  rating: number;
  totalOrders: number;
  followerCount: number;
  followedAt?: string;
}

const mapFollowState = (row: BackendStoreFollowResponse): StoreFollowState => ({
  storeId: row.storeId,
  followerCount: Math.max(0, Number(row.followerCount || 0)),
  followedByCurrentUser: Boolean(row.followedByCurrentUser),
});

const mapFollowedStoreItem = (row: BackendFollowedStoreItem): FollowedStoreItem => ({
  storeId: row.storeId,
  storeName: row.storeName?.trim() || 'Cửa hàng',
  storeSlug: row.storeSlug?.trim() || '',
  storeLogo: row.storeLogo?.trim() || undefined,
  rating: Math.max(0, Number(row.rating || 0)),
  totalOrders: Math.max(0, Number(row.totalOrders || 0)),
  followerCount: Math.max(0, Number(row.followerCount || 0)),
  followedAt: row.followedAt || undefined,
});

export const storeFollowService = {
  async getFollowerCount(storeId: string): Promise<StoreFollowState> {
    const response = await apiRequest<BackendStoreFollowResponse>(`/api/stores/${storeId}/followers/count`);
    return mapFollowState(response);
  },

  async getFollowStatus(storeId: string): Promise<StoreFollowState> {
    const response = await apiRequest<BackendStoreFollowResponse>(
      `/api/stores/${storeId}/follow-status`,
      {},
      { auth: true },
    );
    return mapFollowState(response);
  },

  async follow(storeId: string): Promise<StoreFollowState> {
    const response = await apiRequest<BackendStoreFollowResponse>(
      `/api/stores/${storeId}/follow`,
      { method: 'POST' },
      { auth: true },
    );
    return mapFollowState(response);
  },

  async unfollow(storeId: string): Promise<StoreFollowState> {
    const response = await apiRequest<BackendStoreFollowResponse>(
      `/api/stores/${storeId}/follow`,
      { method: 'DELETE' },
      { auth: true },
    );
    return mapFollowState(response);
  },

  async getMyFollowingStores(): Promise<FollowedStoreItem[]> {
    const response = await apiRequest<BackendFollowedStoreItem[]>(
      '/api/users/me/following-stores',
      { method: 'GET' },
      { auth: true },
    );
    return Array.isArray(response) ? response.map(mapFollowedStoreItem) : [];
  },
};
