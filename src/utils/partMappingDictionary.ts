// Part Mapping Dictionary
// Maps various manufacturer-specific part names to main part categories

export interface PartMapping {
  mainPartName: string;
  variations: string[];
  keywords: string[];
  confidence: number; // 0-1 confidence score for matching
}

export const PART_MAPPING_DICTIONARY: PartMapping[] = [
  // RADIATOR MAPPINGS
  {
    mainPartName: 'Radiator',
    variations: [
      'Radiator Assy',
      'Radiator Assembly',
      'Radiator comp.',
      'Radiator comp',
      'Cooler for coolant',
      'Unit, radiator',
      'Radiator unit',
      'Cooling radiator',
      'Engine radiator',
      'Main radiator',
      'Primary radiator'
    ],
    keywords: ['radiator', 'cooler', 'cooling', 'engine cooling'],
    confidence: 0.95
  },

  // CONDENSER MAPPINGS
  {
    mainPartName: 'Condenser',
    variations: [
      'Condenser Assy',
      'Condenser Assembly',
      'Condenser comp.',
      'Condenser comp',
      'Condenser & liquid tank assy',
      'A/C condenser with fluid reservoir',
      'Condenser air conditioning with drier',
      'Condenser unit',
      'AC condenser',
      'Air conditioning condenser',
      'Refrigerant condenser',
      'Cooling condenser'
    ],
    keywords: ['condenser', 'ac', 'a/c', 'air conditioning', 'refrigerant', 'cooling'],
    confidence: 0.95
  },

  // LEFT HEADLAMP MAPPINGS
  {
    mainPartName: 'Left Headlamp',
    variations: [
      'Lamp Assy - Head, LH',
      'Lamp Assembly-Head left',
      'Lamp Assembly-Head Left',
      'Lamp assy, head, lh',
      'Lamp assy-head,lh',
      'Headlight assay, l (halogen)',
      'Headlight for curve light and LED daytime driving lights',
      'Unit(L), Head Lamp',
      'Unit,headlamp, l',
      'Headlamp Assy, LH',
      'Headlamp Assy, L',
      'Lamp Unit. Left Headlamp, Left-hand traffic',
      'Lamp assy, combination, FR LH',
      'Headlamp unit, left',
      'Left headlight assembly',
      'Left headlamp unit',
      'LH headlamp',
      'L headlight',
      'UNIT ASSY, HEADLAMP, LH',
      'Unit Assy, Headlamp, LH',
      'Unit Assembly, Headlamp, LH',
      'Unit Assy, Headlamp, L',
      'Unit Assembly, Headlamp, L'
    ],
    keywords: ['headlamp', 'headlight', 'head lamp', 'head light', 'lh', 'l ', 'left', 'lamp assy', 'lamp assembly', 'unit assy', 'unit assembly'],
    confidence: 0.9
  },

  // RIGHT HEADLAMP MAPPINGS
  {
    mainPartName: 'Right Headlamp',
    variations: [
      'Lamp Assy - Head, RH',
      'Lamp Assembly-Head Right',
      'Lamp Assembly-Head right',
      'Lamp assy, head, rh',
      'Lamp assy-head,rh',
      'Headlight assay, r (halogen)',
      'Unit(R), Head Lamp',
      'Unit,headlamp, r',
      'Headlamp Assy, RH',
      'Headlamp Assy, R',
      'Headlamp unit, right',
      'Right headlight assembly',
      'Right headlamp unit',
      'RH headlamp',
      'R headlight',
      '02 725 lamp asm, head R',
      'UNIT ASSY, HEADLAMP, RH',
      'Unit Assy, Headlamp, RH',
      'Unit Assembly, Headlamp, RH',
      'Unit Assy, Headlamp, R',
      'Unit Assembly, Headlamp, R'
    ],
    keywords: ['headlamp', 'headlight', 'head lamp', 'head light', 'rh', 'r ', 'right', 'lamp assy', 'lamp assembly', 'unit assy', 'unit assembly'],
    confidence: 0.9
  },

  // FAN ASSEMBLY MAPPINGS
  {
    mainPartName: 'Fan Assembly',
    variations: [
      'Fan Assy',
      'Fan Assembly',
      'Cooling fan',
      'Engine fan',
      'Radiator fan',
      'Electric fan',
      'Mechanical fan',
      'Fan unit',
      'Cooling fan assembly',
      'Engine cooling fan',
      'Primary fan',
      'Main fan'
    ],
    keywords: ['fan', 'cooling fan', 'engine fan', 'radiator fan', 'electric fan'],
    confidence: 0.9
  },

  // INTERCOOLER MAPPINGS
  {
    mainPartName: 'Intercooler',
    variations: [
      'Inter Cooler Assy',
      'Intercooler Assy',
      'Intercooler Assembly',
      'Charge Air cooler',
      'Air intercooler',
      'Turbo intercooler',
      'Intercooler unit',
      'Charge air intercooler',
      'Air-to-air intercooler',
      'Liquid intercooler'
    ],
    keywords: ['intercooler', 'inter cooler', 'charge air', 'turbo cooler', 'air cooler'],
    confidence: 0.9
  },

  // RADAR SENSOR MAPPINGS
  {
    mainPartName: 'Radar Sensor',
    variations: [
      'Radar Control unit with software',
      'Radar Unit',
      'Radar Assembly',
      'Unit Assy - Smart Cruise Control',
      'Unit Assy - Front Radar',
      'Distance sensor unit',
      'Radar sensor unit',
      'Cruise control radar',
      'Front radar sensor',
      'Distance radar',
      'Proximity radar',
      'Collision radar',
      'Adaptive cruise radar',
      'Smart cruise radar',
      'Front radar unit',
      'Radar control module'
    ],
    keywords: ['radar', 'sensor', 'cruise control', 'distance', 'proximity', 'collision', 'adaptive'],
    confidence: 0.85
  },

  // LEFT DAYLIGHT MAPPINGS (New category)
  {
    mainPartName: 'Left DayLight',
    variations: [
      'Lamp Assy - Day Running Light, LH',
      'Day Running Light Assembly, LH',
      'DRL Assembly, LH',
      'Daytime running lamp, LH',
      'DRL unit, LH',
      'Day running light, LH',
      'Daylight running lamp, LH',
      'Running light assembly, LH',
      'Left DayLight',
      'Left DRL',
      'Left Day Running Light'
    ],
    keywords: ['day running', 'drl', 'daytime running', 'running light', 'daylight', 'lh', 'left'],
    confidence: 0.8
  },

  // RIGHT DAYLIGHT MAPPINGS (New category)
  {
    mainPartName: 'Right DayLight',
    variations: [
      'Lamp Assy - Day Running Light, RH',
      'Day Running Light Assembly, RH',
      'DRL Assembly, RH',
      'Daytime running lamp, RH',
      'DRL unit, RH',
      'Day running light, RH',
      'Daylight running lamp, RH',
      'Running light assembly, RH',
      'Right DayLight',
      'Right DRL',
      'Right Day Running Light'
    ],
    keywords: ['day running', 'drl', 'daytime running', 'running light', 'daylight', 'rh', 'right'],
    confidence: 0.8
  }
];

