import { z } from "zod";
import { id, pagination } from "./common.js";

export const FOOD_SORTS = ["rating", "price_asc", "price_desc", "newest", "name"];

export const listFoodsQuery = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  restaurant_id: id.optional(),
  category_id: id.optional(),
  veg: z.stringbool().optional(),
  max_price: z.coerce.number().positive().optional(),
  min_rating: z.coerce.number().min(0).max(5).optional(),
  include_unavailable: z.stringbool().default(false),
  sort: z.enum(FOOD_SORTS).default("rating"),
  ...pagination,
  limit: pagination.limit.default(24),
});

export const searchFoodsQuery = z.object({
  q: z.string().trim().min(1, "Search term is required").max(100),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const foodFields = {
  category_id: id.nullable(),
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(1000),
  price: z.coerce.number().positive().max(100000),
  is_veg: z.boolean(),
  spice_level: z.number().int().min(0).max(3),
  calories: z.number().int().min(0).max(5000),
  protein_g: z.number().int().min(0).max(500),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(10),
  image_url: z.url(),
  is_available: z.boolean(),
};

export const createFoodBody = z.object({
  ...foodFields,
  restaurant_id: id,
  category_id: foodFields.category_id.optional(),
  description: foodFields.description.optional(),
  is_veg: foodFields.is_veg.default(true),
  spice_level: foodFields.spice_level.default(0),
  calories: foodFields.calories.optional(),
  protein_g: foodFields.protein_g.optional(),
  tags: foodFields.tags.default([]),
  image_url: foodFields.image_url.optional(),
  is_available: foodFields.is_available.default(true),
});

export const updateFoodBody = z
  .object(foodFields)
  .partial()
  .refine((body) => Object.keys(body).length > 0, "Provide at least one field to update");
