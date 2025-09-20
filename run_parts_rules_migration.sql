-- Run this script to update the parts_rules table with the new comprehensive rules
-- Make sure you're connected to your Supabase database

-- Execute the migration
\i update_parts_rules_database.sql

-- Verify the results
SELECT 
    'Migration completed successfully!' as status,
    COUNT(*) as total_rules
FROM parts_rules;

-- Show summary by rule type
SELECT 
    rule_type,
    COUNT(*) as count
FROM parts_rules 
GROUP BY rule_type 
ORDER BY rule_type;
