-- Migration: Update products table for new product model
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS isCombo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vegType text NOT NULL DEFAULT 'veg',
  ADD COLUMN IF NOT EXISTS storeIds text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Remove deprecated columns if they exist
ALTER TABLE products DROP COLUMN IF EXISTS type;
ALTER TABLE products DROP COLUMN IF EXISTS comboProducts;
ALTER TABLE products DROP COLUMN IF EXISTS image;
ALTER TABLE products DROP COLUMN IF EXISTS category;
ALTER TABLE products DROP COLUMN IF EXISTS storeNames;

-- Ensure code and name are unique
CREATE UNIQUE INDEX IF NOT EXISTS products_code_key ON products (code);
CREATE UNIQUE INDEX IF NOT EXISTS products_name_key ON products (name);

-- Ensure price, isCombo, vegType, status are NOT NULL
ALTER TABLE products ALTER COLUMN price SET NOT NULL;
ALTER TABLE products ALTER COLUMN code SET NOT NULL;
ALTER TABLE products ALTER COLUMN name SET NOT NULL;
ALTER TABLE products ALTER COLUMN isCombo SET NOT NULL;
ALTER TABLE products ALTER COLUMN vegType SET NOT NULL;
ALTER TABLE products ALTER COLUMN status SET NOT NULL;

-- Make recipe nullable
ALTER TABLE products ALTER COLUMN recipe DROP NOT NULL; 