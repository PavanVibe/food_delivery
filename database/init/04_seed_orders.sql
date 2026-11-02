-- Synthetic order history: 2,000 customers, 50,000+ orders over 180 days
SELECT setseed(0.42);

ALTER TABLE orders DISABLE TRIGGER trg_orders_updated_at;

INSERT INTO users (name, email, password_hash, role, created_at)
SELECT 'Customer ' || g, 'customer' || g || '@example.com', pw.hash, 'customer', now() - random() * interval '365 days'
FROM generate_series(1, 2000) AS g
CROSS JOIN (SELECT crypt('Customer@123', gen_salt('bf', 10)) AS hash) AS pw;

WITH customers AS (
    SELECT array_agg(id ORDER BY id) AS ids FROM users WHERE email LIKE 'customer%@example.com'
),
rests AS (
    SELECT array_agg(id ORDER BY id) AS ids FROM restaurants
),
base AS (
    SELECT random() AS r_user,
           random() AS r_rest,
           random() AS r_status,
           random() AS r_live,
           floor(random() * 400)::int + 1 AS house_no,
           floor(random() * 10)::int + 1  AS area_idx,
           CASE WHEN g <= 60
               THEN now() - random() * interval '2 hours'
               ELSE ((current_date - 1 - floor(random() * 180)::int)
                     + make_time((ARRAY[8,9,10,11,12,12,13,13,13,14,14,15,16,17,18,19,19,20,20,20,21,21,22,23])[1 + floor(random() * 24)::int],
                                 floor(random() * 60)::int, 0)
                    ) AT TIME ZONE 'Asia/Kolkata'
           END AS ts,
           g <= 60 AS is_live
    FROM generate_series(1, 50000) AS g
)
INSERT INTO orders (user_id, restaurant_id, status, subtotal, delivery_fee, total, delivery_address, created_at, updated_at)
SELECT c.ids[1 + floor(b.r_user * array_length(c.ids, 1))::int],
       r.ids[1 + floor(b.r_rest * array_length(r.ids, 1))::int],
       CASE
           WHEN b.is_live
               THEN (ARRAY['pending','confirmed','preparing','out_for_delivery']::order_status[])[1 + floor(b.r_live * 4)::int]
           WHEN b.r_status < 0.06 THEN 'cancelled'::order_status
           ELSE 'delivered'::order_status
       END,
       0, 0, 0,
       b.house_no || ', ' || (ARRAY['MG Road','Indiranagar','Koramangala','HSR Layout','Whitefield',
                                    'Jayanagar','Banjara Hills','Hitech City','Andheri West','Bandra West'])[b.area_idx],
       b.ts, b.ts
FROM base b CROSS JOIN customers c CROSS JOIN rests r;

-- Demo customer history (drives "For You" recommendations)
INSERT INTO orders (user_id, restaurant_id, status, subtotal, delivery_fee, total, delivery_address, created_at, updated_at)
SELECT u.id, r.id, 'delivered', 0, 0, 0, '221B MG Road, Bengaluru', ts, ts
FROM users u
CROSS JOIN restaurants r
CROSS JOIN LATERAL (
    SELECT now() - (g * interval '2 days') - (r.id * interval '3 hours') AS ts
    FROM generate_series(1, 10) AS g
) t
WHERE u.email = 'demo@foodhub.dev' AND r.name IN ('Green Bowl', 'Biryani Bros', 'Spice Route');

INSERT INTO order_items (order_id, food_id, quantity, unit_price)
SELECT o.id, f.id, 1 + floor(random() * 3)::int, f.price
FROM orders o
CROSS JOIN LATERAL (
    SELECT id, price
    FROM foods
    WHERE restaurant_id = o.restaurant_id
    ORDER BY random()
    LIMIT 1 + floor(random() * 3)::int
) f;

UPDATE orders o
SET subtotal     = s.subtotal,
    delivery_fee = CASE WHEN s.subtotal >= 499 THEN 0 ELSE 49 END,
    total        = s.subtotal + CASE WHEN s.subtotal >= 499 THEN 0 ELSE 49 END
FROM (
    SELECT order_id, SUM(quantity * unit_price) AS subtotal
    FROM order_items
    GROUP BY order_id
) s
WHERE s.order_id = o.id;

ALTER TABLE orders ENABLE TRIGGER trg_orders_updated_at;
