-- Add requiredBy column to quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS required_by TEXT;

-- Add index for required_by column for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_required_by ON quotes(required_by); 