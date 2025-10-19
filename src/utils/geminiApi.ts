// Gemini API service for AI-powered part extraction
// Now uses backend API for security and performance

export interface AIPartExtraction {
  partName: string;
  partNumber: string;
  confidence: number;
  rawText: string;
  context: string | undefined;
  list_price?: number;
}

/**
 * Extract part information using Gemini AI via backend API
 * Enhanced to handle multiple parts from a single image
 */
export async function extractPartsWithAI(ocrText: string): Promise<AIPartExtraction[]> {
  try {
    // Call the backend API instead of running AI directly
    const response = await fetch('/api/extract-parts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ocrText }),
    });

    if (!response.ok) {
      console.error('Backend API failed, using fallback');
      return fallbackExtraction(ocrText);
    }

    const data = await response.json();

    // Check if backend suggests using fallback
    if (data.useFallback) {
      return fallbackExtraction(ocrText);
    }

    if (!data.parts || !Array.isArray(data.parts)) {
      console.error('Invalid response from backend, using fallback');
      return fallbackExtraction(ocrText);
    }

    return data.parts;
  } catch (error) {
    console.error('AI extraction failed, falling back to basic extraction:', error);
    return fallbackExtraction(ocrText);
  }
}

/**
 * Enhanced fallback extraction logic for when AI fails
 * Now handles multiple parts from a single image with spatial matching
 */
