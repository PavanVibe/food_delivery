import { foodRepository } from "../repositories/foodRepository.js";
import { AppError } from "../utils/AppError.js";
import { cacheKey, getOrSet, invalidate } from "../utils/cache.js";
import { paginated, toOffset } from "../utils/pagination.js";
import { accessService } from "./accessService.js";
import { aiService } from "./aiService.js";

const stripOwner = ({ owner_id: _owner, ...food }) => food;

async function afterMenuChange() {
  await invalidate("menu:", "restaurants:", "ai:");
  aiService.requestReindex();
}

export const foodService = {
  list(filters) {
    return getOrSet(cacheKey("menu:foods", filters), async () => {
      const rows = await foodRepository.findMany({
        q: filters.q,
        restaurantId: filters.restaurant_id,
        categoryId: filters.category_id,
        veg: filters.veg,
        maxPrice: filters.max_price,
        minRating: filters.min_rating,
        includeUnavailable: filters.include_unavailable,
        sort: filters.sort,
        limit: filters.limit,
        offset: toOffset(filters),
      });
      return paginated(rows, filters);
    });
  },

  search({ q, limit }) {
    return getOrSet(cacheKey("menu:search", { q: q.toLowerCase(), limit }), () => foodRepository.search(q, limit));
  },

  async getById(id) {
    const food = await getOrSet(`menu:food:${id}`, () => foodRepository.findById(id));
    if (!food) throw AppError.notFound("Food");
    return stripOwner(food);
  },

  categories() {
    return getOrSet("menu:categories", () => foodRepository.findCategories());
  },

  async create(user, body) {
    await accessService.assertCanManageRestaurant(user, body.restaurant_id);
    const food = await foodRepository.create(body);
    await afterMenuChange();
    return stripOwner(food);
  },

  async update(user, id, changes) {
    const existing = await foodRepository.findById(id);
    if (!existing) throw AppError.notFound("Food");
    await accessService.assertCanManageRestaurant(user, existing.restaurant_id);

    const food = await foodRepository.update(id, changes);
    await afterMenuChange();
    return stripOwner(food);
  },

  async remove(user, id) {
    const existing = await foodRepository.findById(id);
    if (!existing) throw AppError.notFound("Food");
    await accessService.assertCanManageRestaurant(user, existing.restaurant_id);

    try {
      await foodRepository.remove(id);
    } catch (error) {
      if (error.code === "23503") {
        throw AppError.conflict("This item has order history; mark it unavailable instead of deleting it");
      }
      throw error;
    }
    await afterMenuChange();
  },
};
