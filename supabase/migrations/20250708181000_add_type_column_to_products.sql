-- Migration: Add 'type' column to 'products' table to identify single products and combos
ALTER TABLE products ADD COLUMN IF NOT EXISTS type text; 