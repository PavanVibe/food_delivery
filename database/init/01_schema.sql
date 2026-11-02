CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('customer', 'restaurant_owner', 'admin');

CREATE TYPE order_status AS ENUM (
    'pending',
    'confirmed',
    'preparing',
    'out_for_delivery',
    'delivered',
    'cancelled'
);

CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          user_role    NOT NULL DEFAULT 'customer',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE restaurants (
    id                SERIAL PRIMARY KEY,
    owner_id          INT REFERENCES users(id) ON DELETE SET NULL,
    name              VARCHAR(150) NOT NULL UNIQUE,
    description       TEXT,
    cuisine           VARCHAR(80)  NOT NULL,
    address           TEXT,
    image_url         TEXT,
    rating            NUMERIC(2,1) NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
    delivery_time_min INT          NOT NULL DEFAULT 30 CHECK (delivery_time_min > 0),
    is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE categories (
    id   SERIAL PRIMARY KEY,
    name VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE foods (
    id            SERIAL PRIMARY KEY,
    restaurant_id INT           NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id   INT           REFERENCES categories(id) ON DELETE SET NULL,
    name          VARCHAR(150)  NOT NULL,
    description   TEXT,
    price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    rating        NUMERIC(2,1)  NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
    is_veg        BOOLEAN       NOT NULL DEFAULT TRUE,
    spice_level   SMALLINT      NOT NULL DEFAULT 0 CHECK (spice_level BETWEEN 0 AND 3),
    calories      INT           CHECK (calories >= 0),
    protein_g     INT           CHECK (protein_g >= 0),
    tags          TEXT[]        NOT NULL DEFAULT '{}',
    image_url     TEXT,
    is_available  BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    UNIQUE (restaurant_id, name)
);

CREATE TABLE cart_items (
    id         SERIAL PRIMARY KEY,
    user_id    INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    food_id    INT         NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
    quantity   INT         NOT NULL CHECK (quantity BETWEEN 1 AND 20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, food_id)
);

CREATE TABLE orders (
    id               SERIAL PRIMARY KEY,
    user_id          INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    restaurant_id    INT           NOT NULL REFERENCES restaurants(id),
    status           order_status  NOT NULL DEFAULT 'pending',
    subtotal         NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    delivery_fee     NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (delivery_fee >= 0),
    total            NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    delivery_address TEXT          NOT NULL,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
    id         SERIAL PRIMARY KEY,
    order_id   INT           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    food_id    INT           NOT NULL REFERENCES foods(id),
    quantity   INT           NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0)
);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_foods_updated_at
    BEFORE UPDATE ON foods
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
