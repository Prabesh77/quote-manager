-- Add body column to vehicles table
-- This migration adds the body field to store vehicle body type information

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS body TEXT;

-- Add index for body column for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_body ON vehicles(body); 