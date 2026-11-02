import Redis from "ioredis";
import { env } from "./env.js";

export const redis = env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => Math.min(times * 500, 5000),
    })
  : null;

redis?.on("error", (err) => {
  if (env.NODE_ENV !== "test") console.warn("Redis unavailable:", err.message);
});

export async function connectRedis() {
  if (!redis) return false;
  try {
    await redis.connect();
    return true;
  } catch {
    return false;
  }
}

export const isRedisReady = () => redis?.status === "ready";
