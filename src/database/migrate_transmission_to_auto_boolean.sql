-- Migration: Convert transmission column to auto boolean column
-- This migration changes the vehicles table from TEXT transmission to BOOLEAN auto

-- Step 1: Add the new auto column as boolean
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS auto BOOLEAN;

-- Step 2: Migrate existing data from transmission to auto
-- Set auto = true where transmission = 'auto', false where transmission = 'manual'
UPDATE vehicles 
SET auto = CASE 
  WHEN transmission = 'auto' THEN true
  WHEN transmission = 'manual' THEN false
  ELSE null -- Handle any unexpected values
END
WHERE auto IS NULL;

-- Step 3: Add a default value for auto column (optional - you can set to true for auto as default)
ALTER TABLE vehicles ALTER COLUMN auto SET DEFAULT true;

-- Step 4: Remove the old transmission column (uncomment after verifying the migration works)
-- ALTER TABLE vehicles DROP COLUMN IF EXISTS transmission;

-- Step 5: Add index for the new auto column for better query performance
CREATE INDEX IF NOT EXISTS idx_vehicles_auto ON vehicles(auto);

-- Verification query (run this to check the migration):
-- SELECT transmission, auto, COUNT(*) 
-- FROM vehicles 
-- GROUP BY transmission, auto 
-- ORDER BY transmission, auto; 