-- Update parts_rules table with comprehensive real-world rules
-- This script updates the database with the rules from brandPartRules.ts

-- Clear existing rules (optional - comment out if you want to keep existing data)
-- DELETE FROM parts_rules;

-- Insert/Update comprehensive parts rules
-- Using UPSERT (INSERT ... ON CONFLICT) to handle existing records

-- Fan Assembly Requirements
INSERT INTO parts_rules (part_name, rule_type, brands, description, created_by) VALUES
    ('Fan Assembly', 'required_for', '{"Holden", "Nissan", "Kia", "Hyundai", "Mazda"}', 'Required for Holden (Captiva), Nissan (X-Trail, Navara), Kia, Hyundai, Mazda', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1))
ON CONFLICT (part_name) DO UPDATE SET
    rule_type = EXCLUDED.rule_type,
    brands = EXCLUDED.brands,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Oil Cooler Requirements
INSERT INTO parts_rules (part_name, rule_type, brands, description, created_by) VALUES
    ('Oil Cooler', 'not_required_for', '{"Subaru"}', 'Subaru models do not require an oil cooler', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1))
ON CONFLICT (part_name) DO UPDATE SET
    rule_type = EXCLUDED.rule_type,
    brands = EXCLUDED.brands,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Headlamp Requirements
INSERT INTO parts_rules (part_name, rule_type, brands, description, created_by) VALUES
    ('Left Headlamp', 'required_for', '{"Holden", "Ford"}', 'Holden (Colorado, Trailblazer, Astra) and Ford (Everest, Ranger, Fiesta) only', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Right Headlamp', 'required_for', '{"Holden", "Ford"}', 'Holden (Colorado, Trailblazer, Astra) and Ford (Everest, Ranger, Fiesta) only', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1))
ON CONFLICT (part_name) DO UPDATE SET
    rule_type = EXCLUDED.rule_type,
    brands = EXCLUDED.brands,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Front Grille Camera Requirements
INSERT INTO parts_rules (part_name, rule_type, brands, description, created_by) VALUES
    ('Camera', 'required_for', '{"Volkswagen", "Skoda", "Seat", "Cupra", "Audi", "BMW", "MG", "LDV", "Ssang Yong"}', 'Front Grille Camera required (not windscreen-mounted camera)', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1))
ON CONFLICT (part_name) DO UPDATE SET
    rule_type = EXCLUDED.rule_type,
    brands = EXCLUDED.brands,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Parking Sensor Requirements
INSERT INTO parts_rules (part_name, rule_type, brands, description, created_by) VALUES
    ('Parking Sensor', 'required_for', '{"Mitsubishi", "Nissan"}', 'Required for Mitsubishi and Nissan', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1))
ON CONFLICT (part_name) DO UPDATE SET
    rule_type = EXCLUDED.rule_type,
    brands = EXCLUDED.brands,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Blind Spot Sensors Requirements
INSERT INTO parts_rules (part_name, rule_type, brands, description, created_by) VALUES
    ('Left Blindspot Sensor', 'required_for', '{"Hyundai", "Kia", "Volkswagen", "Skoda", "Seat", "Cupra", "Audi", "BMW"}', 'Front & Rear Blind Spot Sensors required', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Right Blindspot Sensor', 'required_for', '{"Hyundai", "Kia", "Volkswagen", "Skoda", "Seat", "Cupra", "Audi", "BMW"}', 'Front & Rear Blind Spot Sensors required', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1))
ON CONFLICT (part_name) DO UPDATE SET
    rule_type = EXCLUDED.rule_type,
    brands = EXCLUDED.brands,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Daytime Headlamp Requirements
INSERT INTO parts_rules (part_name, rule_type, brands, description, created_by) VALUES
    ('Left DayLight', 'required_for', '{"Nissan", "Hyundai", "Kia", "Genesis", "Mitsubishi"}', 'Daytime Headlamp required', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Right DayLight', 'required_for', '{"Nissan", "Hyundai", "Kia", "Genesis", "Mitsubishi"}', 'Daytime Headlamp required', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1))
ON CONFLICT (part_name) DO UPDATE SET
    rule_type = EXCLUDED.rule_type,
    brands = EXCLUDED.brands,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Add cooler, left intercooler, right intercooler for specific brands
INSERT INTO parts_rules (part_name, rule_type, brands, description, created_by) VALUES
    ('Add Cooler', 'required_for', '{"Mercedes", "BMW", "Volkswagen", "Land Rover", "Audi"}', 'Required for Mercedes, BMW, Volkswagen, Land Rover, Audi. Not required for Subaru', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Left Intercooler', 'required_for', '{"Mercedes", "BMW", "Volkswagen", "Land Rover", "Audi"}', 'Required for Mercedes, BMW, Volkswagen, Land Rover, Audi. Not required for Subaru', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Right Intercooler', 'required_for', '{"Mercedes", "BMW", "Volkswagen", "Land Rover", "Audi"}', 'Required for Mercedes, BMW, Volkswagen, Land Rover, Audi. Not required for Subaru', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1))
ON CONFLICT (part_name) DO UPDATE SET
    rule_type = EXCLUDED.rule_type,
    brands = EXCLUDED.brands,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Auxiliary Radiator (keeping existing rule)
INSERT INTO parts_rules (part_name, rule_type, brands, description, created_by) VALUES
    ('Auxiliary Radiator', 'required_for', '{"Land Rover", "Mercedes", "Audi", "BMW", "Volkswagen", "Porsche", "Volvo", "Jaguar"}', 'Required for European luxury brands', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1))
ON CONFLICT (part_name) DO UPDATE SET
    rule_type = EXCLUDED.rule_type,
    brands = EXCLUDED.brands,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Set remaining parts to 'none' (allow all brands) if they don't have specific rules
INSERT INTO parts_rules (part_name, rule_type, brands, description, created_by) VALUES
    ('Radiator', 'none', '{}', 'Available for all brands', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Condenser', 'none', '{}', 'Available for all brands', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Fan', 'none', '{}', 'Available for all brands', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Grille', 'none', '{}', 'Available for all brands', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Bumper', 'none', '{}', 'Available for all brands', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Radar Sensor', 'none', '{}', 'Available for all brands', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1))
ON CONFLICT (part_name) DO UPDATE SET
    rule_type = EXCLUDED.rule_type,
    brands = EXCLUDED.brands,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Display the updated rules
SELECT 
    part_name,
    rule_type,
    brands,
    description,
    created_at,
    updated_at
FROM parts_rules 
ORDER BY part_name;
