import { Hono } from "hono";
import { productIdSchema, watchlistBodySchema } from "@market-pulse/shared";
import { requireAuth, type AuthVariables } from "../middleware/auth.js";
import { createUserClient } from "../lib/supabase.js";
import { getProductById } from "../services/market.js";
import { upsertProducts } from "../services/products-db.js";
import { clientErrorMessage } from "../lib/errors.js";

const watchlist = new Hono<{ Variables: AuthVariables }>();

watchlist.use("*", requireAuth);

watchlist.get("/", async (c) => {
  const token = c.get("accessToken")!;
  const user = c.get("user")!;
  const client = createUserClient(token);

  const { data, error } = await client
    .from("watchlists")
    .select("product_id, created_at, products(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return c.json({ error: clientErrorMessage("Failed to load watchlist", error.message) }, 500);

  const items = (data ?? []).map((row) => {
    const p = row.products as unknown as Record<string, unknown> | null;
    return {
      product_id: row.product_id,
      created_at: row.created_at,
      product: p
        ? {
            id: p.id,
            name: p.name,
            category: p.category,
            current_price: Number(p.current_price),
            currency: p.currency,
            region: p.region,
            source: p.source,
            price_change_pct: p.price_change_pct ? Number(p.price_change_pct) : null,
            image_url: p.image_url,
            updated_at: p.updated_at,
          }
        : null,
    };
  });

  return c.json({ data: items });
});

watchlist.post("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = watchlistBodySchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const product = await getProductById(parsed.data.product_id);
  if (!product) return c.json({ error: "Product not found" }, 404);

  await upsertProducts([product]);

  const token = c.get("accessToken")!;
  const user = c.get("user")!;
  const client = createUserClient(token);

  const { error } = await client.from("watchlists").insert({
    user_id: user.id,
    product_id: parsed.data.product_id,
  });

  if (error) {
    if (error.code === "23505") return c.json({ data: { product_id: parsed.data.product_id } });
    return c.json({ error: clientErrorMessage("Failed to add to watchlist", error.message) }, 500);
  }

  return c.json({ data: { product_id: parsed.data.product_id, product } }, 201);
});

watchlist.delete("/:productId", async (c) => {
  const parsed = productIdSchema.safeParse({ id: c.req.param("productId") });
  if (!parsed.success) return c.json({ error: "Invalid product id" }, 400);

  const productId = parsed.data.id;
  const token = c.get("accessToken")!;
  const user = c.get("user")!;
  const client = createUserClient(token);

  const { error } = await client
    .from("watchlists")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId);

  if (error) return c.json({ error: clientErrorMessage("Failed to remove from watchlist", error.message) }, 500);
  return c.json({ data: { removed: productId } });
});

export default watchlist;
