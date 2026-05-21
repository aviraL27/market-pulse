import type { MarketProduct, TrendingSearch, WatchlistItem } from "@market-pulse/shared";
import { supabase } from "./supabase";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const token = await getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error(
      `Cannot reach API at ${API_URL}. Run "pnpm dev" and ensure the API is on port 3001.`
    );
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.error ?? `Request failed (${res.status})`);
  }

  return json as T;
}

export const api = {
  dashboard: () =>
    request<{ data: MarketProduct[] }>("/api/products/dashboard"),

  trending: () =>
    request<{ data: MarketProduct[] }>("/api/products/trending"),

  topViewed: () =>
    request<{ data: (MarketProduct & { views_count?: number })[] }>(
      "/api/products/top-viewed"
    ),

  search: (q: string, source = "all", limit = 20) =>
    request<{ data: MarketProduct[] }>(
      `/api/products/search?q=${encodeURIComponent(q)}&source=${source}&limit=${limit}`
    ),

  trendingSearches: () =>
    request<{ data: TrendingSearch[] }>("/api/products/trending-searches"),

  recentSearches: () =>
    request<{ data: string[] }>("/api/products/recent-searches"),

  product: (id: string) =>
    request<{ data: MarketProduct }>(`/api/products/${encodeURIComponent(id)}`),

  recordView: (id: string) =>
    request<{ data: { product_id: string; views_count: number } }>(
      `/api/products/${encodeURIComponent(id)}/view`,
      { method: "POST" }
    ),

  watchlist: () => request<{ data: WatchlistItem[] }>("/api/watchlist"),

  addWatchlist: (product_id: string) =>
    request<{ data: unknown }>("/api/watchlist", {
      method: "POST",
      body: JSON.stringify({ product_id }),
    }),

  removeWatchlist: (productId: string) =>
    request<{ data: unknown }>(`/api/watchlist/${encodeURIComponent(productId)}`, {
      method: "DELETE",
    }),
};
