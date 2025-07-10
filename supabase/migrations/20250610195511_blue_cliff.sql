/*
  # Restaurant POS Database Schema

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `mobile` (text)
      - `created_at` (timestamp)
    
    - `menu_items`
      - `id` (uuid, primary key)
      - `name` (text)
      - `price` (decimal)
      - `category` (text)
      - `description` (text, optional)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
    
    - `discount_codes`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `type` (text) -- 'percentage' or 'fixed'
      - `value` (decimal)
      - `description` (text)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
    
    - `orders`
      - `id` (uuid, primary key)
      - `order_number` (text, unique)
      - `customer_id` (uuid, foreign key)
      - `subtotal` (decimal)
      - `discount_code` (text, optional)
      - `discount_amount` (decimal, default 0)
      - `tax_rate` (decimal)
      - `tax_amount` (decimal)
      - `total` (decimal)
      - `status` (text, default 'completed')
      - `created_at` (timestamp)
    
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key)
      - `menu_item_id` (uuid, foreign key)
      - `quantity` (integer)
      - `unit_price` (decimal)
      - `total_price` (decimal)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (since this is a POS system)
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  mobile text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price decimal(10,2) NOT NULL,
  category text NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value decimal(10,2) NOT NULL,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES customers(id),
  subtotal decimal(10,2) NOT NULL,
  discount_code text,
  discount_amount decimal(10,2) DEFAULT 0,
  tax_rate decimal(5,4) NOT NULL,
  tax_amount decimal(10,2) NOT NULL,
  total decimal(10,2) NOT NULL,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES menu_items(id),
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price decimal(10,2) NOT NULL,
  total_price decimal(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (POS system needs to work without authentication)
CREATE POLICY "Allow all operations on customers"
  ON customers
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on menu_items"
  ON menu_items
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on discount_codes"
  ON discount_codes
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on orders"
  ON orders
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on order_items"
  ON order_items
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Insert sample menu items
INSERT INTO menu_items (name, price, category, description) VALUES
  ('Grilled Chicken Breast', 18.99, 'Main Course', 'Juicy grilled chicken with herbs and spices'),
  ('Beef Steak', 24.99, 'Main Course', 'Premium cut beef steak cooked to perfection'),
  ('Salmon Fillet', 22.99, 'Main Course', 'Fresh Atlantic salmon with lemon butter'),
  ('Vegetarian Pasta', 14.99, 'Main Course', 'Fresh vegetables with creamy alfredo sauce'),
  ('Caesar Salad', 8.99, 'Appetizer', 'Crisp romaine with parmesan and croutons'),
  ('Chicken Wings', 12.99, 'Appetizer', 'Spicy buffalo wings with ranch dip'),
  ('Mozzarella Sticks', 9.99, 'Appetizer', 'Golden fried mozzarella with marinara sauce'),
  ('Coca Cola', 2.99, 'Beverage', 'Refreshing cola drink'),
  ('Fresh Orange Juice', 4.99, 'Beverage', 'Freshly squeezed orange juice'),
  ('Coffee', 3.99, 'Beverage', 'Premium roasted coffee'),
  ('Chocolate Cake', 6.99, 'Dessert', 'Rich chocolate cake with ganache'),
  ('Ice Cream Sundae', 5.99, 'Dessert', 'Vanilla ice cream with toppings');

-- Insert sample discount codes
INSERT INTO discount_codes (code, type, value, description) VALUES
  ('WELCOME10', 'percentage', 10, '10% off for new customers'),
  ('SAVE5', 'fixed', 5, '$5 flat discount'),
  ('STUDENT15', 'percentage', 15, '15% student discount'),
  ('SENIOR20', 'percentage', 20, '20% senior citizen discount');