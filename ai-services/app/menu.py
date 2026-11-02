from decimal import Decimal
from typing import Protocol

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

FOOD_SQL = """
    SELECT f.id, f.name, f.description, f.price, f.rating, f.is_veg, f.spice_level,
           f.calories, f.protein_g, f.tags, f.image_url,
           r.id AS restaurant_id, r.name AS restaurant_name, r.cuisine, c.name AS category
    FROM foods f
    JOIN restaurants r ON r.id = f.restaurant_id
    LEFT JOIN categories c ON c.id = f.category_id
    WHERE f.is_available AND r.is_active
"""

HISTORY_SQL = """
    SELECT f.id, f.name, c.name AS category, f.is_veg, SUM(oi.quantity)::int AS times_ordered
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN foods f ON f.id = oi.food_id
    LEFT JOIN categories c ON c.id = f.category_id
    WHERE o.user_id = %s AND o.status <> 'cancelled'
    GROUP BY f.id, c.name
    ORDER BY times_ordered DESC, f.id
    LIMIT 10
"""


class MenuSource(Protocol):
    def all_foods(self) -> list[dict]: ...
    def foods_by_ids(self, ids: list[int]) -> list[dict]: ...
    def popular(self, limit: int) -> list[dict]: ...
    def user_history(self, user_id: int) -> list[dict]: ...


def _plain(row: dict) -> dict:
    return {key: float(value) if isinstance(value, Decimal) else value for key, value in row.items()}


class MenuRepository:
    """Read-only access to live menu data and order history in PostgreSQL."""

    def __init__(self, conninfo: str):
        self._pool = ConnectionPool(conninfo, min_size=1, max_size=5, timeout=5, kwargs={"row_factory": dict_row}, open=True)

    def _fetch(self, sql: str, params: tuple = ()) -> list[dict]:
        with self._pool.connection() as conn:
            return [_plain(row) for row in conn.execute(sql, params).fetchall()]

    def all_foods(self) -> list[dict]:
        return self._fetch(FOOD_SQL + " ORDER BY f.id")

    def foods_by_ids(self, ids: list[int]) -> list[dict]:
        if not ids:
            return []
        return self._fetch(FOOD_SQL + " AND f.id = ANY(%s)", (ids,))

    def popular(self, limit: int) -> list[dict]:
        return self._fetch(FOOD_SQL + " ORDER BY f.rating DESC, f.id LIMIT %s", (limit,))

    def user_history(self, user_id: int) -> list[dict]:
        return self._fetch(HISTORY_SQL, (user_id,))

    def close(self) -> None:
        self._pool.close()
