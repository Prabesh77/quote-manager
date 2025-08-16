// Gemini API service for AI-powered part extraction
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

interface GeminiPartResponse {
  partName: string;
  partNumber: string;
  context: string | null;
}

export interface AIPartExtraction {
  partName: string;
  partNumber: string;
  confidence: number; // Keep for compatibility but set to 1.0
  rawText: string;
  context: string | undefined;
}

export interface MultiPartExtraction {
  parts: AIPartExtraction[];
  totalPartsFound: number;
  ignoredContent: string[];
}

/**
 * Extract part information using Gemini AI gemini-2.5-flash-lite
 * Enhanced to handle multiple parts from a single image
 */
export async function extractPartsWithAI(ocrText: string): Promise<AIPartExtraction[]> {
  try {
    // Check if this looks like a Nissan layout (complex, scattered format)
    const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line);
    
    // Nissan indicators: scattered format with mixed parts and numbers
    const hasNissanParts = lines.some(line => 
      line.toLowerCase().includes('headlamp') || 
      line.toLowerCase().includes('radiator') || 
      line.toLowerCase().includes('condenser') || 
      line.toLowerCase().includes('oil cooler')
    );
    
    // Check for Nissan-style scattered format (not clean table)
    const hasScatteredFormat = lines.some(line => 
      line.includes('O ') || line.includes('⚫ ') || line.includes('• ') || // Nissan-style prefixes
      line.includes('ASSY-') || line.includes('& MOTOR') // Nissan-style text
    );
    
    // Check for clean table format (not Nissan)
    const hasCleanTableFormat = lines.some(line => 
      line.includes('Part Number') || line.includes('Part Name') || 
      line.includes('Short Code') || line.includes('Date Range') ||
      /\d{2}\.\d{2}\.\d{4}/.test(line) // Date format like 04.04.2022
    );
    
    // Only skip AI for truly complex Nissan layouts
    if (hasNissanParts && hasScatteredFormat && !hasCleanTableFormat) {
      return fallbackExtraction(ocrText);
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `
You are an expert automotive parts analyst. Analyze the provided OCR text and extract ONLY the MAIN automotive parts according to the rules below.

TEXT TO ANALYZE:
"""
${ocrText}
"""

INSTRUCTIONS:
1. Identify ONLY MAIN automotive parts. Exclude brackets, mounting hardware, bolts, nuts, clips, and other supporting components.
2. Extract part numbers for each MAIN part. A valid part number must contain ≥ 8 letters/digits combined (ignore hyphens, spaces, and special characters when counting). Ignore any shorter numbers.
3. Determine Left/Right context:
   - If text contains "LH", "L", or "Left" → Left
   - If text contains "RH", "R", or "Right" → Right
4. Focus on returning 2–9 MAIN parts maximum, but output no more than the first 5 valid parts found in text order.
5. Extract part numbers that are clearly associated with each part.
6. PART NUMBER PATTERNS: Look for these formats as they are most likely part numbers:
   - Hyphenated format: "21606-EB405", "26060-5X00B", "92120-EB400" (these are almost always part numbers)
   - Alphanumeric codes: "21460EB31B", "8110560K40" (8+ characters)
7. Ignore irrelevant short codes like "10", "50", "110", "001" (these are quantities or prices, not part numbers).
8. Keep part numbers clean — e.g., "8110560K40" not "8110560K40 UNIT ASSY".
9. SINGLE LINE RULE: If multiple keywords appear in one line (e.g., "O FAN & MOTOR ASSY-CONDENSER"), select the LAST keyword as the part name with this priority: Condenser > Oil Cooler > Radiator > Fan > Motor > Assembly.

IMPORTANT RULES:
- Use these exact standardized part names:
  'Left Headlamp', 'Right Headlamp', 'Left DayLight', 'Right DayLight', 'Radiator', 'Condenser', 'Fan Assembly', 'Intercooler', 'Radar Sensor', 'Headlight Left', 'Headlight Right', 'Oil Cooler', 'Auxiliary Radiator'
- Part naming priority:
  * RADIATOR: If "RADIATOR" is found, use "Radiator" instead of generic radiator terms
  * CONDENSER: If "CONDENSER" is found, use "Condenser" instead of "Refrigerant Condenser" or generic condenser terms
  * Only use "Refrigerant Condenser" if no specific "Condenser" is found
  * Only use generic radiator terms if no specific "RADIATOR" is found
  * If both "Headlamp" and "DayLight" appear in the same name → prioritize "Headlamp"
- For headlamps: If text contains RH/R/Right → 'Right Headlamp', if LH/L/Left → 'Left Headlamp'
- For daylights: If text contains RH/R/Right → 'Right DayLight', if LH/L/Left → 'Left DayLight'
- PART NUMBER LENGTH: Only extract part numbers with ≥ 8 REAL alphanumeric characters (ignore special chars like hyphens)
- MAXIMUM 5 MAIN PARTS per response
- IGNORE: brackets, mounting hardware, bolts, nuts, clips, supporting components

RESPONSE FORMAT (JSON only):
{
  "parts": [
    {
      "partName": "Standardized part name",
      "partNumber": "Clean part number only",
      "context": "L/R context if applicable"
    }
  ],
  "totalPartsFound": "Number of parts found",
  "ignoredContent": ["List of irrelevant content that was ignored"]
}
`;


    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const aiResponse: MultiPartExtraction = JSON.parse(jsonMatch[0]);
    
    // Validate and format the response
    if (!aiResponse.parts || !Array.isArray(aiResponse.parts)) {
      throw new Error('Invalid AI response format - parts array missing');
    }
    
    const extractedParts: AIPartExtraction[] = aiResponse.parts.map(part => ({
      partName: part.partName,
      partNumber: part.partNumber,
      confidence: 1.0,
      rawText: ocrText,
      context: part.context || undefined
    }));
    
    return extractedParts;
    
  } catch (error) {
    console.error('AI extraction failed, falling back to basic extraction:', error);
    // Fallback to basic extraction
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
    // IMPORTANT: Exclude common part names that might match the regex
    const partNumberMatches = line.match(/\b[A-Z0-9]{8,20}\b/gi);
    const hyphenatedMatches = line.match(/\b[A-Z0-9]{3,10}-[A-Z0-9]{3,10}\b/gi);
    
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
    
    if (line.toLowerCase().includes('headlamp') || line.toLowerCase().includes('headlight')) {
      if (/\b(rh|r\b|right)\b/i.test(line)) {
        context = 'RH';
      } else if (/\b(lh|l\b|left)\b/i.test(line)) {
        context = 'LH';
      }
      partName = 'Headlamp';
    } else if (line.toLowerCase().includes('daylight') || line.toLowerCase().includes('drl')) {
      if (/\b(rh|r\b|right)\b/i.test(line)) {
        context = 'RH';
      } else if (/\b(lh|l\b|left)\b/i.test(line)) {
        context = 'LH';
      }
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
    } else if (line.toLowerCase().includes('radar') || line.toLowerCase().includes('sensor')) {
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
          rawText: ocrText
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
          rawText: ocrText
        });
        
        usedPartNumbers.add(closestPartNumber);
        
        // Limit to maximum 5 parts
        if (parts.length >= 5) break;
      }
    }
  }
  
  return parts;
}
