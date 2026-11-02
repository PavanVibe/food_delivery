import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/config/db.js", () => ({
  pool: { query: vi.fn() },
  query: vi.fn(),
  withTransaction: vi.fn((fn) => fn({ tx: true })),
}));
vi.mock("../../src/repositories/cartRepository.js", () => ({
  cartRepository: { findByUserForUpdate: vi.fn(), clear: vi.fn() },
}));
vi.mock("../../src/repositories/orderRepository.js", () => ({
  orderRepository: {
    create: vi.fn(),
    addItems: vi.fn(),
    findById: vi.fn(),
    findByUser: vi.fn(),
    findForRestaurants: vi.fn(),
    updateStatus: vi.fn(),
  },
}));
vi.mock("../../src/repositories/restaurantRepository.js", () => ({
  restaurantRepository: { findById: vi.fn(), findIdsByOwner: vi.fn() },
}));

const { default: app } = await import("../../src/app.js");
const { cartRepository } = await import("../../src/repositories/cartRepository.js");
const { orderRepository } = await import("../../src/repositories/orderRepository.js");
const { restaurantRepository } = await import("../../src/repositories/restaurantRepository.js");
const { bearer, customer, owner, admin } = await import("../helpers.js");

const checkout = () =>
  request(app).post("/api/orders").set("Authorization", bearer(customer)).send({ delivery_address: "12 MG Road, Bengaluru" });

describe("POST /api/orders (checkout)", () => {
  beforeEach(() => {
    let nextId = 100;
    orderRepository.create.mockImplementation(async (order) => ({ id: nextId++, ...order }));
    orderRepository.findById.mockImplementation(async (id) => ({ id }));
  });

  it("splits the cart into one order per restaurant with server-side prices", async () => {
    cartRepository.findByUserForUpdate.mockResolvedValue([
      { food_id: 1, restaurant_id: 10, price: 300, quantity: 2, is_available: true, name: "Biryani" },
      { food_id: 2, restaurant_id: 10, price: 99, quantity: 1, is_available: true, name: "Salan" },
      { food_id: 3, restaurant_id: 20, price: 139, quantity: 1, is_available: true, name: "Dosa" },
    ]);

    const res = await checkout();

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveLength(2);
    expect(orderRepository.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ restaurantId: 10, subtotal: 699, deliveryFee: 0, total: 699 }),
      { tx: true }
    );
    expect(orderRepository.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ restaurantId: 20, subtotal: 139, deliveryFee: 49, total: 188 }),
      { tx: true }
    );
    expect(cartRepository.clear).toHaveBeenCalledWith(customer.id, { tx: true });
  });

  it("rejects an empty cart", async () => {
    cartRepository.findByUserForUpdate.mockResolvedValue([]);
    const res = await checkout();
    expect(res.status).toBe(400);
    expect(orderRepository.create).not.toHaveBeenCalled();
  });

  it("rejects the whole checkout if any item became unavailable", async () => {
    cartRepository.findByUserForUpdate.mockResolvedValue([
      { food_id: 1, restaurant_id: 10, price: 300, quantity: 1, is_available: false, name: "Biryani" },
    ]);
    const res = await checkout();
    expect(res.status).toBe(409);
    expect(res.body.error.message).toContain("Biryani");
    expect(cartRepository.clear).not.toHaveBeenCalled();
  });
});

describe("order access and status", () => {
  const order = { id: 5, user_id: customer.id, restaurant_id: 10, status: "pending" };

  beforeEach(() => {
    orderRepository.findById.mockResolvedValue(order);
    restaurantRepository.findById.mockResolvedValue({ id: 10, owner_id: owner.id });
  });

  it("hides other customers' orders", async () => {
    const res = await request(app).get("/api/orders/5").set("Authorization", bearer({ ...customer, id: 99 }));
    expect(res.status).toBe(404);
  });

  it("lets the restaurant owner view the order", async () => {
    const res = await request(app).get("/api/orders/5").set("Authorization", bearer(owner));
    expect(res.status).toBe(200);
  });

  it("lets a customer cancel a pending order", async () => {
    orderRepository.updateStatus.mockResolvedValue({ id: 5, status: "cancelled" });
    const res = await request(app).patch("/api/orders/5/cancel").set("Authorization", bearer(customer));
    expect(res.status).toBe(200);
    expect(orderRepository.updateStatus).toHaveBeenCalledWith(5, "pending", "cancelled");
  });

  it("does not let a customer cancel once the kitchen has started", async () => {
    orderRepository.findById.mockResolvedValue({ ...order, status: "preparing" });
    const res = await request(app).patch("/api/orders/5/cancel").set("Authorization", bearer(customer));
    expect(res.status).toBe(409);
  });

  it("enforces the status state machine", async () => {
    const res = await request(app)
      .patch("/api/orders/5/status")
      .set("Authorization", bearer(owner))
      .send({ status: "delivered" });
    expect(res.status).toBe(409);
  });

  it("allows a valid transition", async () => {
    orderRepository.updateStatus.mockResolvedValue({ id: 5, status: "confirmed" });
    const res = await request(app)
      .patch("/api/orders/5/status")
      .set("Authorization", bearer(owner))
      .send({ status: "confirmed" });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("confirmed");
  });

  it("reports a conflict when the status changed concurrently", async () => {
    orderRepository.updateStatus.mockResolvedValue(null);
    const res = await request(app)
      .patch("/api/orders/5/status")
      .set("Authorization", bearer(admin))
      .send({ status: "confirmed" });
    expect(res.status).toBe(409);
  });

  it("blocks customers from the management queue", async () => {
    const res = await request(app).get("/api/orders/manage").set("Authorization", bearer(customer));
    expect(res.status).toBe(403);
  });

  it("scopes the management queue to the owner's restaurants", async () => {
    restaurantRepository.findIdsByOwner.mockResolvedValue([10, 11]);
    orderRepository.findForRestaurants.mockResolvedValue({ rows: [], total: 0 });

    const res = await request(app).get("/api/orders/manage").set("Authorization", bearer(owner));

    expect(res.status).toBe(200);
    expect(orderRepository.findForRestaurants).toHaveBeenCalledWith([10, 11], expect.objectContaining({ status: "active" }));
  });
});
