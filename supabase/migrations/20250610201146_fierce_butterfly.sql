/*
  # Add images column to menu_items table

  1. Schema Changes
    - Add `images` column to `menu_items` table
    - Column will store an array of image URLs (text[])
    - Default to empty array for existing items

  2. Notes
    - Uses PostgreSQL array type to support multiple images per menu item
    - Existing menu items will have empty image arrays by default
    - New items can include image URLs when inserted
*/

-- Add images column to menu_items table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'menu_items' AND column_name = 'images'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN images text[] DEFAULT '{}';
  END IF;
END $$;

-- Update existing menu items with sample image URLs (optional)
-- You can remove this section if you don't want sample images
UPDATE menu_items SET images = ARRAY['https://images.pexels.com/photos/106343/pexels-photo-106343.jpeg'] WHERE name = 'Grilled Chicken Breast';
UPDATE menu_items SET images = ARRAY['https://images.pexels.com/photos/361184/asparagus-steak-veal-steak-veal-361184.jpeg'] WHERE name = 'Beef Steak';
UPDATE menu_items SET images = ARRAY['https://images.pexels.com/photos/725991/pexels-photo-725991.jpeg'] WHERE name = 'Salmon Fillet';
UPDATE menu_items SET images = ARRAY['https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg'] WHERE name = 'Vegetarian Pasta';
UPDATE menu_items SET images = ARRAY['https://images.pexels.com/photos/2097090/pexels-photo-2097090.jpeg'] WHERE name = 'Caesar Salad';
UPDATE menu_items SET images = ARRAY['https://images.pexels.com/photos/60616/fried-chicken-chicken-fried-crunchy-60616.jpeg'] WHERE name = 'Chicken Wings';
UPDATE menu_items SET images = ARRAY['https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg'] WHERE name = 'Mozzarella Sticks';
UPDATE menu_items SET images = ARRAY['https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg'] WHERE name = 'Coca Cola';
UPDATE menu_items SET images = ARRAY['https://images.pexels.com/photos/96974/pexels-photo-96974.jpeg'] WHERE name = 'Fresh Orange Juice';
UPDATE menu_items SET images = ARRAY['https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg'] WHERE name = 'Coffee';
UPDATE menu_items SET images = ARRAY['https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg'] WHERE name = 'Chocolate Cake';
UPDATE menu_items SET images = ARRAY['https://images.pexels.com/photos/1352278/pexels-photo-1352278.jpeg'] WHERE name = 'Ice Cream Sundae';