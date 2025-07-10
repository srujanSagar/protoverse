/*
  # Add payment_type column to orders table

  1. Schema Changes
    - Add `payment_type` column to `orders` table
    - Column will store payment method: 'cash', 'card', or 'upi'
    - Default to 'cash' for existing orders

  2. Notes
    - Uses CHECK constraint to ensure only valid payment types
    - Existing orders will have 'cash' as default payment type
*/

-- Add payment_type column to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_type'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_type text DEFAULT 'cash' CHECK (payment_type IN ('cash', 'card', 'upi'));
  END IF;
END $$;

-- Update existing orders to have 'cash' as payment type (if any exist)
UPDATE orders SET payment_type = 'cash' WHERE payment_type IS NULL;