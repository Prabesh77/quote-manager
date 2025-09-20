# Parts Rules Database Migration

This document explains how to update the database with the comprehensive real-world parts rules.

## 📋 Overview

The parts rules system has been updated with comprehensive real-world requirements based on actual automotive industry standards. These rules determine which parts are available/required for different vehicle brands.

## 🗄️ Database Structure

The `parts_rules` table stores brand-part availability rules with the following structure:

- **`part_name`**: Name of the automotive part
- **`rule_type`**: Type of rule (`required_for`, `not_required_for`, `none`)
- **`brands`**: Array of brand names affected by this rule
- **`description`**: Human-readable description of the rule

## 🚀 How to Apply the Migration

### Option 1: Using Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Migration Script**
   - Copy the contents of `update_parts_rules_database.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute

3. **Verify the Results**
   - Check that all rules were inserted/updated successfully
   - Review the summary output

### Option 2: Using psql Command Line

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the migration
\i update_parts_rules_database.sql
```

### Option 3: Using Supabase CLI

```bash
# Run the migration script
supabase db reset --linked
# Or apply specific migration
supabase db push
```

## 📊 Rules Summary

### ✅ Parts with Specific Requirements

| Part Name | Rule Type | Brands | Description |
|-----------|-----------|---------|-------------|
| **Fan Assembly** | `required_for` | Holden, Nissan, Kia, Hyundai, Mazda | Required for specific Asian/Australian brands |
| **Oil Cooler** | `not_required_for` | Subaru | Subaru models don't require oil cooler |
| **Left/Right Headlamp** | `required_for` | Holden, Ford | Only for specific Holden and Ford models |
| **Camera** | `required_for` | Volkswagen, Skoda, Seat, Cupra, Audi, BMW, MG, LDV, Ssang Yong | Front Grille Camera required |
| **Parking Sensor** | `required_for` | Mitsubishi, Nissan | Required for Mitsubishi and Nissan |
| **Left/Right Blindspot Sensor** | `required_for` | Hyundai, Kia, Volkswagen, Skoda, Seat, Cupra, Audi, BMW | Front & Rear Blind Spot Sensors |
| **Left/Right DayLight** | `required_for` | Nissan, Hyundai, Kia, Genesis, Mitsubishi | Daytime Headlamp required |
| **Add Cooler** | `required_for` | Mercedes, BMW, Volkswagen, Land Rover, Audi | Required for European brands |
| **Left/Right Intercooler** | `required_for` | Mercedes, BMW, Volkswagen, Land Rover, Audi | Required for European brands |
| **Auxiliary Radiator** | `required_for` | Land Rover, Mercedes, Audi, BMW, Volkswagen, Porsche, Volvo, Jaguar | European luxury brands |

### 🌐 Parts Available for All Brands

| Part Name | Rule Type | Description |
|-----------|-----------|-------------|
| **Radiator** | `none` | Available for all brands |
| **Condenser** | `none` | Available for all brands |
| **Fan** | `none` | Available for all brands |
| **Grille** | `none` | Available for all brands |
| **Bumper** | `none` | Available for all brands |
| **Radar Sensor** | `none` | Available for all brands |

## 🔄 Migration Logic

The migration script uses **UPSERT** operations (`INSERT ... ON CONFLICT DO UPDATE`) to:

1. **Insert new rules** for parts that don't exist
2. **Update existing rules** with the new comprehensive requirements
3. **Preserve existing data** while applying new rules
4. **Set default rules** for parts without specific requirements

## 🧪 Testing the Migration

After running the migration, you can test the rules using these queries:

### Check All Rules
```sql
SELECT part_name, rule_type, brands, description 
FROM parts_rules 
ORDER BY part_name;
```

### Check Rules by Type
```sql
SELECT rule_type, COUNT(*) as count 
FROM parts_rules 
GROUP BY rule_type;
```

### Test Specific Brand Rules
```sql
-- Check what parts are required for a specific brand
SELECT part_name, rule_type, description
FROM parts_rules 
WHERE 'Mercedes' = ANY(brands) OR rule_type = 'none'
ORDER BY part_name;
```

## 🔧 Application Integration

The updated rules will automatically be used by:

1. **Parts Selection UI**: Shows only available parts for each brand
2. **Quote Form**: Filters parts based on vehicle brand
3. **Settings Page**: Allows admins to modify rules
4. **AI Part Detection**: Uses rules for intelligent part suggestions

## 📝 Notes

- **Subaru Exception**: Oil coolers and intercoolers are explicitly not required for Subaru
- **European Brands**: Many advanced parts (cameras, blind spot sensors) are required for European brands
- **Model-Specific**: Some rules include specific model information in descriptions
- **Future-Proof**: Easy to add new brands or modify existing rules through the settings UI

## 🚨 Important Considerations

1. **Backup**: Always backup your database before running migrations
2. **Testing**: Test the migration in a development environment first
3. **Permissions**: Ensure you have admin access to run the migration
4. **Rollback**: Keep the old rules available for rollback if needed

## 📞 Support

If you encounter any issues during the migration:

1. Check the Supabase logs for error messages
2. Verify your database connection and permissions
3. Ensure the `profiles` table exists and has admin users
4. Review the SQL syntax for any typos

The migration is designed to be safe and non-destructive, using UPSERT operations to handle existing data gracefully.
