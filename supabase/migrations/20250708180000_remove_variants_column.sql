-- Migration: Remove 'variants' column from 'products' table
ALTER TABLE products DROP COLUMN IF EXISTS variants; 