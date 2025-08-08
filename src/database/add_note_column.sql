-- Add missing note column to parts table
-- This script adds the note column that the application expects

-- Add note column to parts table if it doesn't exist
ALTER TABLE parts ADD COLUMN IF NOT EXISTS note TEXT;

-- Add note column to parts table if it doesn't exist (alternative name)
ALTER TABLE parts ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update existing parts to have empty note if null
UPDATE parts SET note = '' WHERE note IS NULL;

-- Create index on note column for better performance
CREATE INDEX IF NOT EXISTS idx_parts_note ON parts(note);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'parts' 
AND column_name IN ('note', 'notes')
ORDER BY column_name; 