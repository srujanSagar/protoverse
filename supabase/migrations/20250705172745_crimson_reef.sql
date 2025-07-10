/*
  # Update Raw Material Categories

  1. Changes
    - Update raw_material_categories table with new categories from vendor categories
    - Ensure no duplicates by using ON CONFLICT DO NOTHING
    - Categories include:
      - Pastry & Dough
      - Dairy
      - Chocolate & Spreads
      - Nuts & Dry Fruits
      - Flavour & Garnish

  2. Notes
    - These categories align with vendor categories for better organization
    - Existing categories are preserved
*/

-- Insert new categories from vendor categories
INSERT INTO raw_material_categories (name) VALUES
  ('Pastry & Dough'),
  ('Dairy'),
  ('Chocolate & Spreads'),
  ('Nuts & Dry Fruits'),
  ('Flavour & Garnish')
ON CONFLICT (name) DO NOTHING;