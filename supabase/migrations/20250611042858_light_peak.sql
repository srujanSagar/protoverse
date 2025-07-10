/*
  # Clean up existing orders for testing

  1. Database Cleanup
    - Delete all existing order items
    - Delete all existing orders
    - Delete all existing customers (optional - for clean slate)

  2. Notes
    - This will remove all test data
    - Foreign key constraints will be handled by CASCADE delete
*/

-- Delete all order items (will be deleted automatically due to CASCADE)
-- Delete all orders
DELETE FROM orders;

-- Delete all customers (optional - uncomment if you want to start completely fresh)
-- DELETE FROM customers;