import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/repositories/analyticsRepository.js", () => ({
  analyticsRepository: {
    summary: vi.fn(),
    statusBreakdown: vi.fn(),
    dailySales: vi.fn(),
    topFoods: vi.fn(),
    peakHours: vi.fn(),
  },
}));
vi.mock("../../src/repositories/restaurantRepository.js", () => ({
  restaurantRepository: { findIdsByOwner: vi.fn(), findById: vi.fn() },
}));

const { default: app } = await import("../../src/app.js");
const { analyticsRepository } = await import("../../src/repositories/analyticsRepository.js");
const { restaurantRepository } = await import("../../src/repositories/restaurantRepository.js");
const { bearer, customer, owner, admin } = await import("../helpers.js");

describe("analytics", () => {
  beforeEach(() => {
    restaurantRepository.findIdsByOwner.mockResolvedValue([1, 2]);
    analyticsRepository.summary.mockResolvedValue({
      total_orders: 120,
      revenue: 60000,
      prev_total_orders: 100,
      prev_revenue: 50000,
    });
    analyticsRepository.statusBreakdown.mockResolvedValue([{ status: "delivered", count: 110 }]);
  });

  it("is closed to customers", async () => {
    const res = await request(app).get("/api/analytics/summary").set("Authorization", bearer(customer));
    expect(res.status).toBe(403);
  });

  it("scopes owners to their own restaurants and computes growth", async () => {
    const res = await request(app).get("/api/analytics/summary?days=7").set("Authorization", bearer(owner));

    expect(res.status).toBe(200);
    expect(analyticsRepository.summary).toHaveBeenCalledWith(expect.objectContaining({ days: 7, restaurantIds: [1, 2] }));
    expect(res.body.data.growth).toEqual({ orders_pct: 20, revenue_pct: 20 });
    expect(res.body.data).not.toHaveProperty("prev_revenue");
  });

  it("rejects an owner asking for another restaurant", async () => {
    const res = await request(app).get("/api/analytics/summary?restaurant_id=9").set("Authorization", bearer(owner));
    expect(res.status).toBe(403);
  });

  it("gives admins a platform-wide view", async () => {
    await request(app).get("/api/analytics/summary").set("Authorization", bearer(admin));
    expect(analyticsRepository.summary).toHaveBeenCalledWith(expect.objectContaining({ restaurantIds: null }));
  });

  it("fills missing hours with zero", async () => {
    analyticsRepository.peakHours.mockResolvedValue([{ hour: 13, orders: 40 }]);
    const res = await request(app).get("/api/analytics/peak-hours").set("Authorization", bearer(admin));
    expect(res.body.data).toHaveLength(24);
    expect(res.body.data[13]).toEqual({ hour: 13, orders: 40 });
    expect(res.body.data[0]).toEqual({ hour: 0, orders: 0 });
  });

  it("bounds the date window", async () => {
    const res = await request(app).get("/api/analytics/sales?days=1000").set("Authorization", bearer(admin));
    expect(res.status).toBe(400);
  });
});
