-- Add transmission column to vehicles table
-- This migration adds the transmission field to store auto/manual information

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS transmission TEXT;

-- Update existing vehicles to have a default transmission value
-- You can customize this based on your data
UPDATE vehicles SET transmission = 'auto' WHERE transmission IS NULL; 