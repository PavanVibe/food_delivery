import { z } from "zod";
import { id } from "./common.js";

export const analyticsQuery = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
  restaurant_id: id.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
