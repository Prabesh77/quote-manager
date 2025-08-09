-- Migration: Add quote_ref column to quotes table
-- This allows storing the user-provided quote reference instead of auto-generating it

-- Step 1: Add the quote_ref column
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS quote_ref TEXT;

-- Step 2: Create unique index on quote_ref for fast lookups and prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotes_quote_ref ON quotes(quote_ref) WHERE quote_ref IS NOT NULL;

-- Step 3: Update existing quotes with generated quote_ref (optional - for existing data)
-- You can run this if you have existing quotes without quote_ref
-- UPDATE quotes SET quote_ref = 'Q' || SUBSTRING(id::text, 1, 8) WHERE quote_ref IS NULL;

-- Verification query (run this to check the migration):
-- SELECT id, quote_ref, created_at FROM quotes ORDER BY created_at DESC LIMIT 5; 