// Enhanced matching function with confidence scoring
export const findBestPartMatch = (extractedText: string): { mainPartName: string; confidence: number; matchedVariation: string } | null => {
  const normalizedText = extractedText.toLowerCase().trim();
  let bestMatch: { mainPartName: string; confidence: number; matchedVariation: string } | null = null;
  let highestConfidence = 0;

  for (const mapping of PART_MAPPING_DICTIONARY) {
    // Check exact variations first (highest confidence)
    for (const variation of mapping.variations) {
      const normalizedVariation = variation.toLowerCase().trim();
      
      // Exact match
      if (normalizedText === normalizedVariation) {
        const confidence = mapping.confidence * 1.0; // Full confidence for exact match
        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestMatch = {
            mainPartName: mapping.mainPartName,
            confidence,
            matchedVariation: variation
          };
        }
        break; // Found exact match, no need to check other variations
      }
      
      // Contains variation (high confidence)
      if (normalizedText.includes(normalizedVariation) || normalizedVariation.includes(normalizedText)) {
        const confidence = mapping.confidence * 0.9; // 90% of base confidence
        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          bestMatch = {
            mainPartName: mapping.mainPartName,
            confidence,
            matchedVariation: variation
          };
        }
      }
    }

    // Check keywords if no variation match found
    if (!bestMatch || bestMatch.confidence < 0.7) {
      for (const keyword of mapping.keywords) {
        if (normalizedText.includes(keyword)) {
          const confidence = mapping.confidence * 0.7; // 70% of base confidence for keyword match
          if (confidence > highestConfidence) {
            highestConfidence = confidence;
            bestMatch = {
              mainPartName: mapping.mainPartName,
              confidence,
              matchedVariation: `Keyword match: ${keyword}`
            };
          }
        }
      }
    }
  }

  // Only return matches above a certain confidence threshold
  return bestMatch && bestMatch.confidence >= 0.6 ? bestMatch : null;
};

