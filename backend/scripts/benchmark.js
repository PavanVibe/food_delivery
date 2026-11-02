// Times the hot read paths against a seeded database. Flag: --assert fails if any p95 >= 100 ms
import { pool } from "../src/config/db.js";
import { analyticsRepository } from "../src/repositories/analyticsRepository.js";
import { foodRepository } from "../src/repositories/foodRepository.js";
import { orderRepository } from "../src/repositories/orderRepository.js";

const RUNS = 50;
const BUDGET_MS = 100;

const { rows: counts } = await pool.query("SELECT (SELECT COUNT(*) FROM orders)::int AS orders, (SELECT COUNT(*) FROM order_items)::int AS items");
const { rows: demo } = await pool.query("SELECT id FROM users WHERE email = 'demo@foodhub.dev'");
const { rows: owned } = await pool.query(
  "SELECT array_agg(r.id) AS ids FROM restaurants r JOIN users u ON u.id = r.owner_id WHERE u.email = 'owner@foodhub.dev'"
);
const demoId = demo[0]?.id;
const ownerIds = owned[0]?.ids ?? [];
const page = { limit: 20, offset: 0 };

// [name, query, counts toward the latency budget]
const cases = [
  ["orders: customer history", () => orderRepository.findByUser(demoId, page), true],
  ["orders: owner live queue", () => orderRepository.findForRestaurants(ownerIds, { status: "active", ...page }), true],
  ["orders: admin all (paged)", () => orderRepository.findForRestaurants(null, page), true],
  ["analytics: summary 30d (owner)", () => analyticsRepository.summary({ days: 30, restaurantIds: ownerIds }), true],
  ["analytics: summary 30d (all)", () => analyticsRepository.summary({ days: 30, restaurantIds: null }), true],
  ["analytics: daily sales 30d", () => analyticsRepository.dailySales({ days: 30, restaurantIds: null }), true],
  ["analytics: top foods 30d", () => analyticsRepository.topFoods({ days: 30, restaurantIds: null, limit: 10 }), true],
  ["analytics: peak hours 30d", () => analyticsRepository.peakHours({ days: 30, restaurantIds: null }), true],
  ["menu: list foods", () => foodRepository.findMany({ sort: "rating", limit: 24, offset: 0 }), true],
  ["menu: fuzzy search", () => foodRepository.search("panner", 20), true],
  ["analytics: summary 180d (full scan)", () => analyticsRepository.summary({ days: 180, restaurantIds: null }), false],
];

const percentile = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];

const results = [];
for (const [name, run, budgeted] of cases) {
  for (let i = 0; i < 3; i++) await run();
  const timings = [];
  for (let i = 0; i < RUNS; i++) {
    const started = performance.now();
    await run();
    timings.push(performance.now() - started);
  }
  timings.sort((a, b) => a - b);
  results.push({
    query: name,
    "p50 ms": +percentile(timings, 50).toFixed(1),
    "p95 ms": +percentile(timings, 95).toFixed(1),
    "max ms": +timings.at(-1).toFixed(1),
    budget: budgeted ? `< ${BUDGET_MS} ms` : "info",
  });
}

console.log(`\nDataset: ${counts[0].orders} orders, ${counts[0].items} order items, ${RUNS} runs each\n`);
console.table(results);
await pool.end();

const slow = results.filter((row) => row.budget !== "info" && row["p95 ms"] >= BUDGET_MS);
if (process.argv.includes("--assert") && slow.length) {
  console.error(`p95 over ${BUDGET_MS} ms: ${slow.map((row) => row.query).join(", ")}`);
  process.exit(1);
}
