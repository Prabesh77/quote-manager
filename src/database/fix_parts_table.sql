-- Fix parts table to match application requirements
-- This script ensures all required columns exist in the parts table

-- Check current parts table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'parts' 
ORDER BY column_name;

-- Add missing columns if they don't exist

-- 1. Add note column (application expects this)
ALTER TABLE parts ADD COLUMN IF NOT EXISTS note TEXT DEFAULT '';

-- 2. Add price column if missing (application expects this)
ALTER TABLE parts ADD COLUMN IF NOT EXISTS price NUMERIC(10,2);

-- 3. Add created_at column if missing (application expects createdAt)
ALTER TABLE parts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Add updated_at column if missing
ALTER TABLE parts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. Ensure part_name column exists (database column for 'name' field)
ALTER TABLE parts ADD COLUMN IF NOT EXISTS part_name TEXT;

-- 6. Ensure part_number column exists (database column for 'number' field)
ALTER TABLE parts ADD COLUMN IF NOT EXISTS part_number TEXT;

-- Update existing records to have proper values
UPDATE parts SET note = '' WHERE note IS NULL;
UPDATE parts SET price = 0 WHERE price IS NULL;
UPDATE parts SET created_at = NOW() WHERE created_at IS NULL;
UPDATE parts SET updated_at = NOW() WHERE updated_at IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_parts_note ON parts(note);
CREATE INDEX IF NOT EXISTS idx_parts_price ON parts(price);
CREATE INDEX IF NOT EXISTS idx_parts_created_at ON parts(created_at);
CREATE INDEX IF NOT EXISTS idx_parts_part_name ON parts(part_name);
CREATE INDEX IF NOT EXISTS idx_parts_part_number ON parts(part_number);

-- Verify the final structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'parts' 
ORDER BY column_name;

-- Show sample data to verify structure
SELECT * FROM parts LIMIT 3; 