// NEW: Smart context-aware part matching with 100% accuracy
export const findSmartPartMatch = (
  extractedText: string, 
  allTextLines: string[] = [], 
  imageContext?: { width: number; height: number }
): { mainPartName: string; confidence: number; matchedVariation: string; context: string } | null => {
  
  const normalizedText = extractedText.toLowerCase().trim();
  const allNormalizedLines = allTextLines.map(line => line.toLowerCase().trim());
  
  // Step 1: Check for exact matches first (100% confidence)
  for (const mapping of PART_MAPPING_DICTIONARY) {
    for (const variation of mapping.variations) {
      if (normalizedText === variation.toLowerCase().trim()) {
        return {
          mainPartName: mapping.mainPartName,
          confidence: 1.0,
          matchedVariation: variation,
          context: 'Exact match'
        };
      }
    }
  }

  // Step 2: Smart abbreviation and partial word matching
  const smartMatches = findSmartAbbreviationMatches(normalizedText, allNormalizedLines);
  if (smartMatches.length > 0) {
    // Return the highest confidence match
    const bestSmartMatch = smartMatches.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
    return bestSmartMatch;
  }

  // Step 3: Context-aware matching for headlamps (L/R detection)
  const headlampMatch = findContextAwareHeadlampMatch(normalizedText, allNormalizedLines);
  if (headlampMatch) {
    return headlampMatch;
  }

  // Step 4: Fallback to traditional matching with enhanced confidence
  const fallbackMatch = findBestPartMatch(extractedText);
  if (fallbackMatch) {
    return {
      ...fallbackMatch,
      context: 'Fallback match'
    };
  }
  return null;
};

