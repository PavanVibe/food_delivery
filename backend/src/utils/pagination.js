export const toOffset = ({ page, limit }) => (page - 1) * limit;

export const pageMeta = (total, { page, limit }) => ({ page, limit, total, total_pages: Math.ceil(total / limit) });

// For queries that return a COUNT(*) OVER() total_count column
export const paginated = (rows, params) => ({
  data: rows.map(({ total_count: _total, ...row }) => row),
  meta: pageMeta(rows[0]?.total_count ?? 0, params),
});
