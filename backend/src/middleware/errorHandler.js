import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";

export function notFound(req, _res, next) {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid request data",
        details: err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, ...(err.details && { details: err.details }) },
    });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: { code: "BAD_REQUEST", message: "Malformed JSON body" } });
  }

  if (err.code === "23505") {
    return res.status(409).json({ error: { code: "CONFLICT", message: "Resource already exists" } });
  }

  if (err.code === "23503") {
    return res.status(409).json({ error: { code: "CONFLICT", message: "Referenced resource is in use or missing" } });
  }

  if (env.NODE_ENV !== "test") console.error(err);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
}
