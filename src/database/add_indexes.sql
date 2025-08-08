-- Add indexes for better performance in normalized quote creation

-- Index for customer name lookups
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- Index for vehicle lookups (VIN is unique, make/model/year combination)
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);
CREATE INDEX IF NOT EXISTS idx_vehicles_make_model ON vehicles(make, model);
CREATE INDEX IF NOT EXISTS idx_vehicles_make_model_year ON vehicles(make, model, year);

-- Index for parts lookups (vehicle_id + part_name combination)
CREATE INDEX IF NOT EXISTS idx_parts_vehicle_name ON parts(vehicle_id, part_name);

-- Index for quote_parts lookups
CREATE INDEX IF NOT EXISTS idx_quote_parts_quote_id ON quote_parts(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_parts_part_id ON quote_parts(part_id);

-- Index for quotes lookups
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_vehicle_id ON quotes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);

-- Add unique constraints to prevent duplicates
-- Note: These might fail if you already have duplicate data

-- Unique constraint for customer name (optional - uncomment if you want unique customer names)
-- ALTER TABLE customers ADD CONSTRAINT unique_customer_name UNIQUE (name);

-- Unique constraint for vehicle VIN (optional - uncomment if you want unique VINs)
-- ALTER TABLE vehicles ADD CONSTRAINT unique_vehicle_vin UNIQUE (vin);

-- Unique constraint for part name per vehicle (optional - uncomment if you want unique part names per vehicle)
-- ALTER TABLE parts ADD CONSTRAINT unique_part_per_vehicle UNIQUE (vehicle_id, part_name); 