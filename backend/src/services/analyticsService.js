import { analyticsRepository } from "../repositories/analyticsRepository.js";
import { cacheKey, getOrSet } from "../utils/cache.js";
import { accessService } from "./accessService.js";

const ANALYTICS_TTL = 60;

const growth = (current, previous) => (previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : null);

async function scoped(user, name, params, loader) {
  const restaurantIds = await accessService.resolveRestaurantScope(user, params.restaurant_id);
  const key = cacheKey(`analytics:${name}`, { restaurantIds, days: params.days, limit: params.limit });
  return getOrSet(key, () => loader({ ...params, restaurantIds }), ANALYTICS_TTL);
}

export const analyticsService = {
  summary(user, params) {
    return scoped(user, "summary", params, async (args) => {
      const [summary, statuses] = await Promise.all([
        analyticsRepository.summary(args),
        analyticsRepository.statusBreakdown(args),
      ]);
      const { prev_total_orders, prev_revenue, ...current } = summary;
      return {
        days: args.days,
        ...current,
        growth: {
          orders_pct: growth(current.total_orders, prev_total_orders),
          revenue_pct: growth(current.revenue, prev_revenue),
        },
        status_breakdown: statuses,
      };
    });
  },

  sales(user, params) {
    return scoped(user, "sales", params, (args) => analyticsRepository.dailySales(args));
  },

  topFoods(user, params) {
    return scoped(user, "top-foods", params, (args) => analyticsRepository.topFoods(args));
  },

  peakHours(user, params) {
    return scoped(user, "peak-hours", params, async (args) => {
      const rows = await analyticsRepository.peakHours(args);
      const byHour = new Map(rows.map((row) => [row.hour, row.orders]));
      return Array.from({ length: 24 }, (_, hour) => ({ hour, orders: byHour.get(hour) ?? 0 }));
    });
  },
};
