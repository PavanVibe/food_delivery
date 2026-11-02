// Creates the database (if needed) and applies database/init/*.sql in order. Flags: --reset, --skip-orders
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { env } from "../src/config/env.js";

const reset = process.argv.includes("--reset");
const skipOrders = process.argv.includes("--skip-orders");
const initDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../database/init");

const connection = env.DATABASE_URL
  ? { connectionString: env.DATABASE_URL }
  : { host: env.DB_HOST, port: env.DB_PORT, user: env.DB_USER, password: env.DB_PASSWORD, database: env.DB_NAME };

const dbName = env.DATABASE_URL ? new URL(env.DATABASE_URL).pathname.slice(1) : env.DB_NAME;

const admin = new pg.Client(
  env.DATABASE_URL
    ? { connectionString: Object.assign(new URL(env.DATABASE_URL), { pathname: "/postgres" }).toString() }
    : { ...connection, database: "postgres" }
);
await admin.connect();
if (reset) await admin.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
const { rowCount } = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
if (!rowCount) await admin.query(`CREATE DATABASE "${dbName}"`);
await admin.end();

const client = new pg.Client(connection);
await client.connect();
const { rows } = await client.query("SELECT to_regclass('public.users') IS NOT NULL AS initialised");
if (rows[0].initialised) {
  console.log(`Database "${dbName}" is already initialised (use --reset to rebuild)`);
  await client.end();
  process.exit(0);
}

const files = (await readdir(initDir)).filter((file) => file.endsWith(".sql")).sort();
for (const file of files) {
  if (skipOrders && file.includes("orders")) continue;
  const started = performance.now();
  await client.query(await readFile(path.join(initDir, file), "utf8"));
  console.log(`applied ${file} (${Math.round(performance.now() - started)} ms)`);
}
await client.end();
console.log(`Database "${dbName}" ready`);
