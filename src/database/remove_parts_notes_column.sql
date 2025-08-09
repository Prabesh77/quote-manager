-- Remove notes columns from parts table
-- Notes are now stored in quote_parts table as they are quote-specific

-- Remove both possible notes columns
ALTER TABLE parts DROP COLUMN IF EXISTS note;
ALTER TABLE parts DROP COLUMN IF EXISTS notes;

-- Remove any indexes on the notes columns
DROP INDEX IF EXISTS idx_parts_note;
DROP INDEX IF EXISTS idx_parts_notes;

-- Verify the columns were removed
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'parts' 
ORDER BY column_name; 