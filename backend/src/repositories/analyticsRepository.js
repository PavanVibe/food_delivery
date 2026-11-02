import { query } from "../config/db.js";

const TZ = "Asia/Kolkata";

// restaurantIds = null means platform-wide (admin)
const scope = (restaurantIds, params, column = "restaurant_id") => {
  if (!restaurantIds) return "";
  params.push(restaurantIds);
  return ` AND ${column} = ANY($${params.length}::int[])`;
};

export const analyticsRepository = {
  async summary({ days, restaurantIds }) {
    const params = [days];
    const { rows } = await query(
      `WITH o AS (
         SELECT user_id, status, total, created_at >= now() - make_interval(days => $1) AS in_window
         FROM orders
         WHERE created_at >= now() - make_interval(days => $1 * 2)${scope(restaurantIds, params)}
       )
       SELECT
         COUNT(*) FILTER (WHERE in_window)::int                                          AS total_orders,
         COUNT(*) FILTER (WHERE in_window AND status = 'cancelled')::int                 AS cancelled_orders,
         COUNT(*) FILTER (WHERE in_window AND status NOT IN ('delivered','cancelled'))::int AS active_orders,
         COALESCE(SUM(total) FILTER (WHERE in_window AND status <> 'cancelled'), 0)::numeric(14,2) AS revenue,
         COALESCE(AVG(total) FILTER (WHERE in_window AND status <> 'cancelled'), 0)::numeric(10,2) AS avg_order_value,
         (SELECT COUNT(*) FROM (SELECT DISTINCT user_id FROM o WHERE in_window) d)::int  AS unique_customers,
         COUNT(*) FILTER (WHERE NOT in_window)::int                                      AS prev_total_orders,
         COALESCE(SUM(total) FILTER (WHERE NOT in_window AND status <> 'cancelled'), 0)::numeric(14,2) AS prev_revenue
       FROM o`,
      params
    );
    return rows[0];
  },

  async statusBreakdown({ days, restaurantIds }) {
    const params = [days];
    const { rows } = await query(
      `SELECT status, COUNT(*)::int AS count
       FROM orders
       WHERE created_at >= now() - make_interval(days => $1)${scope(restaurantIds, params)}
       GROUP BY status
       ORDER BY count DESC`,
      params
    );
    return rows;
  },

  async dailySales({ days, restaurantIds }) {
    const params = [days];
    const { rows } = await query(
      `SELECT to_char(d, 'YYYY-MM-DD') AS day,
              COALESCE(s.orders, 0)::int AS orders,
              COALESCE(s.revenue, 0)::numeric(14,2) AS revenue
       FROM generate_series(
              (now() AT TIME ZONE '${TZ}')::date - ($1 - 1),
              (now() AT TIME ZONE '${TZ}')::date,
              interval '1 day') AS d
       LEFT JOIN (
         SELECT (created_at AT TIME ZONE '${TZ}')::date AS day, COUNT(*) AS orders, SUM(total) AS revenue
         FROM orders
         WHERE created_at >= now() - make_interval(days => $1)
           AND status <> 'cancelled'${scope(restaurantIds, params)}
         GROUP BY 1
       ) s ON s.day = d::date
       ORDER BY d`,
      params
    );
    return rows;
  },

  async topFoods({ days, restaurantIds, limit }) {
    const params = [days, limit];
    const { rows } = await query(
      `SELECT f.id, f.name, r.name AS restaurant_name, f.image_url,
              SUM(oi.quantity)::int AS quantity,
              SUM(oi.quantity * oi.unit_price)::numeric(14,2) AS revenue
       FROM orders o
       JOIN order_items oi ON oi.order_id = o.id
       JOIN foods f ON f.id = oi.food_id
       JOIN restaurants r ON r.id = f.restaurant_id
       WHERE o.created_at >= now() - make_interval(days => $1)
         AND o.status <> 'cancelled'${scope(restaurantIds, params, "o.restaurant_id")}
       GROUP BY f.id, r.name
       ORDER BY quantity DESC, revenue DESC
       LIMIT $2`,
      params
    );
    return rows;
  },

  async peakHours({ days, restaurantIds }) {
    const params = [days];
    const { rows } = await query(
      `SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE '${TZ}')::int AS hour, COUNT(*)::int AS orders
       FROM orders
       WHERE created_at >= now() - make_interval(days => $1)${scope(restaurantIds, params)}
       GROUP BY 1
       ORDER BY 1`,
      params
    );
    return rows;
  },
};
