import app from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./config/db.js";
import { connectRedis, redis } from "./config/redis.js";

const server = app.listen(env.PORT, async () => {
  console.log(`FoodHub API listening on port ${env.PORT}`);
  try {
    await pool.query("SELECT 1");
    console.log("PostgreSQL connected");
  } catch (error) {
    console.error("PostgreSQL connection failed:", error.message);
  }
  console.log((await connectRedis()) ? "Redis connected" : "Redis not configured or unreachable, caching disabled");
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await pool.end();
    redis?.disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
