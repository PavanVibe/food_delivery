import { query } from "../config/db.js";

const COLUMNS = `f.id, f.restaurant_id, r.name AS restaurant_name, f.category_id, c.name AS category,
                 f.name, f.description, f.price, f.rating, f.is_veg, f.spice_level, f.calories,
                 f.protein_g, f.tags, f.image_url, f.is_available`;

const FROM = `FROM foods f
              JOIN restaurants r ON r.id = f.restaurant_id
              LEFT JOIN categories c ON c.id = f.category_id`;

const SORTS = {
  rating: "f.rating DESC, f.id",
  price_asc: "f.price ASC, f.id",
  price_desc: "f.price DESC, f.id",
  newest: "f.created_at DESC, f.id DESC",
  name: "f.name ASC, f.id",
};

const WRITABLE = [
  "restaurant_id",
  "category_id",
  "name",
  "description",
  "price",
  "is_veg",
  "spice_level",
  "calories",
  "protein_g",
  "tags",
  "image_url",
  "is_available",
];

export const foodRepository = {
  async findMany({ q, restaurantId, categoryId, veg, maxPrice, minRating, includeUnavailable, sort, limit, offset }) {
    const params = [];
    const where = ["r.is_active = TRUE"];
    const add = (sql, value) => {
      params.push(value);
      where.push(sql.replaceAll("?", `$${params.length}`));
    };

    if (!includeUnavailable) where.push("f.is_available = TRUE");
    if (q) {
      params.push(`%${q}%`, q.toLowerCase());
      where.push(`(f.name ILIKE $${params.length - 1} OR f.description ILIKE $${params.length - 1} OR $${params.length} = ANY(f.tags))`);
    }
    if (restaurantId) add("f.restaurant_id = ?", restaurantId);
    if (categoryId) add("f.category_id = ?", categoryId);
    if (veg !== undefined) add("f.is_veg = ?", veg);
    if (maxPrice !== undefined) add("f.price <= ?", maxPrice);
    if (minRating !== undefined) add("f.rating >= ?", minRating);

    params.push(limit, offset);
    const { rows } = await query(
      `SELECT ${COLUMNS}, COUNT(*) OVER()::int AS total_count
       ${FROM}
       WHERE ${where.join(" AND ")}
       ORDER BY ${SORTS[sort] ?? SORTS.rating}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    return rows;
  },

  async search(term, limit) {
    const { rows } = await query(
      `SELECT ${COLUMNS}, word_similarity($1, f.name) AS score
       ${FROM}
       WHERE r.is_active AND f.is_available
         AND (f.name ILIKE $2 OR f.description ILIKE $2 OR word_similarity($1, f.name) >= 0.4)
       ORDER BY (f.name ILIKE $2) DESC, score DESC, f.rating DESC
       LIMIT $3`,
      [term, `%${term}%`, limit]
    );
    return rows;
  },

  async findById(id) {
    const { rows } = await query(`SELECT ${COLUMNS}, r.owner_id ${FROM} WHERE f.id = $1`, [id]);
    return rows[0] ?? null;
  },

  async create(food) {
    const columns = WRITABLE.filter((column) => food[column] !== undefined);
    const { rows } = await query(
      `INSERT INTO foods (${columns.join(", ")})
       VALUES (${columns.map((_, i) => `$${i + 1}`).join(", ")})
       RETURNING id`,
      columns.map((column) => food[column])
    );
    return this.findById(rows[0].id);
  },

  async update(id, changes) {
    const columns = WRITABLE.filter((column) => changes[column] !== undefined);
    const { rowCount } = await query(
      `UPDATE foods SET ${columns.map((column, i) => `${column} = $${i + 2}`).join(", ")} WHERE id = $1`,
      [id, ...columns.map((column) => changes[column])]
    );
    return rowCount ? this.findById(id) : null;
  },

  async remove(id) {
    const { rowCount } = await query("DELETE FROM foods WHERE id = $1", [id]);
    return rowCount > 0;
  },

  async findCategories() {
    const { rows } = await query(
      `SELECT c.id, c.name, COUNT(f.id)::int AS food_count
       FROM categories c
       LEFT JOIN foods f ON f.category_id = c.id AND f.is_available = TRUE
       GROUP BY c.id
       ORDER BY c.name`
    );
    return rows;
  },
};
