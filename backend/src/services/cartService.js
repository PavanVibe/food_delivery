import { cartRepository } from "../repositories/cartRepository.js";
import { foodRepository } from "../repositories/foodRepository.js";
import { AppError } from "../utils/AppError.js";
import { computeTotals } from "../utils/pricing.js";

const summarize = (items) => ({
  items,
  item_count: items.reduce((count, item) => count + item.quantity, 0),
  ...computeTotals(items.filter((item) => item.is_available)),
});

export const cartService = {
  async get(userId) {
    return summarize(await cartRepository.findByUser(userId));
  },

  async addItem(userId, { food_id, quantity }) {
    const food = await foodRepository.findById(food_id);
    if (!food) throw AppError.notFound("Food");
    if (!food.is_available) throw AppError.conflict(`${food.name} is currently unavailable`);

    await cartRepository.upsertItem(userId, food_id, quantity);
    return this.get(userId);
  },

  async updateItem(userId, foodId, quantity) {
    const updated = await cartRepository.updateQuantity(userId, foodId, quantity);
    if (!updated) throw AppError.notFound("Cart item");
    return this.get(userId);
  },

  async removeItem(userId, foodId) {
    const removed = await cartRepository.removeItem(userId, foodId);
    if (!removed) throw AppError.notFound("Cart item");
    return this.get(userId);
  },

  async clear(userId) {
    await cartRepository.clear(userId);
    return summarize([]);
  },
};
