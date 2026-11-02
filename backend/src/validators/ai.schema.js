import { z } from "zod";

export const recommendBody = z.object({
  query: z.string().trim().min(2, "Describe what you feel like eating").max(300),
  veg_only: z.boolean().default(false),
  max_price: z.number().positive().max(100000).optional(),
  limit: z.number().int().min(1).max(6).default(3),
});
