-- Table Ordering System — schema
-- Import this file first in phpMyAdmin, then seed.sql

CREATE TABLE IF NOT EXISTS shop_settings (
  id INT PRIMARY KEY DEFAULT 1,
  name VARCHAR(150) NOT NULL DEFAULT 'My Restaurant',
  address VARCHAR(255) NOT NULL DEFAULT '',
  phone VARCHAR(20) NOT NULL DEFAULT '',
  opening_time TIME NOT NULL DEFAULT '09:00:00',
  closing_time TIME NOT NULL DEFAULT '23:00:00',
  theme_color VARCHAR(20) NOT NULL DEFAULT '#1F6F5C',
  accent_color VARCHAR(20) NOT NULL DEFAULT '#E8A33D',
  logo_url VARCHAR(255) NOT NULL DEFAULT '',
  tax_percent DECIMAL(5,2) NOT NULL DEFAULT 5.00,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'owner',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS restaurant_tables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  table_number VARCHAR(20) UNIQUE NOT NULL,
  seat_count INT NOT NULL DEFAULT 2,
  category ENUM('high','medium','low') NOT NULL DEFAULT 'medium',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS menu_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(500) NOT NULL DEFAULT '',
  price_high DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_medium DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_low DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url VARCHAR(255) NOT NULL DEFAULT '',
  is_seasonal TINYINT(1) NOT NULL DEFAULT 0,
  available_from TIME DEFAULT NULL,
  available_to TIME DEFAULT NULL,
  is_available TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS promocodes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  discount_type ENUM('percentage','amount') NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  max_discount_amount DECIMAL(10,2) DEFAULT NULL,
  min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  first_n_customers INT DEFAULT NULL,
  first_time_only TINYINT(1) NOT NULL DEFAULT 0,
  total_usage_limit INT DEFAULT NULL,
  used_count INT NOT NULL DEFAULT 0,
  valid_from DATETIME DEFAULT NULL,
  valid_to DATETIME DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(30) UNIQUE NOT NULL,
  table_id INT NOT NULL,
  customer_phone VARCHAR(20) DEFAULT NULL,
  customer_name VARCHAR(100) DEFAULT NULL,
  status ENUM('placed','accepted','preparing','served','completed','cancelled') NOT NULL DEFAULT 'placed',
  payment_method ENUM('online','counter','cash') NOT NULL,
  payment_status ENUM('pending','paid','declined') NOT NULL DEFAULT 'pending',
  counter_code VARCHAR(20) DEFAULT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  promocode_id INT DEFAULT NULL,
  razorpay_order_id VARCHAR(100) DEFAULT NULL,
  razorpay_payment_id VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (table_id) REFERENCES restaurant_tables(id),
  FOREIGN KEY (promocode_id) REFERENCES promocodes(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  menu_item_id INT DEFAULT NULL,
  item_name VARCHAR(150) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS promocode_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  promocode_id INT NOT NULL,
  customer_phone VARCHAR(20) DEFAULT NULL,
  order_id INT NOT NULL,
  used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (promocode_id) REFERENCES promocodes(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_menu_category ON menu_items(category_id);
