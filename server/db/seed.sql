-- Default data. Run after schema.sql.
-- Default admin login -> username: admin | password: admin123
-- CHANGE THIS PASSWORD after your first login (Settings page or DB update).

INSERT INTO shop_settings (id, name, address, phone, opening_time, closing_time, theme_color, accent_color, tax_percent)
VALUES (1, 'My Restaurant', '123 Main Street', '9999999999', '09:00:00', '23:00:00', '#1F6F5C', '#E8A33D', 5.00)
ON DUPLICATE KEY UPDATE id = id;

INSERT INTO admins (username, password_hash, role)
VALUES ('admin', '$2b$10$BpDgRbJwI21oNOjv3N92d.wqk/Od/OX6ZsUIEcoV.d/z0nRMzSQtG', 'owner')
ON DUPLICATE KEY UPDATE username = username;

INSERT INTO categories (name, display_order) VALUES
  ('Starters', 1),
  ('Main Course', 2),
  ('Beverages', 3),
  ('Desserts', 4);

INSERT INTO restaurant_tables (table_number, seat_count, category) VALUES
  ('1', 2, 'low'),
  ('2', 4, 'medium'),
  ('3', 6, 'high');

-- Sample menu items (category_id 1=Starters,2=Main,3=Beverages,4=Desserts)
INSERT INTO menu_items (category_id, name, description, price_high, price_medium, price_low, is_available) VALUES
  (1, 'Paneer Tikka', 'Chargrilled cottage cheese with house spices', 220, 200, 180, 1),
  (2, 'Butter Chicken', 'Slow-simmered tomato & butter gravy', 320, 300, 280, 1),
  (3, 'Masala Chai', 'Spiced Indian tea', 60, 50, 40, 1),
  (4, 'Gulab Jamun (2 pc)', 'Warm milk dumplings in sugar syrup', 90, 80, 70, 1);

-- Sample promo codes
INSERT INTO promocodes (code, discount_type, discount_value, min_order_amount, first_n_customers, first_time_only, is_active)
VALUES ('WELCOME50', 'percentage', 50, 199, 100, 1, 1);

INSERT INTO promocodes (code, discount_type, discount_value, min_order_amount, is_active)
VALUES ('FLAT50', 'amount', 50, 300, 1);
