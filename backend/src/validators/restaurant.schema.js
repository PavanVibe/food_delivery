import { z } from "zod";

export const listRestaurantsQuery = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  cuisine: z.string().trim().min(1).max(80).optional(),
});
