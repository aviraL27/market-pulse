import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { config } from "./config.js";
import { getRedis } from "./lib/redis.js";
import { optionalAuth } from "./middleware/auth.js";
import { rateLimit } from "./middleware/rateLimit.js";
import products from "./routes/products.js";
import watchlist from "./routes/watchlist.js";
import profile from "./routes/profile.js";

const app = new Hono();

if (config.nodeEnv === "development") {
  app.use("*", logger());
}
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return config.corsOrigin;
      if (origin === config.corsOrigin) return origin;
      if (
        config.nodeEnv === "development" &&
        /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
      ) {
        return origin;
      }
      return null;
    },
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.get("/health", async (c) => {
  try {
    const redis = getRedis();
    await redis.ping();
    return c.json({ status: "ok", redis: "connected" });
  } catch {
    return c.json({ status: "degraded", redis: "disconnected" }, 503);
  }
});

const api = new Hono();
api.use("*", optionalAuth);
api.use("*", rateLimit);
api.route("/products", products);
api.route("/watchlist", watchlist);
api.route("/profile", profile);

app.route("/api", api);

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});

getRedis();

serve({ fetch: app.fetch, port: config.port }, (info) => {
  console.log(`Market Pulse API → http://localhost:${info.port}`);
});
