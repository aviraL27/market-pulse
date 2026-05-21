import type { MarketProduct } from "@market-pulse/shared";
import { generateSyntheticHistory } from "./history.js";

/** Guaranteed local catalog when external APIs fail or rate-limit */
export function getFallbackProducts(): MarketProduct[] {
  const now = new Date().toISOString();
  const items = [
    {
      id: "commodity:wheat",
      name: "Wheat (US)",
      category: "Agriculture",
      current_price: 6.42,
      currency: "USD",
      region: "United States",
      source: "commodity" as const,
      price_change_pct: 1.2,
      seed: 1,
    },
    {
      id: "commodity:gold",
      name: "Gold Spot",
      category: "Metals",
      current_price: 2340,
      currency: "USD",
      region: "Global",
      source: "commodity" as const,
      price_change_pct: 0.8,
      seed: 2,
    },
    {
      id: "fx:USD-EUR",
      name: "USD / EUR",
      category: "Foreign Exchange",
      current_price: 0.92,
      currency: "EUR",
      region: "Europe",
      source: "fx" as const,
      price_change_pct: -0.15,
      seed: 3,
    },
    {
      id: "crypto:bitcoin-demo",
      name: "Bitcoin",
      category: "Cryptocurrency",
      current_price: 67500,
      currency: "USD",
      region: "Global",
      source: "crypto" as const,
      price_change_pct: 2.4,
      seed: 4,
    },
    {
      id: "food:demo-oats",
      name: "Organic Rolled Oats",
      category: "Food & Grocery",
      current_price: 4.99,
      currency: "USD",
      region: "International",
      source: "food" as const,
      price_change_pct: 0.5,
      seed: 5,
    },
  ];

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    current_price: item.current_price,
    currency: item.currency,
    region: item.region,
    source: item.source,
    price_change_pct: item.price_change_pct,
    history: generateSyntheticHistory(item.current_price, 90, item.seed),
    updated_at: now,
  }));
}
