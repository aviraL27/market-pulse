import type { Context, Next } from "hono";
import { createMiddleware } from "hono/factory";
import { supabaseAdmin } from "../lib/supabase.js";

export type AuthUser = {
  id: string;
  email: string;
};

export type AuthVariables = {
  user: AuthUser | null;
  accessToken: string | null;
};

export const optionalAuth = createMiddleware<{ Variables: AuthVariables }>(
  async (c: Context, next: Next) => {
    const token = extractBearer(c);
    if (!token) {
      c.set("user", null);
      c.set("accessToken", null);
      return next();
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      c.set("user", null);
      c.set("accessToken", null);
      return next();
    }

    c.set("user", { id: data.user.id, email: data.user.email ?? "" });
    c.set("accessToken", token);
    await next();
  }
);

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(
  async (c: Context, next: Next) => {
    const token = extractBearer(c);
    if (!token) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      return c.json({ error: "Invalid or expired session" }, 401);
    }

    c.set("user", { id: data.user.id, email: data.user.email ?? "" });
    c.set("accessToken", token);
    await next();
  }
);

function extractBearer(c: Context): string | null {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice(7);
}
