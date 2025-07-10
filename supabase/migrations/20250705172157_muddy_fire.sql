/*
  # Add categories column to vendors table

  1. Schema Changes
    - Add `categories` column to `vendors` table
    - Column will store an array of category names (text[])
    - Default to empty array for existing vendors

  2. Notes
    - Uses PostgreSQL array type to support multiple categories per vendor
    - Existing vendors will have empty category arrays by default
    - New vendors can include categories when inserted
*/

-- Add categories column to vendors table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'categories'
  ) THEN
    ALTER TABLE vendors ADD COLUMN categories text[] DEFAULT '{}';
  END IF;
END $$;

-- Update existing vendors with sample categories (optional)
UPDATE vendors SET categories = ARRAY['Nuts & Dry Fruits, Flavour & Garnish'] 
WHERE vendor_name = 'Premium Nuts & Dry Fruits Co.';

UPDATE vendors SET categories = ARRAY['Dairy'] 
WHERE vendor_name = 'Fresh Dairy Products Ltd.';

UPDATE vendors SET categories = ARRAY['Spices & Herbs'] 
WHERE vendor_name = 'Spice World Trading';

UPDATE vendors SET categories = ARRAY['Pastry & Dough', 'Grains & Flour'] 
WHERE vendor_name = 'Organic Flour Mills';