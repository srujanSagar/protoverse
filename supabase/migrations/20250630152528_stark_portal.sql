/*
  # Add Categories and Units tables for Basic Setup

  1. New Tables
    - `raw_material_categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `created_at` (timestamp)
    
    - `units_of_measurement`
      - `id` (uuid, primary key)
      - `value` (text, unique)
      - `label` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access
*/

-- Create raw_material_categories table
CREATE TABLE IF NOT EXISTS raw_material_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create units_of_measurement table
CREATE TABLE IF NOT EXISTS units_of_measurement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text UNIQUE NOT NULL,
  label text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE raw_material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE units_of_measurement ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow all operations on raw_material_categories"
  ON raw_material_categories
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations on units_of_measurement"
  ON units_of_measurement
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Insert default categories
INSERT INTO raw_material_categories (name) VALUES
  ('Dairy & Eggs'),
  ('Nuts & Seeds'),
  ('Grains & Flour'),
  ('Spices & Herbs'),
  ('Sweeteners'),
  ('Oils & Fats'),
  ('Fruits & Vegetables'),
  ('Meat & Poultry'),
  ('Seafood'),
  ('Beverages'),
  ('Baking Essentials'),
  ('Condiments & Sauces'),
  ('Frozen Items'),
  ('Canned Goods'),
  ('General')
ON CONFLICT (name) DO NOTHING;

-- Insert default units
INSERT INTO units_of_measurement (value, label) VALUES
  ('g', 'Grams (g)'),
  ('kg', 'Kilograms (kg)'),
  ('lb', 'Pounds (lb)'),
  ('oz', 'Ounces (oz)'),
  ('pcs', 'Pieces (pcs)'),
  ('l', 'Liters (l)'),
  ('ml', 'Milliliters (ml)'),
  ('cups', 'Cups'),
  ('tbsp', 'Tablespoons (tbsp)'),
  ('tsp', 'Teaspoons (tsp)')
ON CONFLICT (value) DO NOTHING;