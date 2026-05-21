export type ProductSource = "crypto" | "food" | "fx" | "commodity";

export interface PricePoint {
  date: string;
  price: number;
}

export interface MarketProduct {
  id: string;
  name: string;
  category: string;
  current_price: number;
  currency: string;
  region: string;
  source: ProductSource;
  price_change_pct: number | null;
  image_url?: string | null;
  history?: PricePoint[];
  updated_at: string;
}

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  avatar: string | null;
}

export interface WatchlistItem {
  user_id: string;
  product_id: string;
  created_at: string;
  product?: MarketProduct;
}

export interface TrendingSearch {
  term: string;
  score: number;
}

export interface ApiSuccess<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  error: string;
  code?: string;
}
