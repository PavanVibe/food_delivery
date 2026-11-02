import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "../../src/app.js";
import { pool } from "../../src/config/db.js";

const email = `it-${Date.now()}@example.com`;
const state = {};

const login = async (credentials) => {
  const res = await request(app).post("/api/auth/login").send(credentials);
  expect(res.status).toBe(200);
  return { Authorization: `Bearer ${res.body.data.token}` };
};

beforeAll(async () => {
  state.owner = await login({ email: "owner@foodhub.dev", password: "Owner@123" });
});

afterAll(async () => {
  await pool.query("DELETE FROM users WHERE email = $1", [email]);
  await pool.end();
});

describe("customer to kitchen flow (real PostgreSQL)", () => {
  it("reports healthy", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.database).toBe("up");
  });

  it("registers a new customer", async () => {
    const res = await request(app).post("/api/auth/register").send({ name: "Integration User", email, password: "Passw0rd!" });
    expect(res.status).toBe(201);
    state.customer = { Authorization: `Bearer ${res.body.data.token}` };
  });

  it("browses restaurants and menus", async () => {
    const list = await request(app).get("/api/restaurants");
    expect(list.status).toBe(200);
    const spiceRoute = list.body.data.find((r) => r.name === "Spice Route");
    const dosa = list.body.data.find((r) => r.name === "Dosa Junction");

    const [a, b] = await Promise.all([
      request(app).get(`/api/restaurants/${spiceRoute.id}`),
      request(app).get(`/api/restaurants/${dosa.id}`),
    ]);
    state.ownedFood = a.body.data.menu[0];
    state.otherFood = b.body.data.menu[0];
    expect(state.ownedFood.price).toEqual(expect.any(Number));
  });

  it("filters and searches the menu", async () => {
    const veg = await request(app).get("/api/foods?veg=true&max_price=200&limit=50");
    expect(veg.body.data.length).toBeGreaterThan(0);
    expect(veg.body.data.every((f) => f.is_veg && f.price <= 200)).toBe(true);

    const fuzzy = await request(app).get("/api/foods/search?q=panner");
    expect(fuzzy.body.data.some((f) => f.name.toLowerCase().includes("paneer"))).toBe(true);
  });

  it("builds a cart across two restaurants", async () => {
    await request(app).post("/api/cart/items").set(state.customer).send({ food_id: state.ownedFood.id, quantity: 2 });
    const res = await request(app).post("/api/cart/items").set(state.customer).send({ food_id: state.otherFood.id });
    expect(res.status).toBe(201);
    expect(res.body.data.item_count).toBe(3);
  });

  it("checks out into one order per restaurant and empties the cart", async () => {
    const res = await request(app).post("/api/orders").set(state.customer).send({ delivery_address: "1 Test Street, Bengaluru" });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveLength(2);

    state.order = res.body.data.find((o) => o.restaurant_id === state.ownedFood.restaurant_id);
    expect(state.order.items[0]).toMatchObject({ food_id: state.ownedFood.id, quantity: 2, unit_price: state.ownedFood.price });

    const cart = await request(app).get("/api/cart").set(state.customer);
    expect(cart.body.data.items).toHaveLength(0);
  });

  it("shows the order in the owner's live queue and advances it", async () => {
    const queue = await request(app).get("/api/orders/manage?limit=100").set(state.owner);
    expect(queue.body.data.some((o) => o.id === state.order.id)).toBe(true);

    const res = await request(app).patch(`/api/orders/${state.order.id}/status`).set(state.owner).send({ status: "confirmed" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("confirmed");
  });

  it("stops the customer cancelling a confirmed order", async () => {
    const res = await request(app).patch(`/api/orders/${state.order.id}/cancel`).set(state.customer);
    expect(res.status).toBe(409);
  });

  it("lists the customer's orders", async () => {
    const res = await request(app).get("/api/orders").set(state.customer);
    expect(res.body.meta.total).toBe(2);
  });

  it("serves owner analytics", async () => {
    const [summary, sales, top, hours] = await Promise.all(
      ["summary", "sales?days=7", "top-foods", "peak-hours"].map((path) =>
        request(app).get(`/api/analytics/${path}`).set(state.owner)
      )
    );
    expect(summary.body.data.total_orders).toBeGreaterThan(0);
    expect(sales.body.data).toHaveLength(7);
    expect(top.body.data.length).toBeGreaterThan(0);
    expect(hours.body.data).toHaveLength(24);
  });
});
