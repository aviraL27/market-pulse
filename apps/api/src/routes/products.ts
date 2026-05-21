import { Hono } from "hono";
import { searchQuerySchema, productIdSchema, paginationSchema } from "@market-pulse/shared";
import {
  getDashboardProducts,
  getProductById,
  getTrendingProducts,
  searchProducts,
} from "../services/market.js";
import { upsertProducts, getTopViewedFromDb } from "../services/products-db.js";
import {
  incrementView,
  getTopViewedProductIds,
  recordSearchTerm,
  getTrendingSearches,
  addRecentSearch,
  getRecentSearches,
} from "../lib/redis.js";
import { syncProductView } from "../services/products-db.js";
import type { AuthVariables } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";

const products = new Hono<{ Variables: AuthVariables }>();

products.get("/dashboard", async (c) => {
  const query = paginationSchema.safeParse(c.req.query());
  const limit = query.success ? query.data.limit : 24;

  const items = await getDashboardProducts();
  await upsertProducts(items);

  return c.json({
    data: items.slice(0, limit),
    meta: { total: items.length, sources: ["crypto", "food", "fx", "commodity"] },
  });
});

products.get("/trending", async (c) => {
  const items = await getTrendingProducts();
  await upsertProducts(items);
  return c.json({ data: items });
});

products.get("/top-viewed", async (c) => {
  let redisTop = await getTopViewedProductIds(12);
  if (redisTop.length === 0) {
    const dbTop = await getTopViewedFromDb(12);
    redisTop = dbTop.map((r) => ({ id: r.product_id, views: Number(r.views_count) }));
  }

  const resolved = await Promise.all(
    redisTop.map(async ({ id, views }) => {
      const product = await getProductById(id);
      return product ? { ...product, views_count: views } : null;
    })
  );

  const data = resolved.filter(Boolean);
  if (data.length === 0) {
    const fallback = await getTrendingProducts();
    return c.json({
      data: fallback.slice(0, 8).map((p) => ({ ...p, views_count: 0 })),
    });
  }

  return c.json({ data });
});

products.get("/search", async (c) => {
  const parsed = searchQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten().fieldErrors }, 400);
  }

  const { q, source, limit } = parsed.data;
  const items = await searchProducts(q, source, limit);
  await upsertProducts(items);
  await recordSearchTerm(q);

  const user = c.get("user");
  if (user) await addRecentSearch(user.id, q);

  return c.json({ data: items, meta: { query: q, source } });
});

products.get("/trending-searches", async (c) => {
  const data = await getTrendingSearches(10);
  return c.json({ data });
});

products.get("/recent-searches", requireAuth, async (c) => {
  const user = c.get("user")!;
  const data = await getRecentSearches(user.id, 10);
  return c.json({ data });
});

products.get("/:id", async (c) => {
  const parsed = productIdSchema.safeParse({ id: c.req.param("id") });
  if (!parsed.success) return c.json({ error: "Invalid product id" }, 400);

  const product = await getProductById(parsed.data.id);
  if (!product) return c.json({ error: "Product not found" }, 404);

  await upsertProducts([product]);
  return c.json({ data: product });
});

products.post("/:id/view", async (c) => {
  const parsed = productIdSchema.safeParse({ id: c.req.param("id") });
  if (!parsed.success) return c.json({ error: "Invalid product id" }, 400);

  const id = parsed.data.id;
  const count = await incrementView(id);
  void syncProductView(id, count);
  return c.json({ data: { product_id: id, views_count: count } });
});

export default products;
