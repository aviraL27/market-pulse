import type { MarketProduct, PricePoint } from "@market-pulse/shared";
import { fetchJson } from "../../lib/fetch.js";
import { fetchCryptoHistory, generateSyntheticHistory, sortHistory } from "./history.js";

interface CoinGeckoMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  sparkline_in_7d?: { price: number[] };
  last_updated: string;
}

interface CoinCapAsset {
  id: string;
  rank: string;
  symbol: string;
  name: string;
  priceUsd: string;
  changePercent24Hr: string;
}

export async function fetchCryptoMarkets(limit = 20): Promise<MarketProduct[]> {
  try {
    return await fetchFromCoinGecko(limit);
  } catch (e) {
    console.warn("CoinGecko failed, trying CoinCap:", (e as Error).message);
    return fetchFromCoinCap(limit);
  }
}

async function fetchFromCoinGecko(limit: number): Promise<MarketProduct[]> {
  const url = new URL("https://api.coingecko.com/api/v3/coins/markets");
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("order", "market_cap_desc");
  url.searchParams.set("per_page", String(Math.min(limit, 50)));
  url.searchParams.set("page", "1");
  url.searchParams.set("sparkline", "true");
  url.searchParams.set("price_change_percentage", "24h");

  const data = await fetchJson<CoinGeckoMarket[]>(url.toString());

  return data.map((coin) => mapCoinGecko(coin));
}

async function fetchFromCoinCap(limit: number): Promise<MarketProduct[]> {
  const data = await fetchJson<{ data: CoinCapAsset[] }>(
    `https://api.coincap.io/v2/assets?limit=${Math.min(limit, 50)}`
  );

  return data.data.map((coin) => ({
    id: `crypto:${coin.id}`,
    name: coin.name,
    category: "Cryptocurrency",
    current_price: parseFloat(coin.priceUsd) || 0,
    currency: "USD",
    region: "Global",
    source: "crypto" as const,
    price_change_pct: parseFloat(coin.changePercent24Hr) || null,
    updated_at: new Date().toISOString(),
  }));
}

function mapCoinGecko(coin: CoinGeckoMarket): MarketProduct {
  return {
    id: `crypto:${coin.id}`,
    name: coin.name,
    category: "Cryptocurrency",
    current_price: coin.current_price ?? 0,
    currency: "USD",
    region: "Global",
    source: "crypto",
    price_change_pct: coin.price_change_percentage_24h,
    image_url: coin.image,
    history: buildSparklineHistory(coin.sparkline_in_7d?.price),
    updated_at: coin.last_updated ?? new Date().toISOString(),
  };
}

export async function searchCrypto(query: string, limit = 10): Promise<MarketProduct[]> {
  try {
    const data = await fetchJson<{ coins: { id: string }[] }>(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`
    );
    const ids = data.coins.slice(0, limit).map((c) => c.id);
    if (ids.length === 0) return [];
    return fetchCryptoByIds(ids);
  } catch {
    const all = await fetchCryptoMarkets(50);
    const q = query.toLowerCase();
    return all
      .filter((p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q))
      .slice(0, limit);
  }
}

async function fetchCryptoByIds(ids: string[]): Promise<MarketProduct[]> {
  const url = new URL("https://api.coingecko.com/api/v3/coins/markets");
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("ids", ids.join(","));
  url.searchParams.set("sparkline", "true");
  url.searchParams.set("price_change_percentage", "24h");

  try {
    const data = await fetchJson<CoinGeckoMarket[]>(url.toString());
    return data.map(mapCoinGecko);
  } catch {
    return [];
  }
}

function buildSparklineHistory(prices?: number[]): PricePoint[] | undefined {
  if (!prices?.length) return undefined;
  const now = Date.now();
  const step = (7 * 24 * 60 * 60 * 1000) / prices.length;
  return sortHistory(
    prices.map((price, i) => ({
      date: new Date(now - (prices.length - i) * step).toISOString().slice(0, 10),
      price,
    }))
  );
}

export async function getCryptoById(id: string): Promise<MarketProduct | null> {
  const coinId = id.replace(/^crypto:/, "");
  let product: MarketProduct | null = null;

  const markets = await fetchCryptoByIds([coinId]);
  product = markets[0] ?? null;

  if (!product) {
    const all = await fetchCryptoMarkets(100);
    product = all.find((p) => p.id === id) ?? null;
  }

  if (!product) return null;

  const history = await fetchCryptoHistory(coinId, 90);
  if (history.length > 0) {
    product = { ...product, history };
  } else if (!product.history?.length) {
    product = {
      ...product,
      history: generateSyntheticHistory(product.current_price, 90, coinId.length),
    };
  }

  return product;
}
