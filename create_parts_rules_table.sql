-- Create parts_rules table for storing brand-part availability rules
CREATE TABLE IF NOT EXISTS parts_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('required_for', 'not_required_for', 'none')),
    brands TEXT[] DEFAULT '{}', -- Array of brand names
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Ensure unique combination of part_name
    UNIQUE(part_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_parts_rules_part_name ON parts_rules(part_name);
CREATE INDEX IF NOT EXISTS idx_parts_rules_rule_type ON parts_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_parts_rules_brands ON parts_rules USING GIN(brands);

-- Add RLS (Row Level Security) policies
ALTER TABLE parts_rules ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read all parts rules
CREATE POLICY "Users can read parts rules" ON parts_rules
    FOR SELECT USING (true);

-- Policy: Only admins can insert/update/delete parts rules
CREATE POLICY "Admins can manage parts rules" ON parts_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_parts_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_parts_rules_updated_at
    BEFORE UPDATE ON parts_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_parts_rules_updated_at();

-- Insert initial data from existing brandPartRules.ts
INSERT INTO parts_rules (part_name, rule_type, brands, description, created_by) VALUES
    ('Radiator', 'none', '{}', 'Available for all brands', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Condenser', 'none', '{}', 'Available for all brands', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Fan Assembly', 'none', '{}', 'Available for all brands', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Intercooler', 'not_required_for', '{"Subaru"}', 'Not required for Subaru', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Left Intercooler', 'required_for', '{"Mercedes", "Land Rover", "BMW"}', 'Required for Mercedes, Land Rover, and BMW', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Right Intercooler', 'required_for', '{"Mercedes", "Land Rover", "BMW"}', 'Required for Mercedes, Land Rover, and BMW', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Add Cooler', 'required_for', '{"Mercedes", "Land Rover", "BMW"}', 'Required for Mercedes, Land Rover, and BMW', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Left Headlamp', 'none', '{}', 'Available for all brands', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Right Headlamp', 'none', '{}', 'Available for all brands', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Left DayLight', 'none', '{}', 'Available for all brands', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Right DayLight', 'none', '{}', 'Available for all brands', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Oil Cooler', 'not_required_for', '{"Subaru"}', 'Not required for Subaru', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Auxiliary Radiator', 'not_required_for', '{"Nissan", "Toyota"}', 'Not required for Nissan and Toyota', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Camera', 'none', '{}', 'Available for all brands', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Parking Sensor', 'none', '{}', 'Available for all brands', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Left Blindspot Sensor', 'none', '{}', 'Available for all brands', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Right Blindspot Sensor', 'none', '{}', 'Available for all brands', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1)),
    ('Radar Sensor', 'none', '{}', 'Available for all brands', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1))
ON CONFLICT (part_name) DO NOTHING;

COMMENT ON TABLE parts_rules IS 'Stores brand-part availability rules for the automotive parts system';
COMMENT ON COLUMN parts_rules.part_name IS 'Name of the automotive part';
COMMENT ON COLUMN parts_rules.rule_type IS 'Type of rule: required_for, not_required_for, or none';
COMMENT ON COLUMN parts_rules.brands IS 'Array of brand names affected by this rule';
COMMENT ON COLUMN parts_rules.description IS 'Human-readable description of the rule';
