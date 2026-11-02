import bcrypt from "bcrypt";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/repositories/userRepository.js", () => ({
  userRepository: { findByEmail: vi.fn(), findById: vi.fn(), create: vi.fn() },
}));

const { default: app } = await import("../../src/app.js");
const { userRepository } = await import("../../src/repositories/userRepository.js");
const { bearer, customer } = await import("../helpers.js");

describe("POST /api/auth/register", () => {
  const body = { name: "Asha Rao", email: "Asha@Example.com", password: "secret123" };

  beforeEach(() => {
    userRepository.findByEmail.mockResolvedValue(null);
    userRepository.create.mockImplementation(async ({ name, email }) => ({ id: 7, name, email, role: "customer" }));
  });

  it("creates a user with a bcrypt hash and returns a token", async () => {
    const res = await request(app).post("/api/auth/register").send(body);

    expect(res.status).toBe(201);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ id: 7, email: "asha@example.com" });
    expect(res.body.data.user).not.toHaveProperty("password_hash");

    const { passwordHash } = userRepository.create.mock.calls[0][0];
    expect(passwordHash).not.toBe(body.password);
    expect(await bcrypt.compare(body.password, passwordHash)).toBe(true);
  });

  it("rejects a duplicate email with 409", async () => {
    userRepository.findByEmail.mockResolvedValue({ id: 1 });
    const res = await request(app).post("/api/auth/register").send(body);
    expect(res.status).toBe(409);
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it("returns field-level validation errors", async () => {
    const res = await request(app).post("/api/auth/register").send({ name: "A", email: "bad", password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.details.map((d) => d.path)).toEqual(expect.arrayContaining(["name", "email", "password"]));
  });
});

describe("POST /api/auth/login", () => {
  it("returns a token for valid credentials", async () => {
    const password_hash = await bcrypt.hash("secret123", 4);
    userRepository.findByEmail.mockResolvedValue({ id: 1, name: "Asha", email: "a@b.com", role: "customer", password_hash });

    const res = await request(app).post("/api/auth/login").send({ email: "a@b.com", password: "secret123" });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).not.toHaveProperty("password_hash");
  });

  it("uses the same 401 for unknown email and wrong password", async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    const unknown = await request(app).post("/api/auth/login").send({ email: "x@y.com", password: "secret123" });

    userRepository.findByEmail.mockResolvedValue({ id: 1, password_hash: await bcrypt.hash("other123", 4) });
    const wrong = await request(app).post("/api/auth/login").send({ email: "x@y.com", password: "secret123" });

    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(unknown.body.error.message).toBe(wrong.body.error.message);
  });
});

describe("GET /api/auth/me", () => {
  it("requires a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects a tampered token", async () => {
    const res = await request(app).get("/api/auth/me").set("Authorization", `${bearer(customer)}x`);
    expect(res.status).toBe(401);
  });

  it("returns the current user", async () => {
    userRepository.findById.mockResolvedValue({ id: 1, name: "Asha", email: "a@b.com", role: "customer" });
    const res = await request(app).get("/api/auth/me").set("Authorization", bearer(customer));
    expect(res.status).toBe(200);
    expect(userRepository.findById).toHaveBeenCalledWith(customer.id);
  });
});