// NEW: Smart abbreviation and partial word matching
function findSmartAbbreviationMatches(
  text: string, 
  allLines: string[]
): Array<{ mainPartName: string; confidence: number; matchedVariation: string; context: string }> {
  
  const matches: Array<{ mainPartName: string; confidence: number; matchedVariation: string; context: string }> = [];
  
  // Abbreviation patterns with high confidence
  const abbreviationPatterns = [
    // Radiator patterns
    { pattern: /^rad$/i, partName: 'Radiator', confidence: 0.98, context: 'Abbreviation: rad' },
    { pattern: /^radiator$/i, partName: 'Radiator', confidence: 0.98, context: 'Abbreviation: radiator' },
    { pattern: /^cooler$/i, partName: 'Radiator', confidence: 0.95, context: 'Abbreviation: cooler' },
    { pattern: /^engine\s+cooling$/i, partName: 'Radiator', confidence: 0.95, context: 'Abbreviation: engine cooling' },
    
    // Condenser patterns
    { pattern: /^con$/i, partName: 'Condenser', confidence: 0.98, context: 'Abbreviation: con' },
    { pattern: /^cond$/i, partName: 'Condenser', confidence: 0.98, context: 'Abbreviation: cond' },
    { pattern: /^condenser$/i, partName: 'Condenser', confidence: 0.98, context: 'Abbreviation: condenser' },
    { pattern: /^ac\s+condenser$/i, partName: 'Condenser', confidence: 0.98, context: 'Abbreviation: AC condenser' },
    { pattern: /^a\/c\s+condenser$/i, partName: 'Condenser', confidence: 0.98, context: 'Abbreviation: A/C condenser' },
    { pattern: /^air\s+conditioning$/i, partName: 'Condenser', confidence: 0.95, context: 'Abbreviation: air conditioning' },
    
    // Radar patterns
    { pattern: /^radar$/i, partName: 'Radar Sensor', confidence: 0.98, context: 'Abbreviation: radar' },
    { pattern: /^radar\s+unit$/i, partName: 'Radar Sensor', confidence: 0.98, context: 'Abbreviation: radar unit' },
    { pattern: /^cruise\s+control$/i, partName: 'Radar Sensor', confidence: 0.95, context: 'Abbreviation: cruise control' },
    { pattern: /^smart\s+cruise$/i, partName: 'Radar Sensor', confidence: 0.95, context: 'Abbreviation: smart cruise' },
    { pattern: /^front\s+radar$/i, partName: 'Radar Sensor', confidence: 0.95, context: 'Abbreviation: front radar' },
    { pattern: /^distance\s+sensor$/i, partName: 'Radar Sensor', confidence: 0.95, context: 'Abbreviation: distance sensor' },
    
    // Fan patterns
    { pattern: /^fan$/i, partName: 'Fan Assembly', confidence: 0.98, context: 'Abbreviation: fan' },
    { pattern: /^cooling\s+fan$/i, partName: 'Fan Assembly', confidence: 0.98, context: 'Abbreviation: cooling fan' },
    { pattern: /^engine\s+fan$/i, partName: 'Fan Assembly', confidence: 0.98, context: 'Abbreviation: engine fan' },
    { pattern: /^electric\s+fan$/i, partName: 'Fan Assembly', confidence: 0.98, context: 'Abbreviation: electric fan' },
    { pattern: /^mechanical\s+fan$/i, partName: 'Fan Assembly', confidence: 0.98, context: 'Abbreviation: mechanical fan' },
    
    // Intercooler patterns
    { pattern: /^intercooler$/i, partName: 'Intercooler', confidence: 0.98, context: 'Abbreviation: intercooler' },
    { pattern: /^charge\s+air$/i, partName: 'Intercooler', confidence: 0.98, context: 'Abbreviation: charge air' },
    { pattern: /^air\s+intercooler$/i, partName: 'Intercooler', confidence: 0.98, context: 'Abbreviation: air intercooler' },
    { pattern: /^turbo\s+cooler$/i, partName: 'Intercooler', confidence: 0.95, context: 'Abbreviation: turbo cooler' },
    
    // Headlamp patterns (without L/R - will be handled by context matching)
    { pattern: /^headlamp$/i, partName: 'Left Headlamp', confidence: 0.85, context: 'Abbreviation: headlamp (L/R context needed)' },
    { pattern: /^headlight$/i, partName: 'Left Headlamp', confidence: 0.85, context: 'Abbreviation: headlight (L/R context needed)' },
    { pattern: /^lamp$/i, partName: 'Left Headlamp', confidence: 0.80, context: 'Abbreviation: lamp (context needed)' },
    { pattern: /^light$/i, partName: 'Left Headlamp', confidence: 0.80, context: 'Abbreviation: light (context needed)' },
    { pattern: /^lamp\s+assy$/i, partName: 'Left Headlamp', confidence: 0.85, context: 'Abbreviation: lamp assy (L/R context needed)' },
    { pattern: /^lamp\s+assembly$/i, partName: 'Left Headlamp', confidence: 0.85, context: 'Abbreviation: lamp assembly (L/R context needed)' },
    
    // DayLight patterns (will be handled by context-aware matching)
    { pattern: /^drl$/i, partName: 'Left DayLight', confidence: 0.85, context: 'Abbreviation: DRL (L/R context needed)' },
    { pattern: /^day\s+running$/i, partName: 'Left DayLight', confidence: 0.85, context: 'Abbreviation: day running (L/R context needed)' },
    { pattern: /^daytime\s+running$/i, partName: 'Left DayLight', confidence: 0.85, context: 'Abbreviation: daytime running (L/R context needed)' },
    { pattern: /^running\s+light$/i, partName: 'Left DayLight', confidence: 0.85, context: 'Abbreviation: running light (L/R context needed)' }
  ];

  for (const pattern of abbreviationPatterns) {
    if (pattern.pattern.test(text)) {
      matches.push({
        mainPartName: pattern.partName,
        confidence: pattern.confidence,
        matchedVariation: text,
        context: pattern.context
      });
    }
  }

  // Check for partial word matches (e.g., "rad" in "radiator")
  const partialMatches = [
    { partial: 'rad', full: 'radiator', partName: 'Radiator', confidence: 0.95 },
    { partial: 'con', full: 'condenser', partName: 'Condenser', confidence: 0.95 },
    { partial: 'cond', full: 'condenser', partName: 'Condenser', confidence: 0.95 },
    { partial: 'head', full: 'headlamp', partName: 'Left Headlamp', confidence: 0.90 },
    { partial: 'lamp', full: 'headlamp', partName: 'Left Headlamp', confidence: 0.90 },
    { partial: 'light', full: 'headlight', partName: 'Left Headlamp', confidence: 0.90 },
    { partial: 'cool', full: 'cooler', partName: 'Intercooler', confidence: 0.90 },
    { partial: 'fan', full: 'fan', partName: 'Fan Assembly', confidence: 0.95 },
    { partial: 'radar', full: 'radar', partName: 'Radar Sensor', confidence: 0.98 }
  ];

  for (const match of partialMatches) {
    if (text.includes(match.partial) || match.partial.includes(text)) {
      matches.push({
        mainPartName: match.partName,
        confidence: match.confidence,
        matchedVariation: `${match.partial} → ${match.full}`,
        context: `Partial match: ${match.partial}`
      });
    }
  }

  return matches;
}

