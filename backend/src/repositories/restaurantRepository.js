import { query } from "../config/db.js";

const COLUMNS = `r.id, r.owner_id, r.name, r.description, r.cuisine, r.address, r.image_url,
                 r.rating, r.delivery_time_min, r.is_active`;

export const restaurantRepository = {
  async findAll({ q, cuisine } = {}) {
    const params = [];
    const where = ["r.is_active = TRUE"];
    if (q) {
      params.push(`%${q}%`);
      where.push(`(r.name ILIKE $${params.length} OR r.cuisine ILIKE $${params.length})`);
    }
    if (cuisine) {
      params.push(cuisine);
      where.push(`r.cuisine ILIKE $${params.length}`);
    }

    const { rows } = await query(
      `SELECT ${COLUMNS}, COUNT(f.id)::int AS menu_items
       FROM restaurants r
       LEFT JOIN foods f ON f.restaurant_id = r.id AND f.is_available = TRUE
       WHERE ${where.join(" AND ")}
       GROUP BY r.id
       ORDER BY r.rating DESC, r.name`,
      params
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await query(`SELECT ${COLUMNS} FROM restaurants r WHERE r.id = $1`, [id]);
    return rows[0] ?? null;
  },

  async findIdsByOwner(ownerId) {
    const { rows } = await query("SELECT id FROM restaurants WHERE owner_id = $1 ORDER BY id", [ownerId]);
    return rows.map((row) => row.id);
  },

  async findByOwner(ownerId) {
    const { rows } = await query(`SELECT ${COLUMNS} FROM restaurants r WHERE r.owner_id = $1 ORDER BY r.name`, [ownerId]);
    return rows;
  },
};
