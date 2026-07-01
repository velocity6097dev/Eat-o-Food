-- ============================================================
-- Eat-o-Food (Bistro Track) — Database Schema (Shared Hosting / InfinityFree)
--
-- Use THIS file (not database/schema.sql) when importing on
-- InfinityFree or any shared host. Their MySQL user only has
-- privileges inside the one database they already created for
-- you via the control panel — it can't CREATE DATABASE itself,
-- so that statement (and USE) has been removed here.
--
-- How to import:
-- 1. In the InfinityFree control panel, go to MySQL Databases,
--    create a database (e.g. "eatofood"). Note the full name it
--    gets assigned, e.g. epiz_12345678_eatofood.
-- 2. Click "Admin" next to that database to open phpMyAdmin —
--    it opens already pointed at your database.
-- 3. Import tab -> choose this file -> Go.
-- ============================================================

SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- Categories (Starters, Mains, Breads, Drinks, Desserts)
-- ------------------------------------------------------------
CREATE TABLE categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  slug        VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0
);

INSERT INTO categories (id, slug, name, sort_order) VALUES
  (1, 'starters', 'Starters', 1),
  (2, 'mains',    'Mains',    2),
  (3, 'breads',   'Breads',   3),
  (4, 'drinks',   'Drinks',   4),
  (5, 'desserts', 'Desserts', 5);

-- ------------------------------------------------------------
-- Menu items — IDs match data-id used in menu.html so nothing
-- needs to be renumbered when you wire the frontend up.
-- ------------------------------------------------------------
CREATE TABLE menu_items (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  category_id     INT NOT NULL,
  name            VARCHAR(150) NOT NULL,
  description     VARCHAR(255) DEFAULT NULL,
  price           DECIMAL(10,2) NOT NULL,
  emoji           VARCHAR(10) DEFAULT '🍽️',
  is_veg          TINYINT(1) NOT NULL DEFAULT 1,
  is_bestseller   TINYINT(1) NOT NULL DEFAULT 0,
  available_from  TIME DEFAULT NULL,   -- e.g. '18:00:00' for Fish Curry
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  sort_order      INT NOT NULL DEFAULT 0,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

INSERT INTO menu_items
  (id, category_id, name, description, price, emoji, is_veg, is_bestseller, available_from, sort_order) VALUES
  (1,  2, 'Butter Chicken', 'Creamy tomato curry, best seller', 360, '🍗', 0, 1, NULL,        1),
  (2,  1, 'Paneer Tikka',   'Grilled cottage cheese, tandoor style', 280, '🍛', 1, 0, NULL,    1),
  (3,  2, 'Fish Curry',     'Coastal style, fresh catch', 420, '🐟', 0, 0, '18:00:00',         2),
  (4,  3, 'Garlic Naan',    'Tandoor-baked flatbread with garlic', 75, '🥖', 1, 0, NULL,       1),
  (5,  4, 'Coke',           'Chilled soft drink', 40, '🥤', 1, 0, NULL,                        1),
  (6,  5, 'Gulab Jamun',    'Warm, sweet, and syrupy', 90, '🍮', 1, 0, NULL,                   1),
  (7,  1, 'Spring Rolls',   'Crispy vegetable rolls with dip', 180, '🥟', 1, 0, NULL,          2),
  (8,  2, 'Dal Makhani',    'Creamy lentils with butter and cream', 240, '🥘', 1, 0, NULL,     3),
  (9,  3, 'Butter Naan',    'Soft naan with melted butter', 65, '🥐', 1, 0, NULL,              2),
  (10, 4, 'Lassi',          'Sweet yogurt drink', 60, '🥛', 1, 0, NULL,                        2),
  (11, 5, 'Kheer',          'Rice pudding with cardamom', 80, '🍲', 1, 0, NULL,                2);

-- ------------------------------------------------------------
-- Promo codes — WELCOME20 matches the one hardcoded in cart.html
-- ------------------------------------------------------------
CREATE TABLE promo_codes (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  code              VARCHAR(50) NOT NULL UNIQUE,
  discount_percent  DECIMAL(5,2) NOT NULL,
  is_active         TINYINT(1) NOT NULL DEFAULT 1,
  expires_at        DATETIME DEFAULT NULL
);

INSERT INTO promo_codes (code, discount_percent, is_active, expires_at) VALUES
  ('WELCOME20', 20.00, 1, NULL);

-- ------------------------------------------------------------
-- Orders & order items
-- ------------------------------------------------------------
CREATE TABLE orders (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  table_number         VARCHAR(20) NOT NULL,
  subtotal             DECIMAL(10,2) NOT NULL,
  discount_amount      DECIMAL(10,2) NOT NULL DEFAULT 0,
  gst_amount           DECIMAL(10,2) NOT NULL DEFAULT 0,
  total                DECIMAL(10,2) NOT NULL,
  promo_code           VARCHAR(50) DEFAULT NULL,
  payment_method       VARCHAR(30) DEFAULT NULL,   -- UPI / Card / Counter
  payment_status       ENUM('pending','paid','failed') NOT NULL DEFAULT 'pending',
  razorpay_order_id    VARCHAR(100) DEFAULT NULL,
  razorpay_payment_id  VARCHAR(100) DEFAULT NULL,
  status               ENUM('placed','preparing','ready','completed','cancelled') NOT NULL DEFAULT 'placed',
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  order_id       INT NOT NULL,
  menu_item_id   INT DEFAULT NULL,
  item_name      VARCHAR(150) NOT NULL,   -- snapshot, survives menu edits
  price          DECIMAL(10,2) NOT NULL,  -- snapshot
  quantity       INT NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- Restaurant settings — key/value store.
-- Seeded with the values currently hardcoded in settings.html,
-- ready for whenever the owner side gets finalised.
-- ------------------------------------------------------------
CREATE TABLE settings (
  `key`    VARCHAR(50) PRIMARY KEY,
  `value`  TEXT
);

INSERT INTO settings (`key`, `value`) VALUES
  ('restaurant_name', 'Bistro Track'),
  ('address',         '42 Park Street, Kolkata'),
  ('open_time',       '11:00 AM'),
  ('close_time',      '11:00 PM'),
  ('upi_id',          'bistrotrack@upi');
