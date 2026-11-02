import { query } from "../config/db.js";

const SELECT_ITEMS = `
  SELECT c.id, c.food_id, c.quantity, f.name, f.price, f.image_url, f.is_veg, f.is_available,
         f.restaurant_id, r.name AS restaurant_name
  FROM cart_items c
  JOIN foods f ON f.id = c.food_id
  JOIN restaurants r ON r.id = f.restaurant_id
  WHERE c.user_id = $1`;

export const cartRepository = {
  async findByUser(userId, client) {
    const { rows } = await query(`${SELECT_ITEMS} ORDER BY c.created_at, c.id`, [userId], client);
    return rows;
  },

  // Locks the user's cart rows so concurrent checkouts can't double-order
  async findByUserForUpdate(userId, client) {
    const { rows } = await query(`${SELECT_ITEMS} ORDER BY c.id FOR UPDATE OF c`, [userId], client);
    return rows;
  },

  async upsertItem(userId, foodId, quantity) {
    const { rows } = await query(
      `INSERT INTO cart_items (user_id, food_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, food_id)
       DO UPDATE SET quantity = LEAST(cart_items.quantity + EXCLUDED.quantity, 20)
       RETURNING id, food_id, quantity`,
      [userId, foodId, quantity]
    );
    return rows[0];
  },

  async updateQuantity(userId, foodId, quantity) {
    const { rows } = await query(
      `UPDATE cart_items SET quantity = $3
       WHERE user_id = $1 AND food_id = $2
       RETURNING id, food_id, quantity`,
      [userId, foodId, quantity]
    );
    return rows[0] ?? null;
  },

  async removeItem(userId, foodId) {
    const { rowCount } = await query("DELETE FROM cart_items WHERE user_id = $1 AND food_id = $2", [userId, foodId]);
    return rowCount > 0;
  },

  async clear(userId, client) {
    await query("DELETE FROM cart_items WHERE user_id = $1", [userId], client);
  },
};
