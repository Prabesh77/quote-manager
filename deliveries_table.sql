-- Create deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  tax_invoice_number TEXT NOT NULL,
  receiver_name TEXT NOT NULL,
  photo_proof TEXT,
  signature TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'delivered' CHECK (status IN ('delivered', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_deliveries_delivered_at ON deliveries(delivered_at DESC);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);

-- Enable Row Level Security (RLS)
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Public read access for deliveries" ON deliveries
  FOR SELECT USING (true);

-- Create policy to allow public insert
CREATE POLICY "Public insert deliveries" ON deliveries
  FOR INSERT WITH CHECK (true);

-- Create policy to allow public update
CREATE POLICY "Public update deliveries" ON deliveries
  FOR UPDATE USING (true);

-- Create policy to allow public delete
CREATE POLICY "Public delete deliveries" ON deliveries
  FOR DELETE USING (true); 