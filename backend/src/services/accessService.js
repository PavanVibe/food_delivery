import { restaurantRepository } from "../repositories/restaurantRepository.js";
import { AppError } from "../utils/AppError.js";

export const accessService = {
  async assertCanManageRestaurant(user, restaurantId) {
    const restaurant = await restaurantRepository.findById(restaurantId);
    if (!restaurant) throw AppError.notFound("Restaurant");
    if (user.role === "admin") return restaurant;
    if (user.role === "restaurant_owner" && restaurant.owner_id === user.id) return restaurant;
    throw AppError.forbidden("You can only manage your own restaurants");
  },

  // Returns null for platform-wide access, otherwise the restaurant ids the user may see
  async resolveRestaurantScope(user, restaurantId) {
    if (user.role === "admin") return restaurantId ? [restaurantId] : null;

    const owned = await restaurantRepository.findIdsByOwner(user.id);
    if (!restaurantId) return owned;
    if (!owned.includes(restaurantId)) throw AppError.forbidden("You can only view your own restaurants");
    return [restaurantId];
  },
};
