-- Add settlement column to quotes table
-- This script adds a settlement percentage field to the quotes table
-- Default value is 0 for existing records

ALTER TABLE quotes 
ADD COLUMN settlement DECIMAL(5,2) DEFAULT 0;

-- Add comment to document the field
COMMENT ON COLUMN quotes.settlement IS 'Settlement percentage (0-100)';
