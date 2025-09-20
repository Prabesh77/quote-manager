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
  'Fan Assembly': {
    requiredFor: ['Kia', 'Hyundai', 'Mazda', 'Holden', 'Nissan'],
    description: 'Required for Asian and Australian brands'
  },
  'Oil Cooler': {
    notRequiredFor: ['Subaru'],
    description: 'Not required for Subaru'
  },
  'Intercooler': {
    notRequiredFor: ['Subaru'],
    description: 'Not required for Subaru'
  },
  'Parking Sensor': {
    requiredFor: ['Nissan', 'Mitsubishi'],
    description: 'Only required for Nissan and Mitsubishi'
  },
  'Left Blindspot Sensor': {
    requiredFor: ['Kia', 'Hyundai', 'BMW', 'Audi', 'Volkswagen', 'Mercedes', 'Porsche', 'Volvo', 'Jaguar', 'Land Rover'],
    description: 'Required for Korean, European, and premium brands'
  },
  'Right Blindspot Sensor': {
    requiredFor: ['Kia', 'Hyundai', 'BMW', 'Audi', 'Volkswagen', 'Mercedes', 'Porsche', 'Volvo', 'Jaguar', 'Land Rover'],
    description: 'Required for Korean, European, and premium brands'
  },
  'Camera': {
    requiredFor: ['Volkswagen', 'BMW', 'Haval', 'Chery', 'BYD', 'MG', 'Great Wall', 'Geely', 'Audi', 'Mercedes'],
    description: 'Required for European and Chinese brands'
  },
  'Auxiliary Radiator': {
    requiredFor: ['Land Rover', 'Mercedes', 'Audi', 'BMW', 'Volkswagen', 'Porsche', 'Volvo', 'Jaguar'],
    description: 'Required for European luxury brands'
  },
  'Left Intercooler': {
    requiredFor: ['Mercedes', 'Land Rover', 'BMW'],
    description: 'Required for Mercedes, Land Rover, and BMW'
  },
  'Right Intercooler': {
    requiredFor: ['Mercedes', 'Land Rover', 'BMW'],
    description: 'Required for Mercedes, Land Rover, and BMW'
  },
  'Add Cooler': {
    requiredFor: ['Mercedes', 'Land Rover', 'BMW'],
    description: 'Required for Mercedes, Land Rover, and BMW'
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