import { pool } from "../config/db.js";
import { redis, isRedisReady } from "../config/redis.js";

export const healthController = {
  async check(_req, res) {
    let database = "up";
    try {
      await pool.query("SELECT 1");
    } catch {
      database = "down";
    }
    const cache = !redis ? "disabled" : isRedisReady() ? "up" : "down";
    res.status(database === "up" ? 200 : 503).json({ status: database === "up" ? "ok" : "degraded", database, cache });
  },
};
