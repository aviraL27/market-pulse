import type { PricePoint } from "@market-pulse/shared";
import { fetchJson } from "../../lib/fetch.js";

/** Build a realistic daily series (random walk) over `days` */
export function generateSyntheticHistory(
  basePrice: number,
  days = 90,
  seed = 0
): PricePoint[] {
  const points: PricePoint[] = [];
  let price = basePrice;
  const vol = Math.max(basePrice * 0.012, 0.01);

  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const noise =
      Math.sin((i + seed) * 0.45) * vol * 0.6 +
      Math.cos((i + seed) * 0.17) * vol * 0.4 +
      (((seed * 9301 + i * 49297) % 233280) / 233280 - 0.5) * vol * 0.5;
    price = Math.max(price * 0.92, price + noise);
    points.push({
      date: d.toISOString().slice(0, 10),
      price: roundPrice(price, basePrice),
    });
  }

  return points;
}

function roundPrice(price: number, base: number): number {
  if (base >= 1000) return Math.round(price * 100) / 100;
  if (base >= 1) return Math.round(price * 10000) / 10000;
  return Math.round(price * 1000000) / 1000000;
}

export function sortHistory(points: PricePoint[]): PricePoint[] {
  return [...points].sort((a, b) => a.date.localeCompare(b.date));
}

export function pricesFromTimestamps(
  entries: [number, number][],
  maxPoints = 120
): PricePoint[] {
  const step = Math.max(1, Math.floor(entries.length / maxPoints));
  const sampled = entries.filter((_, i) => i % step === 0 || i === entries.length - 1);
  return sampled.map(([ts, price]) => ({
    date: new Date(ts).toISOString().slice(0, 10),
    price,
  }));
}

export async function fetchCryptoHistory(coinId: string, days = 90): Promise<PricePoint[]> {
  try {
    const data = await fetchJson<{ prices: [number, number][] }>(
      `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(coinId)}/market_chart?vs_currency=usd&days=${days}`
    );
    if (data.prices?.length) return sortHistory(pricesFromTimestamps(data.prices));
  } catch (e) {
    console.warn(`CoinGecko history for ${coinId}:`, (e as Error).message);
  }

  try {
    const data = await fetchJson<{ data: { priceUsd: string; time: number }[] }>(
      `https://api.coincap.io/v2/assets/${encodeURIComponent(coinId)}/history?interval=d1`
    );
    const points = (data.data ?? []).map((row) => ({
      date: new Date(row.time).toISOString().slice(0, 10),
      price: parseFloat(row.priceUsd) || 0,
    }));
    if (points.length) return sortHistory(points).slice(-days);
  } catch (e) {
    console.warn(`CoinCap history for ${coinId}:`, (e as Error).message);
  }

  return [];
}

export async function fetchFxHistoryForCurrency(
  currency: string,
  days = 90
): Promise<PricePoint[]> {
  const end = new Date().toISOString().slice(0, 10);
  const start = daysAgo(days);
  try {
    const hist = await fetchJson<{ rates: Record<string, Record<string, number>> }>(
      `https://api.frankfurter.app/${start}..${end}?from=USD&to=${currency}`
    );
    const points: PricePoint[] = [];
    for (const [date, dayRates] of Object.entries(hist.rates)) {
      const price = dayRates[currency];
      if (price !== undefined) points.push({ date, price });
    }
    return sortHistory(points);
  } catch {
    return [];
  }
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
