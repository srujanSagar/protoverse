/*
  # Fix vendor categories format

  1. Schema Changes
    - Update the format of the categories column in the vendors table
    - Convert from comma-separated strings within arrays to proper array elements
    - This ensures consistent data format for vendor categories

  2. Notes
    - The previous migration had categories stored as a single string with commas
    - This migration splits those strings into proper array elements
    - Improves data consistency and query capabilities
*/

-- Update vendors with proper array format for categories
UPDATE vendors 
SET categories = string_to_array(array_to_string(categories, ','), ', ')
WHERE array_length(categories, 1) = 1 AND categories[1] LIKE '%,%';

-- Insert any missing categories into raw_material_categories
INSERT INTO raw_material_categories (name)
SELECT DISTINCT unnest(categories)
FROM vendors
WHERE categories IS NOT NULL AND array_length(categories, 1) > 0
ON CONFLICT (name) DO NOTHING;