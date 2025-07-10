/*
  # Add vendor categories

  1. Schema Changes
    - Add `categories` column to `vendors` table as text array
    - Update existing vendors with appropriate categories
    - Add a new vendor with the "Nuts & Dry Fruits, Flavour & Garnish" category

  2. Notes
    - This helps categorize vendors by the types of products they supply
    - Improves filtering and reporting capabilities
*/

-- First add the categories column to vendors table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendors' AND column_name = 'categories'
  ) THEN
    ALTER TABLE vendors ADD COLUMN categories text[] DEFAULT '{}';
  END IF;
END $$;

-- Update existing vendors with the exact category format
UPDATE vendors SET categories = ARRAY['Pastry & Dough, Dairy, Chocolate & Spreads'] 
WHERE vendor_name = 'Premium Nuts & Dry Fruits Co.';

UPDATE vendors SET categories = ARRAY['Chocolate & Spreads'] 
WHERE vendor_name = 'Fresh Dairy Products Ltd.';

UPDATE vendors SET categories = ARRAY['Dairy'] 
WHERE vendor_name = 'Spice World Trading';

UPDATE vendors SET categories = ARRAY['Pastry & Dough'] 
WHERE vendor_name = 'Organic Flour Mills';

-- Add a new vendor with the Nuts & Dry Fruits, Flavour & Garnish category if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vendors WHERE vendor_name = 'Premium Dry Fruits & Garnish Supplies') THEN
    INSERT INTO vendors (
      vendor_name, 
      contact_person, 
      phone_number, 
      email, 
      address, 
      categories
    ) VALUES (
      'Premium Dry Fruits & Garnish Supplies',
      'Vikram Singh',
      '9876543211',
      'vikram@premiumgarnish.com',
      '123 Market Street, Mumbai, Maharashtra 400001',
      ARRAY['Nuts & Dry Fruits, Flavour & Garnish']
    );
  END IF;
END $$;