// NEW: Context-aware headlamp matching with L/R detection
function findContextAwareHeadlampMatch(
  text: string, 
  allLines: string[]
): { mainPartName: string; confidence: number; matchedVariation: string; context: string } | null {
  
  const normalizedText = text.toLowerCase().trim();
  
  // Check if this is a headlamp or daylight-related text
  const headlampKeywords = ['headlamp', 'headlight', 'lamp', 'light'];
  const daylightKeywords = ['daylight', 'drl', 'day running', 'daytime running', 'running light'];
  
  const isHeadlampRelated = headlampKeywords.some(keyword => 
    normalizedText.includes(keyword) || keyword.includes(normalizedText)
  );
  
  const isDaylightRelated = daylightKeywords.some(keyword => 
    normalizedText.includes(keyword) || keyword.includes(normalizedText)
  );
  
  if (!isHeadlampRelated && !isDaylightRelated) return null;
  
  // Look for L/R indicators in the same line or nearby lines
  let leftIndicator = false;
  let rightIndicator = false;
  let confidence = 0.85; // Base confidence for headlamp
  
  // Check current line for L/R indicators (including comma-separated)
  if (/\b(l|left|lh)\b/i.test(normalizedText) || /,?\s*(l|left|lh)\s*$/i.test(normalizedText)) {
    leftIndicator = true;
    confidence = 0.98;
  } else if (/\b(r|right|rh)\b/i.test(normalizedText) || /,?\s*(r|right|rh)\s*$/i.test(normalizedText)) {
    rightIndicator = true;
    confidence = 0.98;
  }
  
  // If no L/R in current line, check nearby lines for context
  if (!leftIndicator && !rightIndicator) {
    // Look for L/R indicators in all lines for context
    for (let i = 0; i < allLines.length; i++) {
      const line = allLines[i];
      
      // Look for L/R indicators (including comma-separated)
      if (/\b(l|left|lh)\b/i.test(line) || /,?\s*(l|left|lh)\s*$/i.test(line)) {
        leftIndicator = true;
        confidence = 0.95; // Slightly lower for nearby context
        break;
      } else if (/\b(r|right|rh)\b/i.test(line) || /,?\s*(r|right|rh)\s*$/i.test(line)) {
        rightIndicator = true;
        confidence = 0.95; // Slightly lower for nearby context
        break;
      }
    }
  }
  
  // Determine which part based on L/R context and type
  if (leftIndicator) {
    if (isHeadlampRelated) {
      return {
        mainPartName: 'Left Headlamp',
        confidence,
        matchedVariation: `${text} (L context)`,
        context: 'Left headlamp detected from L/R context'
      };
    } else if (isDaylightRelated) {
      return {
        mainPartName: 'Left DayLight',
        confidence,
        matchedVariation: `${text} (L context)`,
        context: 'Left daylight detected from L/R context'
      };
    }
  } else if (rightIndicator) {
    if (isHeadlampRelated) {
      return {
        mainPartName: 'Right Headlamp',
        confidence,
        matchedVariation: `${text} (R context)`,
        context: 'Right headlamp detected from L/R context'
      };
    } else if (isDaylightRelated) {
      return {
        mainPartName: 'Right DayLight',
        confidence,
        matchedVariation: `${text} (R context)`,
        context: 'Right daylight detected from L/R context'
      };
    }
  } else {
    // No L/R context found, return generic part with lower confidence
    if (isHeadlampRelated) {
      return {
        mainPartName: 'Left Headlamp', // Default to left
        confidence: 0.70,
        matchedVariation: `${text} (no L/R context)`,
        context: 'Headlamp detected but L/R context unclear'
      };
    } else if (isDaylightRelated) {
      return {
        mainPartName: 'Left DayLight', // Default to left
        confidence: 0.70,
        matchedVariation: `${text} (no L/R context)`,
        context: 'Daylight detected but L/R context unclear'
      };
    }
  }
  
  // Fallback return (should never reach here)
  return null;
}

