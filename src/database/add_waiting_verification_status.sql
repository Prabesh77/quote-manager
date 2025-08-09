-- Add waiting_verification status to quotes table
-- This allows quotes to transition from unpriced -> waiting_verification -> priced

-- Drop the existing check constraint
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;

-- Add the new check constraint with waiting_verification included
ALTER TABLE quotes ADD CONSTRAINT quotes_status_check 
  CHECK (status IN ('unpriced', 'waiting_verification', 'priced', 'completed', 'ordered', 'delivered'));

-- Create index for the new status (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_quotes_waiting_verification ON quotes(status) WHERE status = 'waiting_verification'; 