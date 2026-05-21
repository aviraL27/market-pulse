import type { MarketProduct } from "@market-pulse/shared";
import { supabaseAdmin } from "../lib/supabase.js";

export async function upsertProducts(products: MarketProduct[]): Promise<void> {
  if (products.length === 0) return;

  const rows = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    current_price: p.current_price,
    currency: p.currency,
    region: p.region,
    source: p.source,
    price_change_pct: p.price_change_pct,
    image_url: p.image_url ?? null,
    metadata: { history: p.history ?? [] },
    updated_at: p.updated_at,
  }));

  const { error } = await supabaseAdmin.from("products").upsert(rows, { onConflict: "id" });
  if (error) console.error("upsertProducts:", error.message);
}

export async function syncProductView(productId: string, redisCount: number): Promise<void> {
  await supabaseAdmin.from("views").upsert(
    {
      product_id: productId,
      views_count: redisCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product_id" }
  );
}

export async function getTopViewedFromDb(limit = 10): Promise<{ product_id: string; views_count: number }[]> {
  const { data } = await supabaseAdmin
    .from("views")
    .select("product_id, views_count")
    .order("views_count", { ascending: false })
    .limit(limit);

  return data ?? [];
}