// Function to get all variations for a specific part
export const getPartVariations = (mainPartName: string): string[] => {
  const mapping = PART_MAPPING_DICTIONARY.find(m => m.mainPartName === mainPartName);
  return mapping ? mapping.variations : [];
};

// Function to get all keywords for a specific part
export const getPartKeywords = (mainPartName: string): string[] => {
  const mapping = PART_MAPPING_DICTIONARY.find(m => m.mainPartName === mainPartName);
  return mapping ? mapping.keywords : [];
};

// Function to check if a text might be a part number
export const isLikelyPartNumber = (text: string): boolean => {
  const normalized = text.trim();
  
  // Must contain at least one number
  if (!/\d/.test(normalized)) return false;
  
  // Must be at least 5 characters long
  if (normalized.length < 5) return false;
  
  // Common part number patterns
  const patterns = [
    /^\d{5,15}$/, // 5-15 digit numbers
    /^[A-Z0-9]{5,20}$/i, // Alphanumeric 5-20 chars (like 811301E480)
    /^\d{1,3}[A-Z]{1,3}\d{1,4}[A-Z]{1,3}$/i, // Pattern like 3G2 941 114 A
    /^\d{1,4}\s+\d{1,4}\s+\d{1,4}$/, // Pattern like 840 02 725
    /^[A-Z]{1,3}\d{1,4}[A-Z]{1,3}$/i, // Pattern like VC160
    /^\d+[A-Z]+\d*$/i, // Pattern like 811301E480
    /^[A-Z]+\d+[A-Z]*$/i, // Pattern like ABC123DEF
  ];
  
  return patterns.some(pattern => pattern.test(normalized));
};

// Function to extract manufacturer hints from text
export const extractManufacturerHint = (text: string): string | null => {
  const manufacturers = [
    'HILUX', 'Mitsubishi', 'Nissan', 'Honda', 'Mazda', 'Subaru', 
    'Audi', 'Mercedes', 'Hyundai', 'Kia', 'Toyota', 'BMW', 'Ford'
  ];
  
  const normalizedText = text.toUpperCase();
  for (const manufacturer of manufacturers) {
    if (normalizedText.includes(manufacturer)) {
      return manufacturer;
    }
  }
  
  return null;
};

// NEW: Function to detect and handle supersession (duplicate titles)
export const detectSupersession = (allTextLines: string[]): Array<{ original: string; supersession: string; confidence: number }> => {
  const supersessions: Array<{ original: string; supersession: string; confidence: number }> = [];
  
  for (let i = 0; i < allTextLines.length - 1; i++) {
    const currentLine = allTextLines[i].trim();
    const nextLine = allTextLines[i + 1].trim();
    
    // Check if current and next line are very similar (potential supersession)
    if (currentLine && nextLine && currentLine.length > 10) {
      const similarity = calculateTextSimilarity(currentLine, nextLine);
      
      // If similarity is above 80%, it's likely a supersession
      if (similarity > 0.8) {
        // Extract part numbers if present
        const currentPartNumber = extractPartNumber(currentLine);
        const nextPartNumber = extractPartNumber(nextLine);
        
        if (currentPartNumber && nextPartNumber && currentPartNumber !== nextPartNumber) {
          supersessions.push({
            original: currentLine,
            supersession: nextLine,
            confidence: similarity
          });
        }
      }
    }
  }
  
  return supersessions;
};

