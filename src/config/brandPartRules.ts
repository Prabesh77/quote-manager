// Brand-based part availability rules
// This configuration determines which parts are available for each brand
// Now uses database-driven rules via React Query

import { usePartsRulesQuery } from '@/hooks/queries/usePartsRulesQuery';
import type { PartsRule } from '@/services/partsRules/partsRulesService';

export interface BrandPartRule {
  requiredFor?: string[];
  notRequiredFor?: string[];
  description?: string;
}

// Legacy hardcoded rules for fallback (can be removed once fully migrated)
export const BRAND_PART_RULES_LEGACY: Record<string, BrandPartRule> = {
  // Fan Assembly Requirements
  'Fan Assembly': {
    requiredFor: ['Holden', 'Nissan', 'Kia', 'Hyundai', 'Mazda'],
    description: 'Required for Holden (Captiva), Nissan (X-Trail, Navara), Kia, Hyundai, Mazda'
  },

  // Oil Cooler / Intercooler Info
  'Oil Cooler': {
    notRequiredFor: ['Subaru'],
    description: 'Subaru models do not require an oil cooler'
  },

  // Headlamp Requirements
  'Left Headlamp': {
    notRequiredFor: [],
    description: 'All Brands and Holden (Colorado, Trailblazer, Astra) and Ford (Everest, Ranger, Fiesta) only'
  },
  'Right Headlamp': {
     notRequiredFor: [],
    description: 'All Brands and Holden (Colorado, Trailblazer, Astra) and Ford (Everest, Ranger, Fiesta) only'
  },

  // Front Grille Camera Requirements
  'Camera': {
    requiredFor: ['Volkswagen', 'Skoda', 'Seat', 'Cupra', 'Audi', 'BMW', 'MG', 'LDV', 'Ssang Yong'],
    description: 'Front Grille Camera required (not windscreen-mounted camera)'
  },

  // Parking Sensor Requirements
  'Parking Sensor': {
    requiredFor: ['Mitsubishi', 'Nissan'],
    description: 'Required for Mitsubishi and Nissan'
  },

  // Blind Spot Sensors Requirements
  'Left Blindspot Sensor': {
    requiredFor: ['Hyundai', 'Kia', 'Volkswagen', 'Skoda', 'Seat', 'Cupra', 'Audi', 'BMW'],
    description: 'Front & Rear Blind Spot Sensors required'
  },
  'Right Blindspot Sensor': {
    requiredFor: ['Hyundai', 'Kia', 'Volkswagen', 'Skoda', 'Seat', 'Cupra', 'Audi', 'BMW'],
    description: 'Front & Rear Blind Spot Sensors required'
  },

  // Daytime Headlamp Requirements
  'Left DayLight': {
    requiredFor: ['Nissan', 'Hyundai', 'Kia', 'Genesis', 'Mitsubishi'],
    description: 'Daytime Headlamp required'
  },
  'Right DayLight': {
    requiredFor: ['Nissan', 'Hyundai', 'Kia', 'Genesis', 'Mitsubishi'],
    description: 'Daytime Headlamp required'
  },

  // Add cooler, left intercooler, right intercooler for specific brands
  'Add Cooler': {
    requiredFor: ['Mercedes', 'BMW', 'Volkswagen', 'Land Rover', 'Audi'],
    notRequiredFor: ['Subaru'],
    description: 'Required for Mercedes, BMW, Volkswagen, Land Rover, Audi. Not required for Subaru'
  },
  'Left Intercooler': {
    requiredFor: ['Mercedes', 'BMW', 'Volkswagen', 'Land Rover', 'Audi'],
    notRequiredFor: ['Subaru'],
    description: 'Required for Mercedes, BMW, Volkswagen, Land Rover, Audi. Not required for Subaru'
  },
  'Right Intercooler': {
    requiredFor: ['Mercedes', 'BMW', 'Volkswagen', 'Land Rover', 'Audi'],
    notRequiredFor: ['Subaru'],
    description: 'Required for Mercedes, BMW, Volkswagen, Land Rover, Audi. Not required for Subaru'
  },

  // Auxiliary Radiator (keeping existing rule)
  'Auxiliary Radiator': {
    requiredFor: ['Land Rover', 'Mercedes', 'Audi', 'BMW', 'Volkswagen', 'Porsche', 'Volvo', 'Jaguar'],
    description: 'Required for European luxury brands'
  },
};

