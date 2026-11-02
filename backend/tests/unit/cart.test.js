import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../src/repositories/cartRepository.js", () => ({
  cartRepository: { findByUser: vi.fn(), upsertItem: vi.fn(), updateQuantity: vi.fn(), removeItem: vi.fn(), clear: vi.fn() },
}));
vi.mock("../../src/repositories/foodRepository.js", () => ({ foodRepository: { findById: vi.fn() } }));

const { default: app } = await import("../../src/app.js");
const { cartRepository } = await import("../../src/repositories/cartRepository.js");
const { foodRepository } = await import("../../src/repositories/foodRepository.js");
const { bearer, customer } = await import("../helpers.js");

const auth = { Authorization: bearer(customer) };

describe("cart", () => {
  it("requires authentication", async () => {
    const res = await request(app).get("/api/cart");
    expect(res.status).toBe(401);
  });

  it("computes totals with delivery fee and skips unavailable items", async () => {
    cartRepository.findByUser.mockResolvedValue([
      { food_id: 1, name: "Dosa", price: 139, quantity: 2, is_available: true },
      { food_id: 2, name: "Coffee", price: 59, quantity: 1, is_available: false },
    ]);

    const res = await request(app).get("/api/cart").set(auth);

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ item_count: 3, subtotal: 278, delivery_fee: 49, total: 327 });
  });

  it("gives free delivery above the threshold", async () => {
    cartRepository.findByUser.mockResolvedValue([{ food_id: 1, price: 250, quantity: 2, is_available: true }]);
    const res = await request(app).get("/api/cart").set(auth);
    expect(res.body.data).toMatchObject({ subtotal: 500, delivery_fee: 0, total: 500 });
  });

  it("uses the user from the token, not the request body", async () => {
    foodRepository.findById.mockResolvedValue({ id: 4, name: "Idli", is_available: true });
    cartRepository.findByUser.mockResolvedValue([]);

    await request(app).post("/api/cart/items").set(auth).send({ food_id: 4, quantity: 2, user_id: 999 });

    expect(cartRepository.upsertItem).toHaveBeenCalledWith(customer.id, 4, 2);
  });

  it("refuses unavailable food", async () => {
    foodRepository.findById.mockResolvedValue({ id: 4, name: "Idli", is_available: false });
    const res = await request(app).post("/api/cart/items").set(auth).send({ food_id: 4 });
    expect(res.status).toBe(409);
  });

  it("validates quantity bounds", async () => {
    const res = await request(app).patch("/api/cart/items/4").set(auth).send({ quantity: 50 });
    expect(res.status).toBe(400);
  });

  it("returns 404 when removing an item that is not in the cart", async () => {
    cartRepository.removeItem.mockResolvedValue(false);
    const res = await request(app).delete("/api/cart/items/4").set(auth);
    expect(res.status).toBe(404);
  });
});