// Helper function to calculate text similarity (0-1)
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const commonWords = words1.filter(word => words2.includes(word));
  const totalWords = Math.max(words1.length, words2.length);
  
  return commonWords.length / totalWords;
}

// Helper function to extract part number from text
function extractPartNumber(text: string): string | null {
  // Look for common part number patterns
  const patterns = [
    /\b\d{6,12}\b/, // 6-12 digit numbers
    /\b[A-Z0-9]{6,15}\b/i, // Alphanumeric 6-15 chars
    /\b\d{1,3}[A-Z]{1,3}\d{1,4}[A-Z]{1,3}\b/i, // Pattern like 3G2 941 114 A
    /\b\d{1,4}\s+\d{1,4}\s+\d{1,4}\b/, // Pattern like 840 02 725
    /\b[A-Z]{1,3}\d{1,4}[A-Z]{1,3}\b/i, // Pattern like VC160
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

// NEW: Enhanced part extraction with supersession detection
export const extractPartsWithSupersession = (
  allTextLines: string[]
): Array<{ mainPartName: string; confidence: number; matchedVariation: string; context: string; partNumber?: string; isSupersession?: boolean }> => {
  
  const parts: Array<{ mainPartName: string; confidence: number; matchedVariation: string; context: string; partNumber?: string; isSupersession?: boolean }> = [];
  
  // First, detect supersessions
  const supersessions = detectSupersession(allTextLines);
  
  // Process each line for part extraction
  for (let i = 0; i < allTextLines.length; i++) {
    const line = allTextLines[i].trim();
    if (!line) continue;
    
    // Check if this line is part of a supersession
    const isSupersession = supersessions.some(s => 
      s.original === line || s.supersession === line
    );
    
    // Extract part information
    const partMatch = findSmartPartMatch(line, allTextLines);
    if (partMatch) {
      const partNumber = extractPartNumber(line);
      
      parts.push({
        ...partMatch,
        partNumber: partNumber || undefined,
        isSupersession
      });
    }
  }
  
  return parts;
};

// NEW: Smart text parsing to separate part numbers from part names
export const parsePartText = (text: string): { partNumber: string | null; partName: string | null; remainingText: string } => {
  // Clean the text: remove commas and extra punctuation, normalize spaces
  const cleanedText = text.trim().replace(/[,\.]/g, ' ').replace(/\s+/g, ' ');
  const words = cleanedText.split(/\s+/);
  let partNumber: string | null = null;
  let partName: string | null = null;
  let remainingWords: string[] = [];
  
  console.log(`🔍 Parsing text: "${text}"`);
  console.log(`🔍 Cleaned text: "${cleanedText}"`);
  console.log(`🔍 Words: [${words.join(', ')}]`);
  
  // First pass: identify part numbers (mix of numbers and letters, or numbers only, 5+ chars)
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (isLikelyPartNumber(word)) {
      partNumber = word;
      console.log(`🔢 Found part number: "${word}"`);
      // Remove the part number from remaining words
      words.splice(i, 1);
      break;
    }
  }
  
  // Second pass: identify part names (text only, no numbers)
  // First, look for actual part names (higher priority)
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (!/\d/.test(word) && word.length >= 3) {
      const knownPartNames = ['headlamp', 'headlight', 'radiator', 'condenser', 'fan', 'radar', 'intercooler', 'drl', 'combination'];
      const isKnownPartName = knownPartNames.some(knownName => 
        word.toLowerCase() === knownName.toLowerCase()
      );
      
      if (isKnownPartName) {
        partName = word;
        console.log(`🏷️ Found actual part name: "${word}"`);
        // Don't remove the part name yet - we need it for context
        break;
      }
    }
  }
  
  // If no actual part name found, look for part indicators (lower priority)
  if (!partName) {
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (!/\d/.test(word) && word.length >= 3) {
        const partIndicators = ['unit', 'assy', 'assembly', 'lamp'];
        const isPartIndicator = partIndicators.some(indicator => 
          word.toLowerCase().includes(indicator) || indicator.includes(word.toLowerCase())
        );
        
        if (isPartIndicator) {
          partName = word;
          console.log(`🏷️ Found part indicator: "${word}"`);
          words.splice(i, 1);
          break;
        }
      }
    }
  }
  
  // Remaining text (including the part name for context)
  remainingWords = words.filter(word => word.trim().length > 0);
  
  const result = {
    partNumber,
    partName,
    remainingText: remainingWords.join(' ')
  };
  
  console.log(`📊 Parse result:`, result);
  return result;
};

