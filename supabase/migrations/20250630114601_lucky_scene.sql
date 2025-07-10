/*
  # Add category field to raw_materials table

  1. Schema Changes
    - Add `category` column to `raw_materials` table
    - Default to 'General' for existing materials
    - Update existing materials with appropriate categories

  2. Notes
    - This helps organize raw materials by type
    - Improves filtering and reporting capabilities
*/

-- Add category column to raw_materials table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'raw_materials' AND column_name = 'category'
  ) THEN
    ALTER TABLE raw_materials ADD COLUMN category text DEFAULT 'General';
  END IF;
END $$;

-- Update existing raw materials with appropriate categories
UPDATE raw_materials SET category = 'Nuts & Seeds' WHERE name ILIKE '%almond%' OR name ILIKE '%cashew%' OR name ILIKE '%pistachio%' OR name ILIKE '%nut%';
UPDATE raw_materials SET category = 'Dairy & Eggs' WHERE name ILIKE '%milk%' OR name ILIKE '%cream%' OR name ILIKE '%butter%' OR name ILIKE '%cheese%' OR name ILIKE '%egg%';
UPDATE raw_materials SET category = 'Grains & Flour' WHERE name ILIKE '%flour%' OR name ILIKE '%semolina%' OR name ILIKE '%wheat%' OR name ILIKE '%rice%';
UPDATE raw_materials SET category = 'Sweeteners' WHERE name ILIKE '%sugar%' OR name ILIKE '%honey%' OR name ILIKE '%syrup%';
UPDATE raw_materials SET category = 'Spices & Herbs' WHERE name ILIKE '%spice%' OR name ILIKE '%cinnamon%' OR name ILIKE '%cardamom%';