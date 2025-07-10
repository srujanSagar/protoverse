-- Migration: Remove 'variants' column from 'products' table and ensure 'type' is used for combo tagging
ALTER TABLE products DROP COLUMN IF EXISTS variants;
-- Ensure 'type' column exists for tagging combos (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='type') THEN
    ALTER TABLE products ADD COLUMN type text;
  END IF;
END $$; 