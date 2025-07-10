/*
  # Add new fields to raw_materials table

  1. Schema Changes
    - Add `secondary_unit_of_measurement` column to `raw_materials` table
    - Add `conversion_factor` column to `raw_materials` table
    - Add `reorder_point` column to `raw_materials` table
    - Add `storage_requirements` column to `raw_materials` table
    - Add `nutritional_info` column to `raw_materials` table
    - Add `regulatory_certifications` column to `raw_materials` table
    - Add `notes` column to `raw_materials` table

  2. Notes
    - These fields support the enhanced raw materials form
    - All fields are optional to maintain backward compatibility
*/

-- Add new columns to raw_materials table if they don't exist
DO $$
BEGIN
  -- Secondary Unit of Measurement
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'raw_materials' AND column_name = 'secondary_unit_of_measurement'
  ) THEN
    ALTER TABLE raw_materials ADD COLUMN secondary_unit_of_measurement text;
  END IF;

  -- Conversion Factor
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'raw_materials' AND column_name = 'conversion_factor'
  ) THEN
    ALTER TABLE raw_materials ADD COLUMN conversion_factor decimal(10,2);
  END IF;

  -- Reorder Point
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'raw_materials' AND column_name = 'reorder_point'
  ) THEN
    ALTER TABLE raw_materials ADD COLUMN reorder_point integer;
  END IF;

  -- Storage Requirements
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'raw_materials' AND column_name = 'storage_requirements'
  ) THEN
    ALTER TABLE raw_materials ADD COLUMN storage_requirements text;
  END IF;

  -- Nutritional Info
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'raw_materials' AND column_name = 'nutritional_info'
  ) THEN
    ALTER TABLE raw_materials ADD COLUMN nutritional_info text;
  END IF;

  -- Regulatory Certifications
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'raw_materials' AND column_name = 'regulatory_certifications'
  ) THEN
    ALTER TABLE raw_materials ADD COLUMN regulatory_certifications text;
  END IF;

  -- Notes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'raw_materials' AND column_name = 'notes'
  ) THEN
    ALTER TABLE raw_materials ADD COLUMN notes text;
  END IF;
END $$;