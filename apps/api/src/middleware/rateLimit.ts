import { createMiddleware } from "hono/factory";
import { config } from "../config.js";
import { getRedis, isRedisReady, RedisKeys } from "../lib/redis.js";

export const rateLimit = createMiddleware(async (c, next) => {
  if (!isRedisReady()) {
    await next();
    return;
  }

  const user = c.get("user" as never) as { id: string } | null | undefined;
  const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = user?.id ? `user:${user.id}` : `ip:${ip}`;

  try {
    const redis = getRedis();
    const redisKey = RedisKeys.rateLimit(key);
    const count = await redis.incr(redisKey);

    if (count === 1) {
      await redis.pexpire(redisKey, config.rateLimitWindowMs);
    }

    if (count > config.rateLimitMax) {
      return c.json({ error: "Too many requests. Please slow down." }, 429);
    }
  } catch {
    // Allow traffic if Redis is temporarily unavailable
  }

  await next();
});
