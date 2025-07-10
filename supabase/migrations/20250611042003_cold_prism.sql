/*
  # Replace menu items with Middle Eastern desserts

  1. Changes
    - Safely replace existing menu items with new Middle Eastern dessert menu
    - Handle foreign key constraints by updating existing items instead of deleting
    - Add new items if needed
    - Deactivate any extra items

  2. New Menu Items
    - Kunafa Chocolate (₹349)
    - Nutella Cream Cheese Kunafa (₹349)
    - Kataifi Cream Cheese Kunafa (₹379)
    - Mixed Dry-Fruit Baklava (₹449)
    - Pista Finger Baklava (₹399)
    - Triangle Baklava (₹399)
    - Almond Basbousa (₹299)
    - Cashew Basbousa (₹299)
*/

-- First, deactivate all existing menu items
UPDATE menu_items SET is_active = false;

-- Get the existing menu item IDs (we'll reuse them to avoid foreign key issues)
DO $$
DECLARE
    existing_ids uuid[];
    new_items jsonb := '[
        {"name": "Kunafa Chocolate", "price": 349.00, "category": "Chocolate", "description": "Rich chocolate kunafa with crispy kataifi pastry", "image": "https://ik.imagekit.io/8aj6efzgu/Kunafa%20Kingdom/kunafa_chocoalte.png?updatedAt=1749615181751"},
        {"name": "Nutella Cream Cheese Kunafa", "price": 349.00, "category": "Kunafa", "description": "Creamy kunafa with Nutella and cream cheese filling", "image": "https://ik.imagekit.io/8aj6efzgu/Kunafa%20Kingdom/nutella_cream_cheese.png?updatedAt=1749615339131"},
        {"name": "Kataifi Cream Cheese Kunafa", "price": 379.00, "category": "Kunafa", "description": "Traditional kataifi pastry with rich cream cheese", "image": "https://images.pexels.com/photos/1099680/pexels-photo-1099680.jpeg"},
        {"name": "Mixed Dry-Fruit Baklava", "price": 449.00, "category": "Baklava", "description": "Layered phyllo pastry with mixed dry fruits and honey", "image": "https://ik.imagekit.io/8aj6efzgu/Kunafa%20Kingdom/mixed_baklava_3.png?updatedAt=1749615181926"},
        {"name": "Pista Finger Baklava", "price": 399.00, "category": "Baklava", "description": "Finger-shaped baklava filled with premium pistachios", "image": "https://ik.imagekit.io/8aj6efzgu/Kunafa%20Kingdom/pista_finger_baklava.png?updatedAt=1749615181832"},
        {"name": "Triangle Baklava", "price": 399.00, "category": "Baklava", "description": "Triangle-shaped baklava with nuts and sweet syrup", "image": "https://ik.imagekit.io/8aj6efzgu/Kunafa%20Kingdom/triangle_baklava.png?updatedAt=1749615181624"},
        {"name": "Almond Basbousa", "price": 299.00, "category": "Basbousa", "description": "Semolina cake soaked in syrup with almonds", "image": "https://ik.imagekit.io/8aj6efzgu/Kunafa%20Kingdom/almond_basbousa.png?updatedAt=1749615180749"},
        {"name": "Cashew Basbousa", "price": 299.00, "category": "Basbousa", "description": "Semolina cake soaked in syrup with cashews", "image": "https://ik.imagekit.io/8aj6efzgu/Kunafa%20Kingdom/cashew_basbousa.png?updatedAt=1749615181922"}
    ]'::jsonb;
    item jsonb;
    counter int := 0;
    current_id uuid;
BEGIN
    -- Get existing menu item IDs
    SELECT array_agg(id ORDER BY created_at) INTO existing_ids FROM menu_items;
    
    -- Update existing items with new data or insert new ones
    FOR item IN SELECT * FROM jsonb_array_elements(new_items)
    LOOP
        counter := counter + 1;
        
        -- If we have an existing ID, update it; otherwise insert new
        IF counter <= array_length(existing_ids, 1) THEN
            current_id := existing_ids[counter];
            
            UPDATE menu_items 
            SET 
                name = item->>'name',
                price = (item->>'price')::decimal(10,2),
                category = item->>'category',
                description = item->>'description',
                images = ARRAY[item->>'image'],
                is_active = true
            WHERE id = current_id;
        ELSE
            -- Insert new item if we need more than existing count
            INSERT INTO menu_items (name, price, category, description, images, is_active)
            VALUES (
                item->>'name',
                (item->>'price')::decimal(10,2),
                item->>'category',
                item->>'description',
                ARRAY[item->>'image'],
                true
            );
        END IF;
    END LOOP;
END $$;