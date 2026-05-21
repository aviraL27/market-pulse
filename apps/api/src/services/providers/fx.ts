import type { MarketProduct, PricePoint } from "@market-pulse/shared";
import { fetchJson } from "../../lib/fetch.js";
import { fetchFxHistoryForCurrency, generateSyntheticHistory } from "./history.js";

export async function fetchFxRates(): Promise<MarketProduct[]> {
  const data = await fetchJson<{ base: string; date: string; rates: Record<string, number> }>(
    "https://api.frankfurter.app/latest?from=USD"
  );

  const major = ["EUR", "GBP", "JPY", "INR", "AUD", "CAD", "CHF", "CNY", "BRL", "MXN"];
  let historyByCurrency: Record<string, PricePoint[]> = {};
  try {
    const hist = await fetchJson<{ rates: Record<string, Record<string, number>> }>(
      `https://api.frankfurter.app/${daysAgo(90)}..${data.date}?from=USD&to=${major.join(",")}`
    );
    historyByCurrency = buildFxHistory(hist.rates);
  } catch {
    /* history optional */
  }

  return Object.entries(data.rates)
    .filter(([code]) => major.includes(code) || Object.keys(data.rates).length <= 30)
    .slice(0, 15)
    .map(([code, rate]) => {
      const prev = historyByCurrency[code];
      const prevPrice = prev?.length >= 2 ? prev[prev.length - 2].price : rate;
      const change = prevPrice ? ((rate - prevPrice) / prevPrice) * 100 : null;

      return {
        id: `fx:USD-${code}`,
        name: `USD / ${code}`,
        category: "Foreign Exchange",
        current_price: rate,
        currency: code,
        region: regionForCurrency(code),
        source: "fx" as const,
        price_change_pct: change !== null ? Math.round(change * 100) / 100 : null,
        history: prev,
        updated_at: `${data.date}T12:00:00.000Z`,
      };
    });
}

export async function searchFx(query: string): Promise<MarketProduct[]> {
  const all = await fetchFxRates();
  const q = query.toUpperCase();
  return all.filter(
    (p) => p.name.includes(q) || p.currency.includes(q) || p.id.toUpperCase().includes(q)
  );
}

export async function getFxById(id: string): Promise<MarketProduct | null> {
  const all = await fetchFxRates();
  const product = all.find((p) => p.id === id) ?? null;
  if (!product) return null;

  const currency = product.currency;
  const history = await fetchFxHistoryForCurrency(currency, 90);
  if (history.length > 0) return { ...product, history };

  return {
    ...product,
    history: generateSyntheticHistory(product.current_price, 90, currency.charCodeAt(0)),
  };
}

function buildFxHistory(rates: Record<string, Record<string, number>>): Record<string, PricePoint[]> {
  const result: Record<string, PricePoint[]> = {};
  for (const [date, dayRates] of Object.entries(rates)) {
    for (const [currency, price] of Object.entries(dayRates)) {
      if (!result[currency]) result[currency] = [];
      result[currency].push({ date, price });
    }
  }
  for (const c of Object.keys(result)) {
    result[c].sort((a, b) => a.date.localeCompare(b.date));
  }
  return result;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function regionForCurrency(code: string): string {
  const map: Record<string, string> = {
    EUR: "Europe",
    GBP: "United Kingdom",
    JPY: "Japan",
    INR: "India",
    AUD: "Australia",
    CAD: "Canada",
    CHF: "Switzerland",
    CNY: "China",
    BRL: "Brazil",
    MXN: "Mexico",
  };
  return map[code] ?? "Global";
}
