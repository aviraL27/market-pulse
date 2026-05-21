import type { MarketProduct } from "@market-pulse/shared";
import { generateSyntheticHistory } from "./history.js";

/** Demo commodity indices — synthetic stable IDs with realistic labels */
const COMMODITIES = [
  { id: "wheat", name: "Wheat (US)", category: "Agriculture", base: 6.42, region: "United States" },
  { id: "corn", name: "Corn (US)", category: "Agriculture", base: 4.18, region: "United States" },
  { id: "rice", name: "Rice (Asia)", category: "Agriculture", base: 12.35, region: "Asia" },
  { id: "coffee", name: "Coffee Arabica", category: "Soft Commodity", base: 1.82, region: "Global" },
  { id: "cotton", name: "Cotton", category: "Soft Commodity", base: 0.71, region: "Global" },
  { id: "gold", name: "Gold Spot", category: "Metals", base: 2340, region: "Global" },
  { id: "silver", name: "Silver Spot", category: "Metals", base: 28.5, region: "Global" },
  { id: "crude", name: "Crude Oil WTI", category: "Energy", base: 78.2, region: "North America" },
  { id: "natural-gas", name: "Natural Gas", category: "Energy", base: 2.45, region: "North America" },
  { id: "copper", name: "Copper", category: "Metals", base: 4.12, region: "Global" },
];

export async function fetchCommodities(): Promise<MarketProduct[]> {
  const day = new Date().getDate();
  return COMMODITIES.map((c, i) => {
    const variance = Math.sin(day + i) * 0.03;
    const price = c.base * (1 + variance);
    const change = Math.cos(day + i * 2) * 2.5;

    return {
      id: `commodity:${c.id}`,
      name: c.name,
      category: c.category,
      current_price: Math.round(price * 100) / 100,
      currency: "USD",
      region: c.region,
      source: "commodity" as const,
      price_change_pct: Math.round(change * 100) / 100,
      history: generateSyntheticHistory(c.base, 90, i + c.base),
      updated_at: new Date().toISOString(),
    };
  });
}

export async function searchCommodity(query: string): Promise<MarketProduct[]> {
  const q = query.toLowerCase();
  const all = await fetchCommodities();
  return all.filter(
    (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  );
}

export async function getCommodityById(id: string): Promise<MarketProduct | null> {
  const all = await fetchCommodities();
  return all.find((p) => p.id === id) ?? null;
}

