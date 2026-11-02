import { query } from "../config/db.js";

const ITEMS_LATERAL = `
  CROSS JOIN LATERAL (
    SELECT COALESCE(json_agg(json_build_object(
             'food_id', oi.food_id, 'name', f.name, 'quantity', oi.quantity,
             'unit_price', oi.unit_price, 'image_url', f.image_url) ORDER BY oi.id), '[]') AS items
    FROM order_items oi
    JOIN foods f ON f.id = oi.food_id
    WHERE oi.order_id = p.id
  ) i`;

const PAGE_COLUMNS = `p.id, p.user_id, u.name AS customer_name, p.restaurant_id, r.name AS restaurant_name,
                      p.status, p.subtotal, p.delivery_fee, p.total, p.delivery_address,
                      p.created_at, p.updated_at, i.items`;

// Paginates orders first, then hydrates only that page with restaurant, customer and items
async function findPage(whereSql, params, { limit, offset }) {
  const pageParams = [...params, limit, offset];
  const [page, count] = await Promise.all([
    query(
      `WITH p AS (
         SELECT o.*
         FROM orders o
         WHERE ${whereSql}
         ORDER BY o.created_at DESC, o.id DESC
         LIMIT $${pageParams.length - 1} OFFSET $${pageParams.length}
       )
       SELECT ${PAGE_COLUMNS}
       FROM p
       JOIN restaurants r ON r.id = p.restaurant_id
       JOIN users u ON u.id = p.user_id
       ${ITEMS_LATERAL}
       ORDER BY p.created_at DESC, p.id DESC`,
      pageParams
    ),
    query(`SELECT COUNT(*)::int AS total FROM orders o WHERE ${whereSql}`, params),
  ]);
  return { rows: page.rows, total: count.rows[0].total };
}

export const orderRepository = {
  async create({ userId, restaurantId, subtotal, deliveryFee, total, deliveryAddress }, client) {
    const { rows } = await query(
      `INSERT INTO orders (user_id, restaurant_id, subtotal, delivery_fee, total, delivery_address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, restaurantId, subtotal, deliveryFee, total, deliveryAddress],
      client
    );
    return rows[0];
  },

  async addItems(orderId, items, client) {
    await query(
      `INSERT INTO order_items (order_id, food_id, quantity, unit_price)
       SELECT $1, * FROM unnest($2::int[], $3::int[], $4::numeric[])`,
      [orderId, items.map((i) => i.food_id), items.map((i) => i.quantity), items.map((i) => i.price)],
      client
    );
  },

  findByUser(userId, { status, limit, offset }) {
    const params = [userId];
    let where = "o.user_id = $1";
    if (status) {
      params.push(status);
      where += ` AND o.status = $${params.length}`;
    }
    return findPage(where, params, { limit, offset });
  },

  // restaurantIds = null means every restaurant (admin)
  findForRestaurants(restaurantIds, { status, limit, offset }) {
    const params = [];
    const where = [];
    if (restaurantIds) {
      params.push(restaurantIds);
      where.push(`o.restaurant_id = ANY($${params.length}::int[])`);
    }
    if (status === "active") {
      where.push("o.status NOT IN ('delivered', 'cancelled')");
    } else if (status) {
      params.push(status);
      where.push(`o.status = $${params.length}`);
    }
    return findPage(where.join(" AND ") || "TRUE", params, { limit, offset });
  },

  async findById(id) {
    const { rows } = await findPage("o.id = $1", [id], { limit: 1, offset: 0 });
    return rows[0] ?? null;
  },

  // Compare-and-set so two concurrent updates can't both win
  async updateStatus(id, fromStatus, toStatus) {
    const { rows } = await query(
      "UPDATE orders SET status = $3 WHERE id = $1 AND status = $2 RETURNING id, status, updated_at",
      [id, fromStatus, toStatus]
    );
    return rows[0] ?? null;
  },
};
