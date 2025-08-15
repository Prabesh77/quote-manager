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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `
You are an expert automotive parts analyst. Extract ONLY the MAIN automotive parts from the following text.

TEXT TO ANALYZE:
"""
${ocrText}
"""

INSTRUCTIONS:
1. Identify ONLY the MAIN automotive parts (not brackets, mounting hardware, or supporting components)
2. Extract part numbers for each MAIN part (alphanumeric codes, MUST be 8+ REAL alphanumeric characters - ignore shorter numbers and count only letters/numbers, not special characters)
3. Determine Left/Right specificity for each part (look for L, R, LH, RH, Left, Right indicators)
4. IGNORE: brackets, mounting hardware, bolts, nuts, clips, or supporting components
5. Focus on finding 2-5 MAIN parts maximum
6. IMPORTANT: Match part names with their CLOSEST part numbers in the text layout
7. PART NUMBER PATTERN: In most cases, part numbers appear ABOVE the part name (within 1-3 lines)
8. NISSAN STYLE: Some brands may have part numbers BELOW the part name

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

IMPORTANT RULES:
- Use these exact part names: 'Left Headlamp', 'Right Headlamp', 'Left DayLight', 'Right DayLight', 'Radiator', 'Condenser', 'Fan Assembly', 'Intercooler', 'Radar Sensor', 'Headlight Left', 'Headlight Right', 'Oil Cooler', 'Auxiliary Radiator'
- PRIORITY RULES for part naming:
  * RADIATOR: If "RADIATOR" (specific) is found, use that instead of "REFRIGERANT CONDENSER" or generic radiator terms
  * CONDENSER: If "CONDENSER" (specific) is found, use that instead of "REFRIGERANT CONDENSER" or generic condenser terms
  * Only use "REFRIGERANT CONDENSER" if no specific "CONDENSER" is found
  * Only use generic radiator terms if no specific "RADIATOR" is found
- SPATIAL MATCHING: Match part names with their CLOSEST part numbers in the text layout
- IGNORE THESE: brackets, mounting hardware, bolts, nuts, clips, supporting components
- For headlamps: If text contains RH/R/Right → 'Right Headlamp', if LH/L/Left → 'Left Headlamp'
- For daylights: If text contains RH/R/Right → 'Right DayLight', if LH/L/Left → 'Left DayLight'
- PART NUMBER LENGTH: Only extract part numbers that are 8+ REAL alphanumeric characters long (ignore special chars like hyphens)
- IGNORE SHORT NUMBERS: Numbers like "10", "50", "110", "001" are NOT part numbers (they are quantities, prices, or codes)
- SINGLE LINE RULE: If multiple part keywords appear in one line (e.g., "O FAN & MOTOR ASSY-CONDENSER"), use the LAST keyword as the main part
- PRIORITY ORDER: When multiple keywords in one line, prioritize: Condenser > Oil Cooler > Radiator > Fan > Motor > Assembly
- SPATIAL MATCHING: Part numbers may be in a separate section below all part names - look for the closest match in the entire text
- Part numbers should be clean (e.g., "8110560K40" not "8110560K40 UNIT ASSY")
- Look for multiple instances of the same part type (e.g., both left and right headlamps)
- Return valid JSON only
- Maximum 5 MAIN parts per response
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
    const partNumberMatches = line.match(/\b[A-Z0-9]{8,20}\b/gi);
    const hyphenatedMatches = line.match(/\b[A-Z0-9]{3,10}-[A-Z0-9]{3,10}\b/gi);
    
    if (partNumberMatches) {
      partNumberMatches.forEach(number => {
        // Double-check it's actually 8+ chars
        if (number.length >= 8) {
          partNumberPositions.push({ number, lineIndex, line });
        }
      });
    }
    
    if (hyphenatedMatches) {
      hyphenatedMatches.forEach(number => {
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
      console.log(`Detected part: ${partName} from line: "${line}" (cleaned: "${cleanLine}")`);
    }
  }
  
  // Check if this is a Nissan-style layout (part names grouped, then part numbers grouped separately)
  const isNissanStyle = partNamePositions.length > 0 && partNumberPositions.length > 0 && 
    Math.min(...partNamePositions.map(p => p.lineIndex)) < Math.min(...partNumberPositions.map(p => p.lineIndex));

  if (isNissanStyle) {
    // Nissan-style: simple sequential matching (first part name → first part number)
    console.log('Detected Nissan-style layout, using simple sequential matching');
    
    // Filter to only valid part numbers (8+ real characters)
    const validPartNumbers = partNumberPositions.filter(pn => {
      const realLength = pn.number.replace(/[^A-Z0-9]/gi, '').length;
      return realLength >= 8;
    });
    
    console.log(`Found ${validPartNumbers.length} valid part numbers:`, validPartNumbers.map(pn => pn.number));
    console.log('Part names in order:', partNamePositions.map(p => p.name));
    
    // Simple sequential matching
    for (let i = 0; i < partNamePositions.length && i < validPartNumbers.length; i++) {
      const partName = partNamePositions[i];
      const partNumber = validPartNumbers[i];
      
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
        partNumber: partNumber.number,
        confidence: 0.9,
        context: partName.context || undefined,
        rawText: ocrText
      });
      
      console.log(`Matched: ${finalPartName} → ${partNumber.number}`);
      
      // Limit to maximum 5 parts
      if (parts.length >= 5) break;
    }
  } else {
    // Standard layout: spatial matching (closest part number to each part name)
    console.log('Using standard spatial matching for non-Nissan layout');
    
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
