import { restaurantRepository } from "../repositories/restaurantRepository.js";
import { foodRepository } from "../repositories/foodRepository.js";
import { AppError } from "../utils/AppError.js";
import { cacheKey, getOrSet } from "../utils/cache.js";

export const restaurantService = {
  list(filters) {
    return getOrSet(cacheKey("restaurants:list", filters), () => restaurantRepository.findAll(filters));
  },

  async getById(id) {
    const restaurant = await getOrSet(`restaurants:item:${id}`, async () => {
      const found = await restaurantRepository.findById(id);
      if (!found) return null;
      const menu = await foodRepository.findMany({ restaurantId: id, sort: "rating", limit: 200, offset: 0 });
      return { ...found, menu: menu.map(({ total_count: _total, ...food }) => food) };
    });
    if (!restaurant || !restaurant.is_active) throw AppError.notFound("Restaurant");
    return restaurant;
  },

  // Restaurants the current user can manage from the dashboard
  mine(user) {
    return user.role === "admin" ? restaurantRepository.findAll() : restaurantRepository.findByOwner(user.id);
  },
};
