-- Add 'wrong' status to quotes table
-- This allows quotes to be marked as wrong and returned to the creator

-- Drop the existing check constraint
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;

-- Add the new check constraint with 'wrong' status included
ALTER TABLE quotes ADD CONSTRAINT quotes_status_check 
  CHECK (status IN ('unpriced', 'waiting_verification', 'priced', 'completed', 'ordered', 'delivered', 'wrong'));

-- Create index for the new status (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_quotes_wrong ON quotes(status) WHERE status = 'wrong';

-- Add created_by column to track who created each quote
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add index for created_by column for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_created_by ON quotes(created_by);

-- Create a function to automatically set created_by when a quote is created
CREATE OR REPLACE FUNCTION set_quote_created_by()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set created_by if it's not already set
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set created_by
CREATE TRIGGER set_quote_created_by_trigger
  BEFORE INSERT ON quotes
  FOR EACH ROW EXECUTE FUNCTION set_quote_created_by();
