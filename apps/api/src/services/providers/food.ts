import type { MarketProduct } from "@market-pulse/shared";
import { fetchJson } from "../../lib/fetch.js";
import { generateSyntheticHistory } from "./history.js";

interface OffProduct {
  code: string;
  product_name?: string;
  brands?: string;
  categories_tags?: string[];
  image_url?: string;
  countries_tags?: string[];
}

export async function searchFood(query: string, limit = 10): Promise<MarketProduct[]> {
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("search_terms", query);
  url.searchParams.set("search_simple", "1");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", String(limit));
  url.searchParams.set("fields", "code,product_name,brands,categories_tags,image_url,countries_tags");

  const data = await fetchJson<{ products: OffProduct[] }>(url.toString()).catch(() => ({
    products: [] as OffProduct[],
  }));

  return (data.products ?? [])
    .filter((p) => p.product_name)
    .map((p, i) => normalizeFoodProduct(p, i));
}

export async function fetchTrendingFood(limit = 12): Promise<MarketProduct[]> {
  const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
  url.searchParams.set("sort_by", "unique_scans_n");
  url.searchParams.set("action", "process");
  url.searchParams.set("json", "1");
  url.searchParams.set("page_size", String(limit));
  url.searchParams.set("fields", "code,product_name,brands,categories_tags,image_url,countries_tags");

  const data = await fetchJson<{ products: OffProduct[] }>(url.toString()).catch(() => ({
    products: [] as OffProduct[],
  }));

  return (data.products ?? [])
    .filter((p) => p.product_name)
    .map((p, i) => normalizeFoodProduct(p, i));
}

export async function getFoodById(id: string): Promise<MarketProduct | null> {
  const code = id.replace(/^food:/, "");
  const data = await fetchJson<{ product: OffProduct; status: number }>(
    `https://world.openfoodfacts.org/api/v2/product/${code}.json`
  ).catch(() => null);
  if (!data) return null;
  if (data.status !== 1 || !data.product?.product_name) return null;
  const product = normalizeFoodProduct(data.product, 0);
  return {
    ...product,
    history: generateSyntheticHistory(product.current_price, 90, product.id.length),
  };
}

function normalizeFoodProduct(p: OffProduct, seed: number): MarketProduct {
  const category =
    p.categories_tags?.[0]?.replace(/^en:/, "").replace(/-/g, " ") ?? "Food & Grocery";
  const region = p.countries_tags?.[0]?.replace(/^en:/, "") ?? "International";
  const basePrice = 2.5 + (seed % 20) * 0.85 + (p.code?.length ?? 5) * 0.02;

  return {
    id: `food:${p.code}`,
    name: p.product_name ?? "Unknown product",
    category: capitalize(category),
    current_price: Math.round(basePrice * 100) / 100,
    currency: "USD",
    region: capitalize(region),
    source: "food",
    price_change_pct: ((seed % 7) - 3) * 0.4,
    image_url: p.image_url ?? null,
    history: generateSyntheticHistory(basePrice, 90, (p.code?.length ?? 0) + seed),
    updated_at: new Date().toISOString(),
  };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
