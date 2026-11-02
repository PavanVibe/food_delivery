import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

const limiter = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skip: () => env.NODE_ENV === "test",
    message: { error: { code: "RATE_LIMITED", message } },
  });

export const authLimiter = limiter(15 * 60 * 1000, 20, "Too many login attempts, try again later");
export const aiLimiter = limiter(60 * 1000, 30, "Too many AI requests, slow down");
