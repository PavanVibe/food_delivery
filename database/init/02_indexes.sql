CREATE INDEX idx_orders_user_created       ON orders (user_id, created_at DESC);
CREATE INDEX idx_orders_restaurant_created ON orders (restaurant_id, created_at DESC);

-- Covering index: analytics aggregates run as index-only scans
CREATE INDEX idx_orders_created_at ON orders (created_at) INCLUDE (restaurant_id, user_id, status, total);

-- Partial index: only live orders
CREATE INDEX idx_orders_active ON orders (restaurant_id, status)
    WHERE status NOT IN ('delivered', 'cancelled');

CREATE INDEX idx_order_items_order ON order_items (order_id) INCLUDE (food_id, quantity, unit_price);
CREATE INDEX idx_order_items_food  ON order_items (food_id);

CREATE INDEX idx_foods_restaurant ON foods (restaurant_id);
CREATE INDEX idx_foods_category   ON foods (category_id);
CREATE INDEX idx_foods_tags       ON foods USING GIN (tags);
CREATE INDEX idx_foods_name_trgm  ON foods USING GIN (name gin_trgm_ops);

CREATE INDEX idx_restaurants_owner ON restaurants (owner_id);
