-- Add last_prices column to parts table to track price history
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE parts 
ADD COLUMN IF NOT EXISTS last_prices JSONB DEFAULT '{"price_history": []}'::jsonb;

-- Add an index for faster queries
CREATE INDEX IF NOT EXISTS idx_parts_last_prices ON parts USING gin(last_prices);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'parts' AND column_name = 'last_prices';

