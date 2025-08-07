-- Migration Script: Old Structure to New Normalized Structure
-- Run this after creating the new schema to migrate existing data

-- Step 1: Migrate customers from old quotes table
INSERT INTO customers (name, phone, address, created_at, updated_at)
SELECT DISTINCT 
  customer as name,
  phone,
  address,
  MIN(created_at) as created_at,
  MAX(updated_at) as updated_at
FROM quotes 
WHERE customer IS NOT NULL AND customer != ''
GROUP BY customer, phone, address;

-- Step 2: Migrate vehicles from old quotes table
INSERT INTO vehicles (rego, make, model, series, year, vin, color, notes, created_at, updated_at)
SELECT DISTINCT 
  rego,
  make,
  model,
  series,
  CASE 
    WHEN mthyr ~ '^\d{4}$' THEN CAST(mthyr AS INTEGER)
    ELSE NULL 
  END as year,
  vin,
  NULL as color, -- Not in old structure
  NULL as notes, -- Not in old structure
  MIN(created_at) as created_at,
  MAX(updated_at) as updated_at
FROM quotes 
WHERE make IS NOT NULL AND model IS NOT NULL
GROUP BY rego, make, model, series, mthyr, vin;

-- Step 3: Migrate quotes to new structure
INSERT INTO quotes (customer_id, vehicle_id, status, notes, tax_invoice_number, created_at, updated_at)
SELECT 
  c.id as customer_id,
  v.id as vehicle_id,
  q.status,
  q.notes,
  q.tax_invoice_number,
  q.created_at,
  q.updated_at
FROM quotes q
LEFT JOIN customers c ON q.customer = c.name
LEFT JOIN vehicles v ON q.make = v.make AND q.model = v.model AND q.vin = v.vin
WHERE c.id IS NOT NULL AND v.id IS NOT NULL;

-- Step 4: Migrate parts from old parts table
INSERT INTO parts (vehicle_id, part_name, part_number, price, created_at, updated_at)
SELECT 
  v.id as vehicle_id,
  p.name as part_name,
  p.number as part_number,
  p.price,
  p.created_at,
  p.updated_at
FROM parts p
JOIN quotes q ON p.id = ANY(string_to_array(q.part_requested, ',')::uuid[])
JOIN vehicles v ON q.make = v.make AND q.model = v.model AND q.vin = v.vin
WHERE v.id IS NOT NULL;

-- Step 5: Create quote_parts relationships
INSERT INTO quote_parts (quote_id, part_id, final_price, note, status, created_at, updated_at)
SELECT 
  new_q.id as quote_id,
  new_p.id as part_id,
  new_p.price as final_price,
  new_p.note,
  CASE 
    WHEN new_q.status = 'priced' THEN 'Priced'
    WHEN new_q.status = 'ordered' THEN 'Ordered'
    ELSE 'WaitingForPrice'
  END as status,
  new_p.created_at,
  new_p.updated_at
FROM quotes old_q
JOIN quotes new_q ON old_q.quote_ref = new_q.quote_ref
JOIN parts old_p ON old_p.id = ANY(string_to_array(old_q.part_requested, ',')::uuid[])
JOIN parts new_p ON old_p.name = new_p.part_name AND old_p.number = new_p.part_number
WHERE new_q.id IS NOT NULL AND new_p.id IS NOT NULL;

-- Step 6: Migrate deliveries (if they exist in old structure)
-- This assumes you have an old deliveries table or delivery data in quotes
INSERT INTO deliveries (quote_id, receiver_name, photo_path, signature_path, delivered_on, delivered_by, created_at, updated_at)
SELECT 
  new_q.id as quote_id,
  NULL as receiver_name, -- Not in old structure
  NULL as photo_path, -- Not in old structure
  NULL as signature_path, -- Not in old structure
  NULL as delivered_on, -- Not in old structure
  NULL as delivered_by, -- Not in old structure
  old_q.created_at,
  old_q.updated_at
FROM quotes old_q
JOIN quotes new_q ON old_q.quote_ref = new_q.quote_ref
WHERE old_q.status = 'delivered';

-- Step 7: Update quote statuses based on quote_parts
UPDATE quotes 
SET status = 'priced'
WHERE id IN (
  SELECT DISTINCT quote_id 
  FROM quote_parts 
  WHERE status = 'Priced'
);

UPDATE quotes 
SET status = 'ordered'
WHERE id IN (
  SELECT DISTINCT quote_id 
  FROM quote_parts 
  WHERE status = 'Ordered'
);

-- Step 8: Clean up old tables (optional - backup first!)
-- DROP TABLE IF EXISTS old_quotes;
-- DROP TABLE IF EXISTS old_parts;
-- DROP TABLE IF EXISTS old_deliveries;

-- Verification queries
SELECT 'Customers migrated:' as info, COUNT(*) as count FROM customers;
SELECT 'Vehicles migrated:' as info, COUNT(*) as count FROM vehicles;
SELECT 'Quotes migrated:' as info, COUNT(*) as count FROM quotes;
SELECT 'Parts migrated:' as info, COUNT(*) as count FROM parts;
SELECT 'Quote parts created:' as info, COUNT(*) as count FROM quote_parts;
SELECT 'Deliveries migrated:' as info, COUNT(*) as count FROM deliveries;

-- Check for any orphaned records
SELECT 'Orphaned quotes (no customer):' as info, COUNT(*) as count 
FROM quotes q 
LEFT JOIN customers c ON q.customer_id = c.id 
WHERE c.id IS NULL;

SELECT 'Orphaned quotes (no vehicle):' as info, COUNT(*) as count 
FROM quotes q 
LEFT JOIN vehicles v ON q.vehicle_id = v.id 
WHERE v.id IS NULL; 