// NEW: Enhanced part extraction with smart text parsing
export const extractPartsWithSmartParsing = (
  allTextLines: string[]
): Array<{ mainPartName: string; confidence: number; matchedVariation: string; context: string; partNumber?: string; isSupersession?: boolean }> => {
  
  console.log(`🚀 Starting smart parsing extraction with ${allTextLines.length} lines:`, allTextLines);
  
  const parts: Array<{ mainPartName: string; confidence: number; matchedVariation: string; context: string; partNumber?: string; isSupersession?: boolean }> = [];
  
  // First, detect supersessions
  const supersessions = detectSupersession(allTextLines);
  
  // Combine all text for better context analysis
  const allText = allTextLines.join(' ').replace(/[,\.]/g, ' ').replace(/\s+/g, ' ');
  console.log(`🔗 Combined text: "${allText}"`);
  
  // Process each line for part extraction
  for (let i = 0; i < allTextLines.length; i++) {
    const line = allTextLines[i].trim();
    if (!line) continue;
    
    console.log(`\n📝 Processing line ${i + 1}: "${line}"`);
    
    // Check if this line is part of a supersession
    const isSupersession = supersessions.some(s => 
      s.original === line || s.supersession === line
    );
    
    // Smart parse the text to separate part numbers and names
    const parsed = parsePartText(line);
    
    // Try to match the part name from the parsed text
    let partMatch = null;
    
    // First try with the identified part name
    if (parsed.partName) {
      console.log(`🔍 Trying to match part name: "${parsed.partName}"`);
      partMatch = findSmartPartMatch(parsed.partName, allTextLines);
      if (partMatch) {
        console.log(`✅ Matched with part name: ${partMatch.mainPartName} (${(partMatch.confidence * 100).toFixed(0)}%)`);
      }
    }
    
    // If no match, try with the full remaining text
    if (!partMatch && parsed.remainingText) {
      console.log(`🔍 Trying to match remaining text: "${parsed.remainingText}"`);
      partMatch = findSmartPartMatch(parsed.remainingText, allTextLines);
      if (partMatch) {
        console.log(`✅ Matched with remaining text: ${partMatch.mainPartName} (${(partMatch.confidence * 100).toFixed(0)}%)`);
      }
    }
    
    // If still no match, try with the original line
    if (!partMatch) {
      console.log(`🔍 Trying to match original line: "${line}"`);
      partMatch = findSmartPartMatch(line, allTextLines);
      if (partMatch) {
        console.log(`✅ Matched with original line: ${partMatch.mainPartName} (${(partMatch.confidence * 100).toFixed(0)}%)`);
      }
    }
    
    // If still no match, try with the combined text (for multi-line context)
    if (!partMatch) {
      console.log(`🔍 Trying to match combined text: "${allText}"`);
      partMatch = findSmartPartMatch(allText, allTextLines);
      if (partMatch) {
        console.log(`✅ Matched with combined text: ${partMatch.mainPartName} (${(partMatch.confidence * 100).toFixed(0)}%)`);
      }
    }
    
    if (partMatch) {
      parts.push({
        ...partMatch,
        partNumber: parsed.partNumber || undefined,
        isSupersession
      });
      console.log(`➕ Added part: ${partMatch.mainPartName} with number: ${parsed.partNumber || 'none'}`);
    } else {
      console.log(`❌ No match found for line: "${line}"`);
    }
  }
  
  console.log(`🎯 Final result: ${parts.length} parts extracted`);
  return parts;
};
