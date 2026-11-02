import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/repositories/foodRepository.js", () => ({
  foodRepository: {
    findMany: vi.fn(),
    search: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    findCategories: vi.fn(),
  },
}));
vi.mock("../../src/repositories/restaurantRepository.js", () => ({
  restaurantRepository: { findById: vi.fn(), findIdsByOwner: vi.fn() },
}));
vi.mock("../../src/services/aiService.js", () => ({ aiService: { requestReindex: vi.fn() } }));

const { default: app } = await import("../../src/app.js");
const { foodRepository } = await import("../../src/repositories/foodRepository.js");
const { restaurantRepository } = await import("../../src/repositories/restaurantRepository.js");
const { aiService } = await import("../../src/services/aiService.js");
const { bearer, customer, owner, admin } = await import("../helpers.js");

const food = { id: 5, restaurant_id: 1, owner_id: owner.id, name: "Masala Dosa", price: 139, is_available: true };

describe("GET /api/foods", () => {
  it("passes parsed filters to the repository and paginates", async () => {
    foodRepository.findMany.mockResolvedValue([{ ...food, total_count: 30 }]);

    const res = await request(app).get("/api/foods?veg=true&max_price=200&page=2&limit=10&sort=price_asc");

    expect(res.status).toBe(200);
    expect(foodRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ veg: true, maxPrice: 200, sort: "price_asc", limit: 10, offset: 10 })
    );
    expect(res.body.meta).toEqual({ page: 2, limit: 10, total: 30, total_pages: 3 });
    expect(res.body.data[0]).not.toHaveProperty("total_count");
  });

  it("rejects an unknown sort option", async () => {
    const res = await request(app).get("/api/foods?sort=random");
    expect(res.status).toBe(400);
  });
});

describe("GET /api/foods/:id", () => {
  it("returns 404 for a missing food", async () => {
    foodRepository.findById.mockResolvedValue(null);
    const res = await request(app).get("/api/foods/999");
    expect(res.status).toBe(404);
  });

  it("validates the id parameter", async () => {
    const res = await request(app).get("/api/foods/abc");
    expect(res.status).toBe(400);
  });

  it("does not leak the restaurant owner id", async () => {
    foodRepository.findById.mockResolvedValue(food);
    const res = await request(app).get("/api/foods/5");
    expect(res.body.data).not.toHaveProperty("owner_id");
  });
});

describe("POST /api/foods", () => {
  const body = { restaurant_id: 1, name: "Filter Coffee", price: 59 };

  beforeEach(() => {
    restaurantRepository.findById.mockResolvedValue({ id: 1, owner_id: owner.id });
    foodRepository.create.mockResolvedValue({ ...food, ...body, id: 9 });
  });

  it("forbids customers", async () => {
    const res = await request(app).post("/api/foods").set("Authorization", bearer(customer)).send(body);
    expect(res.status).toBe(403);
  });

  it("forbids owners from editing someone else's restaurant", async () => {
    restaurantRepository.findById.mockResolvedValue({ id: 1, owner_id: 999 });
    const res = await request(app).post("/api/foods").set("Authorization", bearer(owner)).send(body);
    expect(res.status).toBe(403);
    expect(foodRepository.create).not.toHaveBeenCalled();
  });

  it("lets the owner add an item and triggers an AI reindex", async () => {
    const res = await request(app).post("/api/foods").set("Authorization", bearer(owner)).send(body);
    expect(res.status).toBe(201);
    expect(foodRepository.create).toHaveBeenCalledWith(expect.objectContaining({ is_veg: true, tags: [] }));
    expect(aiService.requestReindex).toHaveBeenCalledOnce();
  });

  it("lets admins manage any restaurant", async () => {
    restaurantRepository.findById.mockResolvedValue({ id: 1, owner_id: 999 });
    const res = await request(app).post("/api/foods").set("Authorization", bearer(admin)).send(body);
    expect(res.status).toBe(201);
  });
});

describe("DELETE /api/foods/:id", () => {
  it("returns 409 when the food has order history", async () => {
    foodRepository.findById.mockResolvedValue(food);
    restaurantRepository.findById.mockResolvedValue({ id: 1, owner_id: owner.id });
    foodRepository.remove.mockRejectedValue(Object.assign(new Error("fk"), { code: "23503" }));

    const res = await request(app).delete("/api/foods/5").set("Authorization", bearer(owner));
    expect(res.status).toBe(409);
  });
});
