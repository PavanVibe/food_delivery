import { z } from "zod";
import { id } from "./common.js";

const quantity = z.coerce.number().int().min(1, "Quantity must be at least 1").max(20, "Quantity cannot exceed 20");

export const addCartItemBody = z.object({ food_id: id, quantity: quantity.default(1) });

export const updateCartItemBody = z.object({ quantity });

export const cartItemParams = z.object({ foodId: id });
