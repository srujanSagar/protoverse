-- Migration: Add add_ons column to products table for add-ons feature
ALTER TABLE products ADD COLUMN IF NOT EXISTS add_ons jsonb; 