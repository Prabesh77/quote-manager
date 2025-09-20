#!/usr/bin/env node

/**
 * Parts Rules Database Migration Script
 * 
 * This script updates the parts_rules table with comprehensive real-world rules.
 * Run with: node migrate-parts-rules.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Comprehensive parts rules data
const partsRules = [
  // Fan Assembly Requirements
  {
    part_name: 'Fan Assembly',
    rule_type: 'required_for',
    brands: ['Holden', 'Nissan', 'Kia', 'Hyundai', 'Mazda'],
    description: 'Required for Holden (Captiva), Nissan (X-Trail, Navara), Kia, Hyundai, Mazda'
  },

  // Oil Cooler Requirements
  {
    part_name: 'Oil Cooler',
    rule_type: 'not_required_for',
    brands: ['Subaru'],
    description: 'Subaru models do not require an oil cooler'
  },

  // Headlamp Requirements
  {
    part_name: 'Left Headlamp',
    rule_type: 'required_for',
    brands: ['Holden', 'Ford'],
    description: 'Holden (Colorado, Trailblazer, Astra) and Ford (Everest, Ranger, Fiesta) only'
  },
  {
    part_name: 'Right Headlamp',
    rule_type: 'required_for',
    brands: ['Holden', 'Ford'],
    description: 'Holden (Colorado, Trailblazer, Astra) and Ford (Everest, Ranger, Fiesta) only'
  },

  // Front Grille Camera Requirements
  {
    part_name: 'Camera',
    rule_type: 'required_for',
    brands: ['Volkswagen', 'Skoda', 'Seat', 'Cupra', 'Audi', 'BMW', 'MG', 'LDV', 'Ssang Yong'],
    description: 'Front Grille Camera required (not windscreen-mounted camera)'
  },

  // Parking Sensor Requirements
  {
    part_name: 'Parking Sensor',
    rule_type: 'required_for',
    brands: ['Mitsubishi', 'Nissan'],
    description: 'Required for Mitsubishi and Nissan'
  },

  // Blind Spot Sensors Requirements
  {
    part_name: 'Left Blindspot Sensor',
    rule_type: 'required_for',
    brands: ['Hyundai', 'Kia', 'Volkswagen', 'Skoda', 'Seat', 'Cupra', 'Audi', 'BMW'],
    description: 'Front & Rear Blind Spot Sensors required'
  },
  {
    part_name: 'Right Blindspot Sensor',
    rule_type: 'required_for',
    brands: ['Hyundai', 'Kia', 'Volkswagen', 'Skoda', 'Seat', 'Cupra', 'Audi', 'BMW'],
    description: 'Front & Rear Blind Spot Sensors required'
  },

  // Daytime Headlamp Requirements
  {
    part_name: 'Left DayLight',
    rule_type: 'required_for',
    brands: ['Nissan', 'Hyundai', 'Kia', 'Genesis', 'Mitsubishi'],
    description: 'Daytime Headlamp required'
  },
  {
    part_name: 'Right DayLight',
    rule_type: 'required_for',
    brands: ['Nissan', 'Hyundai', 'Kia', 'Genesis', 'Mitsubishi'],
    description: 'Daytime Headlamp required'
  },

  // Add cooler, left intercooler, right intercooler for specific brands
  {
    part_name: 'Add Cooler',
    rule_type: 'required_for',
    brands: ['Mercedes', 'BMW', 'Volkswagen', 'Land Rover', 'Audi'],
    description: 'Required for Mercedes, BMW, Volkswagen, Land Rover, Audi. Not required for Subaru'
  },
  {
    part_name: 'Left Intercooler',
    rule_type: 'required_for',
    brands: ['Mercedes', 'BMW', 'Volkswagen', 'Land Rover', 'Audi'],
    description: 'Required for Mercedes, BMW, Volkswagen, Land Rover, Audi. Not required for Subaru'
  },
  {
    part_name: 'Right Intercooler',
    rule_type: 'required_for',
    brands: ['Mercedes', 'BMW', 'Volkswagen', 'Land Rover', 'Audi'],
    description: 'Required for Mercedes, BMW, Volkswagen, Land Rover, Audi. Not required for Subaru'
  },

  // Auxiliary Radiator
  {
    part_name: 'Auxiliary Radiator',
    rule_type: 'required_for',
    brands: ['Land Rover', 'Mercedes', 'Audi', 'BMW', 'Volkswagen', 'Porsche', 'Volvo', 'Jaguar'],
    description: 'Required for European luxury brands'
  },

  // Parts available for all brands
  {
    part_name: 'Radiator',
    rule_type: 'none',
    brands: [],
    description: 'Available for all brands'
  },
  {
    part_name: 'Condenser',
    rule_type: 'none',
    brands: [],
    description: 'Available for all brands'
  },
  {
    part_name: 'Fan',
    rule_type: 'none',
    brands: [],
    description: 'Available for all brands'
  },
  {
    part_name: 'Grille',
    rule_type: 'none',
    brands: [],
    description: 'Available for all brands'
  },
  {
    part_name: 'Bumper',
    rule_type: 'none',
    brands: [],
    description: 'Available for all brands'
  },
  {
    part_name: 'Radar Sensor',
    rule_type: 'none',
    brands: [],
    description: 'Available for all brands'
  }
];

async function migratePartsRules() {
  console.log('🚀 Starting Parts Rules Migration...\n');

  try {
    // Get admin user ID
    const { data: adminUser, error: adminError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .single();

    if (adminError || !adminUser) {
      console.error('❌ Could not find admin user:', adminError?.message);
      return;
    }

    console.log(`👤 Using admin user: ${adminUser.id}`);

    let successCount = 0;
    let errorCount = 0;

    // Process each rule
    for (const rule of partsRules) {
      try {
        const { data, error } = await supabase
          .from('parts_rules')
          .upsert({
            part_name: rule.part_name,
            rule_type: rule.rule_type,
            brands: rule.brands,
            description: rule.description,
            created_by: adminUser.id,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'part_name'
          });

        if (error) {
          console.error(`❌ Error updating ${rule.part_name}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Updated: ${rule.part_name} (${rule.rule_type})`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Exception updating ${rule.part_name}:`, err.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`✅ Successfully updated: ${successCount} rules`);
    console.log(`❌ Errors: ${errorCount} rules`);

    // Verify the results
    const { data: allRules, error: verifyError } = await supabase
      .from('parts_rules')
      .select('part_name, rule_type, brands')
      .order('part_name');

    if (verifyError) {
      console.error('❌ Error verifying results:', verifyError.message);
    } else {
      console.log(`\n📋 Total rules in database: ${allRules.length}`);
      
      // Show summary by rule type
      const summary = allRules.reduce((acc, rule) => {
        acc[rule.rule_type] = (acc[rule.rule_type] || 0) + 1;
        return acc;
      }, {});

      console.log('\n📊 Rules by type:');
      Object.entries(summary).forEach(([type, count]) => {
        console.log(`  ${type}: ${count} rules`);
      });
    }

    console.log('\n🎉 Migration completed!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
migratePartsRules();
