-- Remove status column from quote_parts table
-- We decided to use quote-level status instead of part-level status

-- Remove the status column if it exists
ALTER TABLE quote_parts DROP COLUMN IF EXISTS status;

-- Remove the status index if it exists
DROP INDEX IF EXISTS idx_quote_parts_status;

-- Verify the column was removed
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'quote_parts' 
ORDER BY column_name; 