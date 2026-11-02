import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ quiet: true });

const DEV_JWT_SECRET = "dev-only-insecure-jwt-secret-change-me";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),

  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().default("foodhub"),
  DB_USER: z.string().default("postgres"),
  DB_PASSWORD: z.string().default("postgres"),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),

  REDIS_URL: z.string().optional(),
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(300),

  JWT_SECRET: z.string().min(16).default(DEV_JWT_SECRET),
  JWT_EXPIRES_IN: z.string().default("7d"),

  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  AI_SERVICE_URL: z.url().default("http://localhost:8000"),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(45000),
  INTERNAL_API_KEY: z.string().default("dev-internal-key"),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", z.treeifyError(parsed.error));
  process.exit(1);
}

if (parsed.data.NODE_ENV === "production" && parsed.data.JWT_SECRET === DEV_JWT_SECRET) {
  console.error("JWT_SECRET must be set in production");
  process.exit(1);
}

export const env = parsed.data;
