import pg from "pg";
import { env } from "./env.js";

// Return NUMERIC as JS numbers (prices fit comfortably in a double)
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (value) => Number(value));

export const pool = new pg.Pool(
  env.DATABASE_URL
    ? { connectionString: env.DATABASE_URL, max: env.DB_POOL_MAX }
    : {
        host: env.DB_HOST,
        port: env.DB_PORT,
        database: env.DB_NAME,
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        max: env.DB_POOL_MAX,
      }
);

pool.on("error", (err) => console.error("Unexpected PostgreSQL error:", err.message));

export const query = (text, params, client = pool) => client.query(text, params);

// Runs fn inside BEGIN/COMMIT, rolling back on any error
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
