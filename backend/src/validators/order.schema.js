import { z } from "zod";
import { id, pagination, ORDER_STATUSES } from "./common.js";

export const checkoutBody = z.object({
  delivery_address: z.string().trim().min(5, "Delivery address is too short").max(300),
});

export const listOrdersQuery = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  ...pagination,
});

export const manageOrdersQuery = z.object({
  status: z.enum([...ORDER_STATUSES, "active"]).default("active"),
  restaurant_id: id.optional(),
  ...pagination,
});

export const updateStatusBody = z.object({
  status: z.enum(ORDER_STATUSES),
});
