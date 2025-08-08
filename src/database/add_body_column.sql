-- Add body column to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS body TEXT;

-- Add index for body column for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_body ON vehicles(body); 