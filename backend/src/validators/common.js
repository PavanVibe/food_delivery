import { z } from "zod";

export const id = z.coerce.number().int().positive();

export const idParams = z.object({ id });

export const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const ORDER_STATUSES = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];
