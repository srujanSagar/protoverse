/*
  # Add vendor_id to raw_materials table

  1. Schema Changes
    - Add `vendor_id` column to `raw_materials` table
    - Column will store a reference to the vendor that supplies this material
    - Add foreign key constraint to vendors table

  2. Notes
    - This allows tracking which supplier provides each raw material
    - Optional field - not all materials need to have a vendor assigned
*/

-- Add vendor_id column to raw_materials table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'raw_materials' AND column_name = 'vendor_id'
  ) THEN
    ALTER TABLE raw_materials ADD COLUMN vendor_id uuid REFERENCES vendors(id);
  END IF;
END $$;

-- Update the max_stock constraint to be more flexible
ALTER TABLE raw_materials DROP CONSTRAINT IF EXISTS raw_materials_stock_check;
ALTER TABLE raw_materials ADD CONSTRAINT raw_materials_stock_check 
  CHECK (current_stock >= 0 AND min_stock >= 0 AND max_stock > 0);