-- New Normalized Database Schema
-- This replaces the current denormalized structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 1: Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rego TEXT,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  series TEXT,
  year INTEGER,
  vin TEXT,
  color TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Quotes Table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'unpriced' CHECK (status IN ('unpriced', 'priced', 'completed', 'ordered', 'delivered')),
  notes TEXT,
  tax_invoice_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Parts Table
CREATE TABLE IF NOT EXISTS parts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  part_name TEXT NOT NULL,
  part_number TEXT,
  price NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Quote Parts Table (Junction table)
CREATE TABLE IF NOT EXISTS quote_parts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  final_price NUMERIC(10,2),
  note TEXT,
  status TEXT NOT NULL DEFAULT 'WaitingForPrice' CHECK (status IN ('WaitingForPrice', 'Priced', 'Ordered')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(quote_id, part_id) -- Prevent duplicate parts in same quote
);

-- Step 6: Deliveries Table
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  receiver_name TEXT,
  photo_path TEXT,
  signature_path TEXT,
  delivered_on TIMESTAMP WITH TIME ZONE,
  delivered_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_vehicle_id ON quotes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);
CREATE INDEX IF NOT EXISTS idx_quotes_tax_invoice ON quotes(tax_invoice_number);

CREATE INDEX IF NOT EXISTS idx_vehicles_rego ON vehicles(rego);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);
CREATE INDEX IF NOT EXISTS idx_vehicles_make_model ON vehicles(make, model);

CREATE INDEX IF NOT EXISTS idx_parts_vehicle_id ON parts(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_parts_name ON parts(part_name);
CREATE INDEX IF NOT EXISTS idx_parts_number ON parts(part_number);

CREATE INDEX IF NOT EXISTS idx_quote_parts_quote_id ON quote_parts(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_parts_part_id ON quote_parts(part_id);
CREATE INDEX IF NOT EXISTS idx_quote_parts_status ON quote_parts(status);

CREATE INDEX IF NOT EXISTS idx_deliveries_quote_id ON deliveries(quote_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_delivered_on ON deliveries(delivered_on);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quote_parts_updated_at BEFORE UPDATE ON quote_parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read/write (for now)
CREATE POLICY "Allow all authenticated users" ON customers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users" ON vehicles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users" ON quotes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users" ON parts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users" ON quote_parts FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all authenticated users" ON deliveries FOR ALL USING (auth.role() = 'authenticated');

-- Service role can manage all data
CREATE POLICY "Service role can manage all" ON customers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all" ON vehicles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all" ON quotes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all" ON parts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all" ON quote_parts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage all" ON deliveries FOR ALL USING (auth.role() = 'service_role');

-- Helper function to get quote with all related data
CREATE OR REPLACE FUNCTION get_quote_with_details(quote_uuid UUID)
RETURNS TABLE (
  quote_id UUID,
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  vehicle_rego TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_series TEXT,
  vehicle_year INTEGER,
  vehicle_vin TEXT,
  vehicle_color TEXT,
  vehicle_notes TEXT,
  quote_status TEXT,
  quote_notes TEXT,
  tax_invoice_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id as quote_id,
    c.name as customer_name,
    c.phone as customer_phone,
    c.address as customer_address,
    v.rego as vehicle_rego,
    v.make as vehicle_make,
    v.model as vehicle_model,
    v.series as vehicle_series,
    v.year as vehicle_year,
    v.vin as vehicle_vin,
    v.color as vehicle_color,
    v.notes as vehicle_notes,
    q.status as quote_status,
    q.notes as quote_notes,
    q.tax_invoice_number,
    q.created_at
  FROM quotes q
  JOIN customers c ON q.customer_id = c.id
  JOIN vehicles v ON q.vehicle_id = v.id
  WHERE q.id = quote_uuid;
END;
$$ LANGUAGE plpgsql;

-- Helper function to get quote parts with details
CREATE OR REPLACE FUNCTION get_quote_parts_with_details(quote_uuid UUID)
RETURNS TABLE (
  quote_part_id UUID,
  part_id UUID,
  part_name TEXT,
  part_number TEXT,
  base_price NUMERIC,
  final_price NUMERIC,
  note TEXT,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qp.id as quote_part_id,
    p.id as part_id,
    p.part_name,
    p.part_number,
    p.price as base_price,
    qp.final_price,
    qp.note,
    qp.status
  FROM quote_parts qp
  JOIN parts p ON qp.part_id = p.id
  WHERE qp.quote_id = quote_uuid
  ORDER BY p.part_name;
END;
$$ LANGUAGE plpgsql; 