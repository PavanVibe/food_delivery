import { createHash } from "node:crypto";
import { redis, isRedisReady } from "../config/redis.js";
import { env } from "../config/env.js";

export const cacheKey = (prefix, params = {}) => {
  const hash = createHash("sha1").update(JSON.stringify(params)).digest("hex").slice(0, 16);
  return `${prefix}:${hash}`;
};

// Read-through cache; falls back to the loader when Redis is down
export async function getOrSet(key, loader, ttlSeconds = env.CACHE_TTL_SECONDS) {
  if (isRedisReady()) {
    try {
      const cached = await redis.get(key);
      if (cached !== null) return JSON.parse(cached);
    } catch {
      // cache miss on error
    }
  }

  const value = await loader();

  if (isRedisReady() && value !== undefined) {
    redis.set(key, JSON.stringify(value), "EX", ttlSeconds).catch(() => {});
  }
  return value;
}

export async function invalidate(...prefixes) {
  if (!isRedisReady()) return;
  for (const prefix of prefixes) {
    const stream = redis.scanStream({ match: `${prefix}*`, count: 200 });
    for await (const keys of stream) {
      if (keys.length) await redis.unlink(...keys);
    }
  }
}