// Convert database rule to legacy format for backward compatibility
function convertDatabaseRuleToLegacy(rule: PartsRule): BrandPartRule {
  const legacy: BrandPartRule = {
    description: rule.description || undefined
  };

  if (rule.rule_type === 'required_for' && rule.brands.length > 0) {
    legacy.requiredFor = rule.brands;
  } else if (rule.rule_type === 'not_required_for' && rule.brands.length > 0) {
    legacy.notRequiredFor = rule.brands;
  }

  return legacy;
}

// Get rules from database and convert to legacy format
function getDatabaseRulesAsLegacy(rules: PartsRule[]): Record<string, BrandPartRule> {
  const result: Record<string, BrandPartRule> = {};
  
  rules.forEach(rule => {
    result[rule.part_name] = convertDatabaseRuleToLegacy(rule);
  });
  
  return result;
}

// Hook to get brand part rules from database
export function useBrandPartRules() {
  const { data: rules = [], isLoading, error } = usePartsRulesQuery();
  
  const databaseRules = getDatabaseRulesAsLegacy(rules);
  const allRules = { ...BRAND_PART_RULES_LEGACY, ...databaseRules };
  
  return {
    rules: allRules,
    isLoading,
    error,
    databaseRules,
    legacyRules: BRAND_PART_RULES_LEGACY
  };
}

// Helper function to check if a part is available for a specific brand
export function isPartAvailableForBrand(partName: string, brand: string, rules?: Record<string, BrandPartRule>): boolean {
  const rule = rules?.[partName] || BRAND_PART_RULES_LEGACY[partName];
  
  if (!rule) {
    // If no rule exists, the part is available for all brands
    return true;
  }
  
  // Check if brand is in the notRequiredFor list
  if (rule.notRequiredFor && rule.notRequiredFor.includes(brand)) {
    return false;
  }
  
  // Check if brand is in the requiredFor list
  if (rule.requiredFor && rule.requiredFor.length > 0) {
    return rule.requiredFor.includes(brand);
  }
  
  // If only notRequiredFor is specified and brand is not in it, part is available
  // If no rules are specified, part is available for all brands
  return true;
}

// Helper function to get all available parts for a brand
export function getAvailablePartsForBrand(brand: string, allParts: string[], rules?: Record<string, BrandPartRule>): string[] {
  return allParts.filter(partName => isPartAvailableForBrand(partName, brand, rules));
}

// Helper function to get parts that are NOT available for a brand (for debugging/info)
export function getUnavailablePartsForBrand(brand: string, allParts: string[], rules?: Record<string, BrandPartRule>): string[] {
  return allParts.filter(partName => !isPartAvailableForBrand(partName, brand, rules));
}

// Helper function to get brand-specific part descriptions
export function getPartDescriptionForBrand(partName: string, brand: string, rules?: Record<string, BrandPartRule>): string | null {
  const rule = rules?.[partName] || BRAND_PART_RULES_LEGACY[partName];
  if (!rule) return null;
  
  if (rule.notRequiredFor && rule.notRequiredFor.includes(brand)) {
    return `Not required for ${brand}`;
  }
  
  if (rule.requiredFor && rule.requiredFor.includes(brand)) {
    return `Required for ${brand}`;
  }
  
  return rule.description || null;
}

// For backward compatibility, export the legacy rules as the main export
export const BRAND_PART_RULES = BRAND_PART_RULES_LEGACY;