function fallbackExtraction(ocrText: string): AIPartExtraction[] {
  const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line);
  const parts: AIPartExtraction[] = [];
  const usedPartNumbers = new Set<string>();
  
  // First pass: collect all part numbers and their positions
  const partNumberPositions: Array<{ number: string; lineIndex: number; line: string }> = [];
  const partNamePositions: Array<{ name: string; lineIndex: number; line: string; context: string }> = [];
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    
    // Look for part numbers (alphanumeric, MUST be 8+ REAL alphanumeric chars, ignoring special chars)
    // Also look for part numbers with hyphens (e.g., 26060-5X00B, 26010-5X00B)
    // Also look for Ford-style part numbers with prefix (e.g., N1WZ 9E731-D, ML3Z 9E731-E)
    // IMPORTANT: Exclude common part names that might match the regex
    const fordStyleMatches = line.match(/\b[A-Z]{2,4}Z\s+[A-Z0-9]{5,15}(?:-[A-Z0-9]{1,5})?\b/gi); // Ford format: PREFIX + space + number
    const partNumberMatches = line.match(/\b[A-Z0-9]{8,20}\b/gi);
    const hyphenatedMatches = line.match(/\b[A-Z0-9]{3,10}-[A-Z0-9]{3,10}\b/gi);
    
    // Process Ford-style part numbers first (highest priority)
    if (fordStyleMatches) {
      fordStyleMatches.forEach(number => {
        partNumberPositions.push({ number, lineIndex, line });
      });
    }
    
    if (partNumberMatches) {
      partNumberMatches.forEach(number => {
        // Exclude common part names that might match the regex
        const lowerNumber = number.toLowerCase();
        if (lowerNumber.includes('headlamp') || lowerNumber.includes('headlight') || 
            lowerNumber.includes('condenser') || lowerNumber.includes('radiator') || 
            lowerNumber.includes('assembly') || lowerNumber.includes('assy')) {
          return;
        }
        
        // Double-check it's actually 8+ chars
        if (number.length >= 8) {
          partNumberPositions.push({ number, lineIndex, line });
        }
      });
    }
    
    if (hyphenatedMatches) {
      hyphenatedMatches.forEach(number => {
        // Exclude part names that might have hyphens
        const lowerNumber = number.toLowerCase();
        if (lowerNumber.includes('assy-') || lowerNumber.includes('assembly-')) {
          return;
        }
        
        // For hyphenated numbers, count only alphanumeric chars (ignore hyphens)
        const alphanumericOnly = number.replace(/[^A-Z0-9]/gi, '');
        if (alphanumericOnly.length >= 8) {
          partNumberPositions.push({ number, lineIndex, line });
        }
      });
    }
    
    // Look for part names and collect them with context
    // Handle multiple keywords in single line with priority
    let partName = '';
    let context = '';
    
    // Helper function to detect L/R context with enhanced standalone detection
    const detectContext = (text: string): string => {
      // Check for explicit LH/RH or Left/Right
      if (/\b(rh|right)\b/i.test(text)) return 'RH';
      if (/\b(lh|left)\b/i.test(text)) return 'LH';
      
      // Check for standalone R or L (with word boundaries, parentheses, or at line ends)
      if (/(\s+R\s*$|\s+R\s+|^\s*R\s+|\(R\)|\[R\]|,\s*R\s*)/i.test(text)) return 'RH';
      if (/(\s+L\s*$|\s+L\s+|^\s*L\s+|\(L\)|\[L\]|,\s*L\s*)/i.test(text)) return 'LH';
      
      return '';
    };
    
    // Check for daytime headlamps first (highest priority - overrides regular headlamp detection)
    if ((line.toLowerCase().includes('headlamp') || line.toLowerCase().includes('headlight') || line.toLowerCase().includes('lamp assy-head')) && 
        (line.toLowerCase().includes('daytime') || line.toLowerCase().includes('combination'))) {
      context = detectContext(line);
      partName = 'DayLight';
    } else if (line.toLowerCase().includes('headlamp') || line.toLowerCase().includes('headlight') || line.toLowerCase().includes('lamp assy-head')) {
      context = detectContext(line);
      partName = 'Headlamp';
    } else if (line.toLowerCase().includes('daylight') || line.toLowerCase().includes('drl')) {
      context = detectContext(line);
      partName = 'DayLight';
    } else if (line.toLowerCase().includes('condenser') && !line.toLowerCase().includes('bracket')) {
      // Condenser has highest priority when multiple keywords exist
      partName = 'Condenser';
    } else if (line.toLowerCase().includes('oil cooler') || line.toLowerCase().includes('oilcooler')) {
      // Oil Cooler has second priority
      partName = 'Oil Cooler';
    } else if (line.toLowerCase().includes('radiator') && !line.toLowerCase().includes('bracket')) {
      // Radiator has third priority
      partName = 'Radiator';
    } else if (line.toLowerCase().includes('fan') && !line.toLowerCase().includes('bracket')) {
      partName = 'Fan Assembly';
    } else if (line.toLowerCase().includes('intercooler') && !line.toLowerCase().includes('bracket')) {
      partName = 'Intercooler';
    } else if (line.toLowerCase().includes('rear lamp') || line.toLowerCase().includes('back lamp') || 
               line.toLowerCase().includes('rear light') || line.toLowerCase().includes('back light') ||
               line.toLowerCase().includes('rear combination lamp') || line.toLowerCase().includes('back combination lamp') ||
               line.toLowerCase().includes('tail lamp') || line.toLowerCase().includes('tail light') ||
               line.toLowerCase().includes('tail combination lamp') || line.toLowerCase().includes('lens and body rear combination lamp')) {
      // Handle rear lamp detection with enhanced context detection
      context = detectContext(line);
      partName = 'Rear Lamp';
    } else if (line.toLowerCase().includes('corner') || line.toLowerCase().includes('rear corner radar') || 
               line.toLowerCase().includes('rear corner') || line.toLowerCase().includes('lh - rear corner radar') || 
               line.toLowerCase().includes('rh - rear corner radar')) {
      // Handle blindspot sensor detection with enhanced context detection
      context = detectContext(line);
      if (context === 'RH') {
        partName = 'Right Blindspot Sensor';
      } else if (context === 'LH') {
        partName = 'Left Blindspot Sensor';
      } else {
        // Default to Left if no side context is specified
        context = 'LH';
        partName = 'Left Blindspot Sensor';
      }
    } else if (line.toLowerCase().includes('radar') || 
               line.toLowerCase().includes('distance') || 
               line.toLowerCase().includes('sonar') ||
               line.toLowerCase().includes('collision') || 
               line.toLowerCase().includes('mitigation') ||
               line.toLowerCase().includes('speed sensor') ||
               line.toLowerCase().includes('crash') ||
               (line.toLowerCase().includes('bracket') && line.toLowerCase().includes('sensor')) ||
               line.toLowerCase().includes('sensor assy') || 
               line.toLowerCase().includes('sensor assembly') ||
               line.toLowerCase().includes('les bracket') ||
               // Fallback: generic 'sensor' without blindspot/parking keywords
               (line.toLowerCase().includes('sensor') && 
                !line.toLowerCase().includes('parking') && 
                !line.toLowerCase().includes('park assist'))) {
      partName = 'Radar Sensor';
    } else if (line.toLowerCase().includes('auxiliary radiator') || line.toLowerCase().includes('aux radiator') || line.toLowerCase().includes('aux.radiator')) {
      partName = 'Auxiliary Radiator';
    }
    
    // Only add if we found a valid part name
    if (partName) {
      // For Nissan-style layouts, clean up additional unnecessary text
      let cleanLine = line;
      if (line.includes('ASSY-')) {
        cleanLine = cleanLine.replace(/ASSY-[A-Z]+/g, ''); // Remove "ASSY-LH", "ASSY-RH" etc.
      }
      if (line.includes('ASSY')) {
        cleanLine = cleanLine.replace(/\s*ASSY\s*/g, ''); // Remove standalone "ASSY"
      }
      if (line.includes('& MOTOR')) {
        cleanLine = cleanLine.replace(/\s*&\s*MOTOR\s*/g, ''); // Remove "& MOTOR" text
      }
      
      partNamePositions.push({ name: partName, lineIndex, line: cleanLine, context });
    }
  }
  
  // Check if this is a Nissan-style layout
  // Nissan can have either:
  // 1. Grouped format: part names together, then part numbers together
  // 2. Mixed format: part names and part numbers scattered throughout
  const isNissanStyle = partNamePositions.length > 0 && partNumberPositions.length > 0 && 
    (Math.min(...partNamePositions.map(p => p.lineIndex)) < Math.min(...partNumberPositions.map(p => p.lineIndex)) || // Grouped format
    partNamePositions.length >= 5); // Mixed format (Nissan typically has 5+ parts)

  if (isNissanStyle) {
    // Nissan-style: intelligent grouping and merging with 8+ character filtering
    
    // Filter to only valid part numbers (8+ real characters, excluding special chars)
    const validPartNumbers = partNumberPositions.filter(pn => {
      const realLength = pn.number.replace(/[^A-Z0-9]/gi, '').length;
      return realLength >= 8; // Must be 8+ real characters
    });
    
    // Group and merge parts by name, handling duplicates and variations
    const partGroups = new Map<string, { name: string; partNumbers: string[]; context: string; count: number }>();
    
    for (const partName of partNamePositions) {
      let normalizedName = partName.name;
      let context = partName.context || '';
      
      // Normalize part names to group similar entries
      if (partName.name === 'Headlamp') {
        if (partName.context === 'RH' || partName.line.toLowerCase().includes('rh') || partName.line.toLowerCase().includes('right')) {
          normalizedName = 'Right Headlamp';
          context = 'RH';
        } else if (partName.context === 'LH' || partName.line.toLowerCase().includes('lh') || partName.line.toLowerCase().includes('left')) {
          normalizedName = 'Left Headlamp';
          context = 'LH';
        } else {
          normalizedName = 'Left Headlamp'; // Default
          context = 'LH';
        }
      } else if (partName.name === 'DayLight') {
        if (partName.context === 'RH' || partName.line.toLowerCase().includes('rh') || partName.line.toLowerCase().includes('right')) {
          normalizedName = 'Right DayLight';
          context = 'RH';
        } else if (partName.context === 'LH' || partName.line.toLowerCase().includes('lh') || partName.line.toLowerCase().includes('left')) {
          normalizedName = 'Left DayLight';
          context = 'LH';
        } else {
          normalizedName = 'Left DayLight'; // Default
          context = 'LH';
        }
      } else if (partName.name === 'Blindspot Sensor') {
        if (partName.context === 'RH' || partName.line.toLowerCase().includes('rh') || partName.line.toLowerCase().includes('right')) {
          normalizedName = 'Right Blindspot Sensor';
          context = 'RH';
        } else if (partName.context === 'LH' || partName.line.toLowerCase().includes('lh') || partName.line.toLowerCase().includes('left')) {
          normalizedName = 'Left Blindspot Sensor';
          context = 'LH';
        } else {
          normalizedName = 'Left Blindspot Sensor'; // Default
          context = 'LH';
        }
      } else if (partName.name === 'Rear Lamp') {
        if (partName.context === 'RH' || partName.line.toLowerCase().includes('rh') || partName.line.toLowerCase().includes('right')) {
          normalizedName = 'Right Rear Lamp';
          context = 'RH';
        } else if (partName.context === 'LH' || partName.line.toLowerCase().includes('lh') || partName.line.toLowerCase().includes('left')) {
          normalizedName = 'Left Rear Lamp';
          context = 'LH';
        } else {
          normalizedName = 'Left Rear Lamp'; // Default
          context = 'LH';
        }
      }
      
      // Add to existing group or create new one
      if (partGroups.has(normalizedName)) {
        // Part already exists, increment count
        const existing = partGroups.get(normalizedName)!;
        existing.count++;
        if (context && !existing.context.includes(context)) {
          existing.context = existing.context ? `${existing.context}, ${context}` : context;
        }
      } else {
        // Create new part group
        partGroups.set(normalizedName, {
          name: normalizedName,
          partNumbers: [],
          context,
          count: 1
        });
      }
    }
    
    // Assign part numbers to each part group, handling duplicates
    let partNumberIndex = 0;
    for (const [groupName, groupData] of partGroups) {
      
      // For duplicate parts, collect all part numbers but create single entry
      const partNumbersToAssign = Math.min(groupData.count, validPartNumbers.length - partNumberIndex);
      const collectedPartNumbers: string[] = [];
      
      for (let i = 0; i < partNumbersToAssign; i++) {
        if (partNumberIndex < validPartNumbers.length) {
          const partNumber = validPartNumbers[partNumberIndex];
          collectedPartNumbers.push(partNumber.number);
          partNumberIndex++;
        }
      }
      
      // Create single entry with all part numbers (comma-separated)
      if (collectedPartNumbers.length > 0) {
        const finalPartNumber = collectedPartNumbers.join(', ');
        
        parts.push({
          partName: groupData.name,
          partNumber: finalPartNumber,
          confidence: 0.9,
          context: groupData.context || undefined,
          rawText: ocrText,
          list_price: undefined // Fallback doesn't extract prices
        });
      }
      
      // Limit to maximum 9 parts (as per your updated prompt)
      if (parts.length >= 9) break;
    }
  } else {
    // Standard layout: spatial matching (closest part number to each part name)
    
    for (const partName of partNamePositions) {
      // Find the closest part number to this part name
      let closestPartNumber = '';
      let minDistance = Infinity;
      
      for (const partNumber of partNumberPositions) {
        const distance = partName.lineIndex - partNumber.lineIndex;
        
        // Prioritize part numbers ABOVE the part name (most common case)
        // Also look for part numbers BELOW (including separate sections)
        if (distance > 0 && distance <= 3) { // Part number is above (within 3 lines)
          if (distance < minDistance && !usedPartNumbers.has(partNumber.number)) {
            minDistance = distance;
            closestPartNumber = partNumber.number;
          }
        } else if (distance < 0 && distance >= -10) { // Part number is below (within 10 lines, including separate sections)
          if (Math.abs(distance) < minDistance && !usedPartNumbers.has(partNumber.number)) {
            minDistance = Math.abs(distance);
            closestPartNumber = partNumber.number;
          }
        }
      }
      
      // If we found a close part number, create the part
      if (closestPartNumber && minDistance <= 10) { // Allow up to 3 lines above, 10 lines below
        let finalPartName = partName.name;
        
        // Add L/R context to headlamps and daylights
        if (partName.name === 'Headlamp') {
          if (partName.context === 'RH') {
            finalPartName = 'Right Headlamp';
          } else if (partName.context === 'LH') {
            finalPartName = 'Left Headlamp';
          } else {
            finalPartName = 'Left Headlamp'; // Default
          }
        } else if (partName.name === 'DayLight') {
          if (partName.context === 'RH') {
            finalPartName = 'Right DayLight';
          } else if (partName.context === 'LH') {
            finalPartName = 'Left DayLight';
          } else {
            finalPartName = 'Left DayLight'; // Default
          }
        }
        
        parts.push({
          partName: finalPartName,
          partNumber: closestPartNumber,
          confidence: 0.8,
          context: partName.context || undefined,
          rawText: ocrText,
          list_price: undefined // Fallback doesn't extract prices
        });
        
        usedPartNumbers.add(closestPartNumber);
        
        // Limit to maximum 5 parts
        if (parts.length >= 5) break;
      }
    }
  }
  
  // If no parts with names were found, extract orphan part numbers
  if (parts.length === 0 && partNumberPositions.length > 0) {
    console.log('📝 No part names found, extracting orphan part numbers');
    
    // Extract all valid part numbers as standalone items
    partNumberPositions.forEach(({ number }) => {
      // Validate: must contain at least one digit and not be all letters
      const hasDigit = /\d/.test(number);
      const isAllLetters = /^[A-Z]+$/i.test(number);
      
      if (hasDigit && !isAllLetters) {
        parts.push({
          partName: 'Part Number',
          partNumber: number,
          confidence: 0.6,
          context: '(Copy to required part)',
          rawText: ocrText,
          list_price: undefined
        });
      }
    });
  }
  
  return parts;
}
