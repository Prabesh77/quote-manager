-- Add isOpen column to quotes table for tracking accordion state
-- This allows server-side tracking of which quotes are currently being worked on

-- Add isOpen column to track accordion open/close state
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS is_open BOOLEAN DEFAULT FALSE;

-- Add opened_by column to track which user opened the quote
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS opened_by UUID REFERENCES auth.users(id);

-- Add opened_at column to track when the quote was opened
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE;

-- Add index for isOpen column for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_is_open ON quotes(is_open);

-- Add index for opened_by column for better performance
CREATE INDEX IF NOT EXISTS idx_quotes_opened_by ON quotes(opened_by);

-- Create a function to automatically set opened_by when a quote is opened
CREATE OR REPLACE FUNCTION set_quote_opened_by()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set opened_by if the quote is being opened (is_open changed from false to true)
  IF OLD.is_open = FALSE AND NEW.is_open = TRUE THEN
    NEW.opened_by = auth.uid();
    NEW.opened_at = NOW();
  -- Clear opened_by if the quote is being closed
  ELSIF OLD.is_open = TRUE AND NEW.is_open = FALSE THEN
    NEW.opened_by = NULL;
    NEW.opened_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set opened_by when quote is opened/closed
CREATE TRIGGER set_quote_opened_by_trigger
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION set_quote_opened_by();
