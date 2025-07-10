/*
  # Add Settings Module Tables

  1. New Tables
    - `stores`
      - `id` (uuid, primary key)
      - `name` (text)
      - `address` (text)
      - `manager_id` (uuid, foreign key to managers)
      - `is_central` (boolean, default false)
      - `is_active` (boolean, default true)
      - `created_at` (timestamp)
    
    - `managers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `phone` (text)
      - `address` (text, optional)
      - `store_id` (uuid, foreign key to stores, optional)
      - `generated_id` (text, unique)
      - `created_at` (timestamp)
    
    - `raw_materials`
      - `id` (uuid, primary key)
      - `name` (text)
      - `code` (text, unique)
      - `unit_of_measurement` (text)
      - `current_stock` (integer, default 0)
      - `min_stock` (integer, default 0)
      - `max_stock` (integer, default 0)
      - `price` (decimal)
      - `is_active` (boolean, default true)
      - `purchase_order_quantity` (integer, optional)
      - `expiry` (date, optional)
      - `storage_location` (text, optional)
      - `allergen_info` (text, optional)
      - `created_at` (timestamp)
    
    - `vendors`
      - `id` (uuid, primary key)
      - `vendor_name` (text)
      - `contact_person` (text)
      - `phone_number` (text)
      - `email` (text)
      - `address` (text)
      - `gstin_tax_id` (text, optional)
      - `notes` (text, optional)
      - `created_at` (timestamp)
    
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `price` (decimal)
      - `code` (text, unique)
      - `status` (text, default 'active')
      - `recipe` (text, optional)
      - `created_at` (timestamp)
    
    - `product_stores` (junction table)
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `store_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access
*/

-- Create stores table
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  manager_id uuid,
  is_central boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create managers table
CREATE TABLE IF NOT EXISTS managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  address text,
  store_id uuid,
  generated_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create raw_materials table
CREATE TABLE IF NOT EXISTS raw_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  unit_of_measurement text NOT NULL,
  current_stock integer DEFAULT 0,
  min_stock integer DEFAULT 0,
  max_stock integer DEFAULT 0,
  price decimal(10,2) NOT NULL,
  is_active boolean DEFAULT true,
  purchase_order_quantity integer,
  expiry date,
  storage_location text,
  allergen_info text,
  created_at timestamptz DEFAULT now()
);

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name text NOT NULL,
  contact_person text NOT NULL,
  phone_number text NOT NULL,
  email text NOT NULL,
  address text NOT NULL,
  gstin_tax_id text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create products table (separate from menu_items for settings)
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price decimal(10,2) NOT NULL,
  code text UNIQUE NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  recipe text,
  created_at timestamptz DEFAULT now()
);

-- Create product_stores junction table
CREATE TABLE IF NOT EXISTS product_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, store_id)
);

-- Add foreign key constraints
ALTER TABLE stores ADD CONSTRAINT stores_manager_id_fkey 
  FOREIGN KEY (manager_id) REFERENCES managers(id);

ALTER TABLE managers ADD CONSTRAINT managers_store_id_fkey 
  FOREIGN KEY (store_id) REFERENCES stores(id);

-- Add constraints
ALTER TABLE raw_materials ADD CONSTRAINT raw_materials_stock_check 
  CHECK (current_stock >= 0 AND min_stock >= 0 AND max_stock > 0 AND min_stock < max_stock);

-- Enable Row Level Security
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_stores ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow all operations on stores"
  ON stores FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on managers"
  ON managers FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on raw_materials"
  ON raw_materials FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on vendors"
  ON vendors FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on products"
  ON products FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on product_stores"
  ON product_stores FOR ALL TO public USING (true) WITH CHECK (true);

-- Insert sample data
INSERT INTO managers (name, phone, generated_id) VALUES
  ('Rajesh Kumar', '9876543210', 'MGR-001'),
  ('Priya Sharma', '8765432109', 'MGR-002'),
  ('Amit Patel', '7654321098', 'MGR-003'),
  ('Sneha Reddy', '6543210987', 'MGR-004');

INSERT INTO stores (name, address, manager_id, is_central) VALUES
  ('Kondapur Main Store', 'Plot No. 123, HITEC City Road, Kondapur, Hyderabad, Telangana 500084', 
   (SELECT id FROM managers WHERE generated_id = 'MGR-001'), true),
  ('Kompally Branch', 'Shop No. 45, Kompally Main Road, Kompally, Hyderabad, Telangana 500014', 
   (SELECT id FROM managers WHERE generated_id = 'MGR-002'), false);

INSERT INTO products (name, price, code) VALUES
  ('Kunafa Chocolate', 349.00, 'PROD-20250125-001'),
  ('Nutella Cream Cheese Kunafa', 399.00, 'PROD-20250125-002'),
  ('Kataifi Cream Cheese Kunafa', 399.00, 'PROD-20250125-003'),
  ('Mixed Dry-Fruit Baklava', 449.00, 'PROD-20250125-004'),
  ('Pista Finger Baklava', 399.00, 'PROD-20250125-005'),
  ('Triangle Baklava', 399.00, 'PROD-20250125-006'),
  ('Almond Basbousa', 299.00, 'PROD-20250125-007'),
  ('Cashew Basbousa', 299.00, 'PROD-20250125-008');

-- Link products to stores
INSERT INTO product_stores (product_id, store_id)
SELECT p.id, s.id 
FROM products p 
CROSS JOIN stores s;

INSERT INTO raw_materials (name, code, unit_of_measurement, current_stock, min_stock, max_stock, price, storage_location) VALUES
  ('Almonds', 'RM-20250125-001', 'kg', 25, 10, 50, 800.00, 'Dry Storage A1'),
  ('Cashews', 'RM-20250125-002', 'kg', 8, 15, 40, 1200.00, 'Dry Storage A2'),
  ('Phyllo Pastry', 'RM-20250125-003', 'pcs', 45, 20, 100, 25.00, 'Freezer B1'),
  ('Semolina', 'RM-20250125-004', 'kg', 0, 5, 25, 45.00, 'Dry Storage B1');

INSERT INTO vendors (vendor_name, contact_person, phone_number, email, address, gstin_tax_id, notes) VALUES
  ('Premium Nuts & Dry Fruits Co.', 'Rajesh Gupta', '9876543210', 'rajesh@premiumnutsco.com', 
   'Plot No. 45, Industrial Area Phase-II, Chandigarh, Punjab 160002', '03ABCDE1234F1Z5',
   'Reliable supplier for almonds and cashews. Offers bulk discounts.'),
  ('Fresh Dairy Products Ltd.', 'Priya Sharma', '8765432109', 'priya.sharma@freshdairy.in',
   '123 Dairy Farm Road, Sector 12, Gurgaon, Haryana 122001', '06FGHIJ5678K2L9', NULL),
  ('Spice World Trading', 'Mohammed Ali', '7654321098', 'mohammed@spiceworld.com',
   'Shop 67, Spice Market, Old Delhi, Delhi 110006', NULL,
   'Best quality spices and herbs. Quick delivery within Delhi NCR.'),
  ('Organic Flour Mills', 'Sunita Patel', '6543210987', 'sunita@organicflour.co.in',
   'Village Kheda, Anand District, Gujarat 388001', '24MNOPQ9012R3S6',
   'Specializes in organic and gluten-free flour varieties.');