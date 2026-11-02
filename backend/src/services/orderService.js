import { withTransaction } from "../config/db.js";
import { cartRepository } from "../repositories/cartRepository.js";
import { orderRepository } from "../repositories/orderRepository.js";
import { restaurantRepository } from "../repositories/restaurantRepository.js";
import { AppError } from "../utils/AppError.js";
import { pageMeta, toOffset } from "../utils/pagination.js";
import { computeTotals } from "../utils/pricing.js";
import { accessService } from "./accessService.js";

export const STATUS_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["out_for_delivery"],
  out_for_delivery: ["delivered"],
  delivered: [],
  cancelled: [],
};

const groupByRestaurant = (items) => {
  const groups = new Map();
  for (const item of items) {
    if (!groups.has(item.restaurant_id)) groups.set(item.restaurant_id, []);
    groups.get(item.restaurant_id).push(item);
  }
  return groups;
};

export const orderService = {
  // Converts the cart into one order per restaurant using current DB prices
  async checkout(userId, { delivery_address }) {
    const orderIds = await withTransaction(async (client) => {
      const items = await cartRepository.findByUserForUpdate(userId, client);
      if (items.length === 0) throw AppError.badRequest("Your cart is empty");

      const unavailable = items.filter((item) => !item.is_available);
      if (unavailable.length) {
        throw AppError.conflict(`Currently unavailable: ${unavailable.map((item) => item.name).join(", ")}`);
      }

      const ids = [];
      for (const [restaurantId, group] of groupByRestaurant(items)) {
        const totals = computeTotals(group);
        const order = await orderRepository.create(
          {
            userId,
            restaurantId,
            subtotal: totals.subtotal,
            deliveryFee: totals.delivery_fee,
            total: totals.total,
            deliveryAddress: delivery_address,
          },
          client
        );
        await orderRepository.addItems(order.id, group, client);
        ids.push(order.id);
      }

      await cartRepository.clear(userId, client);
      return ids;
    });

    return Promise.all(orderIds.map((id) => orderRepository.findById(id)));
  },

  async listMine(userId, filters) {
    const { rows, total } = await orderRepository.findByUser(userId, {
      status: filters.status,
      limit: filters.limit,
      offset: toOffset(filters),
    });
    return { data: rows, meta: pageMeta(total, filters) };
  },

  async getById(user, id) {
    const order = await orderRepository.findById(id);
    if (!order) throw AppError.notFound("Order");
    if (user.role === "admin" || order.user_id === user.id) return order;

    if (user.role === "restaurant_owner") {
      const restaurant = await restaurantRepository.findById(order.restaurant_id);
      if (restaurant?.owner_id === user.id) return order;
    }
    throw AppError.notFound("Order");
  },

  async cancel(user, id) {
    const order = await orderRepository.findById(id);
    if (!order || order.user_id !== user.id) throw AppError.notFound("Order");
    if (order.status !== "pending") throw AppError.conflict("Only pending orders can be cancelled");

    const updated = await orderRepository.updateStatus(id, "pending", "cancelled");
    if (!updated) throw AppError.conflict("Order status changed, please refresh");
    return { ...order, ...updated };
  },

  async listForManagement(user, filters) {
    const restaurantIds = await accessService.resolveRestaurantScope(user, filters.restaurant_id);
    const { rows, total } = await orderRepository.findForRestaurants(restaurantIds, {
      status: filters.status,
      limit: filters.limit,
      offset: toOffset(filters),
    });
    return { data: rows, meta: pageMeta(total, filters) };
  },

  async updateStatus(user, id, status) {
    const order = await orderRepository.findById(id);
    if (!order) throw AppError.notFound("Order");
    await accessService.assertCanManageRestaurant(user, order.restaurant_id);

    if (!STATUS_TRANSITIONS[order.status].includes(status)) {
      throw AppError.conflict(`Cannot move an order from ${order.status} to ${status}`);
    }

    const updated = await orderRepository.updateStatus(id, order.status, status);
    if (!updated) throw AppError.conflict("Order status changed, please refresh");
    return { ...order, ...updated };
  },
};
