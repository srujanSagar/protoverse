/*
  # Update menu items with correct image and currency changes

  1. Changes
    - Update Kataifi Cream Cheese image URL
    - All menu items now use rupee pricing (no database changes needed as prices are stored as numbers)
    
  2. Notes
    - The UI will be updated to display ₹ instead of $ symbol
    - Descriptions will be hidden from the UI components
*/

-- Update the Kataifi Cream Cheese image
UPDATE menu_items 
SET images = ARRAY['https://ik.imagekit.io/8aj6efzgu/Kunafa%20Kingdom/kataifi_cream_cheese.png?updatedAt=1749615339154']
WHERE name = 'Kataifi Cream Cheese Kunafa';