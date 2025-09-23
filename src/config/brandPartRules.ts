// Brand-based part availability rules
// This configuration determines which parts are available for each brand

export interface BrandPartRule {
  requiredFor?: string[];
  notRequiredFor?: string[];
  description?: string;
}

export const BRAND_PART_RULES: Record<string, BrandPartRule> = {
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
    requiredFor: ['Volkswagen', 'Skoda', 'Seat', 'Cupra', 'Audi', 'BMW', 'MG', 'LDV', 'Ssang Yong'],
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
  'Left Rear Lamp': {
    requiredFor: ['Kia', 'Hyundai', 'Toyota'],
    description: 'Rear combination lamp required for Kia, Hyundai, and Toyota'
  },
  'Right Rear Lamp': {
    requiredFor: ['Kia', 'Hyundai', 'Toyota'],
    description: 'Rear combination lamp required for Kia, Hyundai, and Toyota'
  },
};

// Helper function to check if a part is available for a specific brand
export function isPartAvailableForBrand(partName: string, brand: string): boolean {
  const rule = BRAND_PART_RULES[partName];
  
  if (!rule) {
    // If no rule exists, the part is available for all brands
    return true;
  }
  
  // Normalize brand name for case-insensitive comparison
  const normalizedBrand = brand.trim();
  
  // Check if brand is in the notRequiredFor list (case-insensitive)
  if (rule.notRequiredFor && rule.notRequiredFor.some(b => b.toLowerCase() === normalizedBrand.toLowerCase())) {
    return false;
  }
  
  // Check if brand is in the requiredFor list (case-insensitive)
  if (rule.requiredFor && rule.requiredFor.length > 0) {
    return rule.requiredFor.some(b => b.toLowerCase() === normalizedBrand.toLowerCase());
  }
  
  // If only notRequiredFor is specified and brand is not in it, part is available
  // If no rules are specified, part is available for all brands
  return true;
}

// Helper function to get all available parts for a brand
export function getAvailablePartsForBrand(brand: string, allParts: string[]): string[] {
  return allParts.filter(partName => isPartAvailableForBrand(partName, brand));
}

// Helper function to get parts that are NOT available for a brand (for debugging/info)
export function getUnavailablePartsForBrand(brand: string, allParts: string[]): string[] {
  return allParts.filter(partName => !isPartAvailableForBrand(partName, brand));
}

// Helper function to get brand-specific part descriptions
export function getPartDescriptionForBrand(partName: string, brand: string): string | null {
  const rule = BRAND_PART_RULES[partName];
  if (!rule) return null;
  
  if (rule.notRequiredFor && rule.notRequiredFor.includes(brand)) {
    return `Not required for ${brand}`;
  }
  
  if (rule.requiredFor && rule.requiredFor.includes(brand)) {
    return `Required for ${brand}`;
  }
  
  return rule.description || null;
}
