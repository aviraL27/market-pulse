import type { MarketProduct } from "@market-pulse/shared";
import { cacheGet, cacheSet } from "../lib/redis.js";
import { config } from "../config.js";
import * as crypto from "./providers/crypto.js";
import * as food from "./providers/food.js";
import * as fx from "./providers/fx.js";
import * as commodity from "./providers/commodity.js";
import { getFallbackProducts } from "./providers/fallback.js";

export type SourceFilter = "crypto" | "food" | "fx" | "commodity" | "all";

function logProviderResult(name: string, result: PromiseSettledResult<MarketProduct[]>) {
  if (result.status === "fulfilled") {
    console.log(`[market] ${name}: ${result.value.length} products`);
  } else {
    console.warn(`[market] ${name} failed:`, result.reason?.message ?? result.reason);
  }
}

export async function getDashboardProducts(): Promise<MarketProduct[]> {
  const cacheKey = "dashboard:mixed";
  const cached = await cacheGet<MarketProduct[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  const results = await Promise.allSettled([
    crypto.fetchCryptoMarkets(8),
    food.fetchTrendingFood(6),
    fx.fetchFxRates(),
    commodity.fetchCommodities(),
  ]);

  logProviderResult("crypto", results[0]);
  logProviderResult("food", results[1]);
  logProviderResult("fx", results[2]);
  logProviderResult("commodity", results[3]);

  let merged: MarketProduct[] = [
    ...(results[0].status === "fulfilled" ? results[0].value : []),
    ...(results[1].status === "fulfilled" ? results[1].value : []),
    ...(results[2].status === "fulfilled" ? results[2].value.slice(0, 6) : []),
    ...(results[3].status === "fulfilled" ? results[3].value : []),
  ];

  if (merged.length === 0) {
    console.warn("[market] All providers empty — using fallback catalog");
    merged = getFallbackProducts();
  }

  if (merged.length > 0) {
    await cacheSet(cacheKey, merged, config.cacheTtlSeconds);
  }

  return merged;
}

export async function searchProducts(
  query: string,
  source: SourceFilter,
  limit: number
): Promise<MarketProduct[]> {
  const cacheKey = `search:${source}:${query}:${limit}`;
  const cached = await cacheGet<MarketProduct[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  const perSource = Math.ceil(limit / (source === "all" ? 4 : 1));
  const tasks: Promise<MarketProduct[]>[] = [];

  if (source === "all" || source === "crypto") {
    tasks.push(crypto.searchCrypto(query, perSource).catch(() => []));
  }
  if (source === "all" || source === "food") {
    tasks.push(food.searchFood(query, perSource).catch(() => []));
  }
  if (source === "all" || source === "fx") {
    tasks.push(fx.searchFx(query).then((r) => r.slice(0, perSource)).catch(() => []));
  }
  if (source === "all" || source === "commodity") {
    tasks.push(commodity.searchCommodity(query).then((r) => r.slice(0, perSource)).catch(() => []));
  }

  const results = await Promise.all(tasks);
  let merged = dedupeById(results.flat()).slice(0, limit);

  if (merged.length === 0) {
    const q = query.toLowerCase();
    merged = getFallbackProducts().filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.source.includes(q)
    );
  }

  if (merged.length > 0) {
    await cacheSet(cacheKey, merged, Math.min(config.cacheTtlSeconds, 60));
  }

  return merged;
}

export async function getProductById(id: string): Promise<MarketProduct | null> {
  const cacheKey = `product:${id}`;
  const cached = await cacheGet<MarketProduct>(cacheKey);
  if (cached) return cached;

  let product: MarketProduct | null = null;
  if (id.startsWith("crypto:")) product = await crypto.getCryptoById(id);
  else if (id.startsWith("food:")) product = await food.getFoodById(id);
  else if (id.startsWith("fx:")) product = await fx.getFxById(id);
  else if (id.startsWith("commodity:")) product = await commodity.getCommodityById(id);

  if (!product) {
    product = getFallbackProducts().find((p) => p.id === id) ?? null;
  }

  if (product) await cacheSet(cacheKey, product, config.cacheTtlSeconds);
  return product;
}

export async function getTrendingProducts(): Promise<MarketProduct[]> {
  const all = await getDashboardProducts();
  return [...all]
    .sort((a, b) => Math.abs(b.price_change_pct ?? 0) - Math.abs(a.price_change_pct ?? 0))
    .slice(0, 12);
}

function dedupeById(products: MarketProduct[]): MarketProduct[] {
  const seen = new Set<string>();
  return products.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}
