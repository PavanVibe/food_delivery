import { z } from "zod";

const email = z.string().trim().toLowerCase().pipe(z.email("Invalid email address"));

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be at most 72 characters")
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/\d/, "Password must contain a number"),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});
