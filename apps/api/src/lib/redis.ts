import Redis from "ioredis";
import { config } from "../config.js";

let client: Redis | null = null;
let redisReady = false;

function createRedisClient(): Redis {
  const url = config.redisUrl.trim();
  const useTls = url.startsWith("rediss://");

  const instance = new Redis(url, {
    // Prevents MaxRetriesPerRequestError spam when Redis is down
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    connectTimeout: 10_000,
    retryStrategy: (times) => (times > 10 ? null : Math.min(times * 200, 3000)),
    ...(useTls ? { tls: { rejectUnauthorized: true } } : {}),
  });

  instance.on("ready", () => {
    redisReady = true;
    console.log("Redis connected");
  });

  instance.on("error", (err) => {
    redisReady = false;
    console.error("Redis error:", err.message);
  });

  instance.on("close", () => {
    redisReady = false;
  });

  return instance;
}

export function getRedis(): Redis {
  if (!client) client = createRedisClient();
  return client;
}

export function isRedisReady(): boolean {
  return redisReady;
}

export const RedisKeys = {
  cache: (key: string) => `cache:${key}`,
  productViews: (id: string) => `views:product:${id}`,
  trendingSearches: "trending:searches",
  recentSearches: (userId: string) => `recent:searches:${userId}`,
  rateLimit: (id: string) => `rate:${id}`,
} as const;

async function safeRedis<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!redisReady) return fallback;
  try {
    return await fn();
  } catch (err) {
    console.warn("Redis operation skipped:", err instanceof Error ? err.message : err);
    return fallback;
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  return safeRedis(async () => {
    const redis = getRedis();
    const raw = await redis.get(RedisKeys.cache(key));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }, null);
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  await safeRedis(async () => {
    const redis = getRedis();
    await redis.set(RedisKeys.cache(key), JSON.stringify(value), "EX", ttlSeconds);
  }, undefined);
}

export async function incrementView(productId: string): Promise<number> {
  return safeRedis(async () => {
    const redis = getRedis();
    return redis.incr(RedisKeys.productViews(productId));
  }, 0);
}

export async function recordSearchTerm(term: string): Promise<void> {
  await safeRedis(async () => {
    const redis = getRedis();
    const normalized = term.toLowerCase().trim().slice(0, 100);
    await redis.zincrby(RedisKeys.trendingSearches, 1, normalized);
  }, undefined);
}

export async function getTrendingSearches(limit = 10): Promise<{ term: string; score: number }[]> {
  return safeRedis(async () => {
    const redis = getRedis();
    const results = await redis.zrevrange(RedisKeys.trendingSearches, 0, limit - 1, "WITHSCORES");
    const items: { term: string; score: number }[] = [];
    for (let i = 0; i < results.length; i += 2) {
      items.push({ term: results[i], score: parseFloat(results[i + 1] ?? "0") });
    }
    return items;
  }, []);
}

export async function getTopViewedProductIds(limit = 10): Promise<{ id: string; views: number }[]> {
  return safeRedis(async () => {
    const redis = getRedis();
    const keys = await redis.keys("views:product:*");
    if (keys.length === 0) return [];

    const pipeline = redis.pipeline();
    for (const k of keys) pipeline.get(k);
    const results = await pipeline.exec();

    const scored: { id: string; views: number }[] = [];
    keys.forEach((key, i) => {
      const id = key.replace("views:product:", "");
      const views = parseInt(String(results?.[i]?.[1] ?? "0"), 10);
      if (views > 0) scored.push({ id, views });
    });

    return scored.sort((a, b) => b.views - a.views).slice(0, limit);
  }, []);
}

export async function addRecentSearch(userId: string, term: string): Promise<void> {
  await safeRedis(async () => {
    const redis = getRedis();
    const key = RedisKeys.recentSearches(userId);
    await redis.lpush(key, term.toLowerCase().trim());
    await redis.ltrim(key, 0, 19);
    await redis.expire(key, 60 * 60 * 24 * 30);
  }, undefined);
}

export async function getRecentSearches(userId: string, limit = 10): Promise<string[]> {
  return safeRedis(async () => {
    const redis = getRedis();
    return redis.lrange(RedisKeys.recentSearches(userId), 0, limit - 1);
  }, []);
}
