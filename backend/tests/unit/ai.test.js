import request from "supertest";
import { describe, expect, it, vi } from "vitest";

const http = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }));
vi.mock("axios", () => ({ default: { create: () => http } }));

const { default: app } = await import("../../src/app.js");
const { bearer, customer } = await import("../helpers.js");

describe("POST /api/ai/recommend", () => {
  it("forwards the query and the logged-in user for personalisation", async () => {
    http.post.mockResolvedValue({ data: { recommendation: "Try the biryani", matched_foods: [] } });

    const res = await request(app)
      .post("/api/ai/recommend")
      .set("Authorization", bearer(customer))
      .send({ query: "something spicy", veg_only: true });

    expect(res.status).toBe(200);
    expect(res.body.data.recommendation).toBe("Try the biryani");
    expect(http.post).toHaveBeenCalledWith(
      "/recommend",
      expect.objectContaining({ query: "something spicy", veg_only: true, user_id: customer.id })
    );
  });

  it("works anonymously", async () => {
    http.post.mockResolvedValue({ data: { recommendation: "ok", matched_foods: [] } });
    await request(app).post("/api/ai/recommend").send({ query: "light dinner" });
    expect(http.post).toHaveBeenCalledWith("/recommend", expect.objectContaining({ user_id: null }));
  });

  it("maps an unreachable AI service to 503", async () => {
    http.post.mockRejectedValue(Object.assign(new Error("connect ECONNREFUSED"), { code: "ECONNREFUSED" }));
    const res = await request(app).post("/api/ai/recommend").send({ query: "pizza" });
    expect(res.status).toBe(503);
  });

  it("validates the query", async () => {
    const res = await request(app).post("/api/ai/recommend").send({ query: "" });
    expect(res.status).toBe(400);
    expect(http.post).not.toHaveBeenCalled();
  });
});
