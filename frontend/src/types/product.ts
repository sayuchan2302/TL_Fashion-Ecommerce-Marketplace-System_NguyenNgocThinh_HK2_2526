export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  sku: string;
  price: number;
  stock: number;
}

export type ProductStatusType = 'active' | 'low' | 'out';

export interface Product {
  id: number;
  sku: string;
  name: string;
  category?: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  colors?: string[];
  stock: number;
  status: string;
  statusType: ProductStatusType;
  variants?: ProductVariant[];
}
