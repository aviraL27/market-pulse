import { Hono } from "hono";
import { profileUpdateSchema } from "@market-pulse/shared";
import { requireAuth, type AuthVariables } from "../middleware/auth.js";
import { createUserClient } from "../lib/supabase.js";

const profile = new Hono<{ Variables: AuthVariables }>();

profile.use("*", requireAuth);

profile.get("/", async (c) => {
  const token = c.get("accessToken")!;
  const user = c.get("user")!;
  const client = createUserClient(token);

  const { data, error } = await client
    .from("users")
    .select("id, name, email, avatar")
    .eq("id", user.id)
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});

profile.patch("/", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400);

  const token = c.get("accessToken")!;
  const user = c.get("user")!;
  const client = createUserClient(token);

  const { data, error } = await client
    .from("users")
    .update(parsed.data)
    .eq("id", user.id)
    .select("id, name, email, avatar")
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ data });
});

export default profile;
