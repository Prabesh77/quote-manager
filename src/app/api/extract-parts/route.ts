import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini with server-side API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface GeminiPartResponse {
  partName: string;
  partNumber: string;
  context: string | null;
  list_price?: number;
}

interface AIPartExtraction {
  partName: string;
  partNumber: string;
  confidence: number;
  rawText: string;
  context: string | undefined;
  list_price?: number;
}

// Helper function to clean part numbers
function cleanPartNumber(partNumber: string): string {
  if (!partNumber) return '';
  
  // Check if this is multiple part numbers (contains comma)
  if (partNumber.includes(',')) {
    // Split by comma, clean each part individually, then rejoin with comma
    return partNumber
      .split(',')
      .map(num => num
        .replace(/\s+/g, '') // Remove whitespaces
        .replace(/[^a-zA-Z0-9]/g, '') // Remove special chars except comma
        .toUpperCase()
      )
      .filter(num => num.length > 0) // Remove empty strings
      .join(','); // Rejoin with comma
  }
  
  // Single part number - remove all whitespaces and special characters
  return partNumber
    .replace(/\s+/g, '') // Remove all whitespaces
    .replace(/[^a-zA-Z0-9]/g, '') // Remove ALL special chars
    .toUpperCase(); // Ensure uppercase
}

export async function POST(request: NextRequest) {
  try {
    const { ocrText } = await request.json();

    if (!ocrText || typeof ocrText !== 'string') {
      return NextResponse.json(
        { error: 'Invalid OCR text provided' },
        { status: 400 }
      );
    }

    // Check if this is just a part number without any part description
    const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line);
    const cleanText = ocrText.trim().toLowerCase();
    
    // Check if text contains any part names/descriptions
    const hasPartDescriptions = 
      cleanText.includes('headlamp') || cleanText.includes('headlight') ||
      cleanText.includes('radiator') || cleanText.includes('condenser') ||
      cleanText.includes('sensor') || cleanText.includes('lamp') ||
      cleanText.includes('assembly') || cleanText.includes('assy') ||
      cleanText.includes('cooler') || cleanText.includes('intercooler') ||
      cleanText.includes('fan') || cleanText.includes('blower') ||
      cleanText.includes('camera') || cleanText.includes('radar') ||
      cleanText.includes('bracket') || cleanText.includes('mount');
    
    // If no part descriptions and text is short (likely just part numbers), use fallback
    if (!hasPartDescriptions && ocrText.length < 200) {
      console.log('📝 Detected orphan part numbers (no descriptions), using fallback');
      return NextResponse.json({ useFallback: true });
    }
    
    const hasNissanParts = lines.some(line => 
      line.toLowerCase().includes('headlamp') || 
      line.toLowerCase().includes('radiator') || 
      line.toLowerCase().includes('condenser') || 
      line.toLowerCase().includes('oil cooler')
    );
    
    const hasScatteredFormat = lines.some(line => 
      line.includes('O ') || line.includes('⚫ ') || line.includes('• ') ||
      line.includes('ASSY-') || line.includes('& MOTOR')
    );
    
    const hasCleanTableFormat = lines.some(line => 
      line.includes('Part Number') || line.includes('Part Name') || 
      line.includes('Short Code') || line.includes('Date Range') ||
      /\d{2}\.\d{2}\.\d{4}/.test(line)
    );
    
    // Only skip AI for truly complex Nissan layouts
    if (hasNissanParts && hasScatteredFormat && !hasCleanTableFormat) {
      // Return signal to use fallback on frontend
      return NextResponse.json({ useFallback: true });
    }
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `
You are an expert automotive parts analyst. Analyze the provided OCR text and extract ONLY the MAIN automotive parts according to the rules below.

⚠️ **CRITICAL MERCEDES RULE - READ THIS FIRST**:
If you see a SINGLE LETTER (like "A" or "B") followed by SPACES and NUMBERS (like "A 246 500 04 54"), that letter is PART OF THE PART NUMBER. You MUST include it in your output. "A 246 500 04 54" becomes "A2465000454" NOT "2465000454".

TEXT TO ANALYZE:
"""
${ocrText}
"""

INSTRUCTIONS:
1. Identify ONLY MAIN automotive parts. Exclude brackets, mounting hardware, bolts, nuts, clips, and other supporting components.

3. PART NUMBER VALIDATION (CRITICAL):
   - A valid part number MUST contain at least ONE DIGIT (numbers 0-9)
   - A valid part number MUST have ≥ 8 total alphanumeric characters (ignore hyphens, spaces when counting)
   - REJECT any "part number" that is ALL LETTERS (e.g., "Description", "HEADLAMP", "CONDENSER") - these are NOT part numbers
   - Part numbers can ONLY be: all numbers (e.g., "12345678") OR mixed letters+numbers (e.g., "ABC12345", "A1234567B")
   - Examples of INVALID part numbers: "DESCRIPTION", "HEADLAMP", "ASSEMBLY", "CONDENSER" (all letters, no digits)
   - Examples of VALID part numbers: "92101P1040", "A2349013506", "JB3Z13008A", "LR100570", "JB3B13D154AD", "JB3Z13008A", "260106KG0B", "21460-4JA1A"

4. SUPERSESSION DETECTION (CRITICAL):
   - ALWAYS check if there are MULTIPLE part numbers for the SAME part name
   - If multiple valid part numbers appear near the same part description, extract ALL of them (they are supersessions)
   - Look for patterns like:
     * "JB3B13D154AD\\nJB3Z13008A\\nHEADLAMP ASSY, RH" → Both numbers are for Right Headlamp
     * "12345678\\n87654321\\nRadiator" → Both numbers are for Radiator
   - **CRITICAL**: When multiple part numbers found, combine them with commas (NO SPACES): "12345678,87654321"
   - **IMPORTANT**: Do NOT concatenate without commas. "JB3B13D154AD,JB3Z13008A" is CORRECT. "JB3B13D154ADJB3Z13008A" is WRONG.
   - Ford vehicles often have 2-5 supersession numbers per part - extract ALL of them separated by commas

5. PART-TO-NUMBER PAIRING AND GROUPING (CRITICAL):
   - Part numbers appear on the line(s) DIRECTLY ABOVE or BEFORE the part description
   - **When there are MULTIPLE part descriptions for DIFFERENT sides (LH and RH), distribute the part numbers intelligently:**
     * If you see 4 part numbers followed by "HEADLAMP RH" and "HEADLAMP LH", the first 2 numbers go to RH, next 2 to LH
     * If you see 2 part numbers followed by "HEADLAMP RH" and "HEADLAMP LH", the first number goes to RH, second to LH
     * Example: "NUM1\\nNUM2\\nNUM3\\nNUM4\\nHEADLAMP RH\\nHEADLAMP LH" → RH gets NUM1,NUM2 and LH gets NUM3,NUM4
   - Basic pairing examples:
     * "92101P1040\\nLAMP ASSY-HEAD, LH" → Part Number: 92101P1040, Part Name: Left Headlamp
     * "99110P1000\\nUNIT ASSY-FRONT RADAR" → Part Number: 99110P1000, Part Name: Radar Sensor
   - Supersession example: "JB3B13D154AD\\nJB3Z13008A\\nHEADLAMP" → Part Numbers: JB3B13D154AD,JB3Z13008A

6. Extract prices when available. Look for prices with $ signs (e.g., $125.50, $89.99, A$855.86). Handle various currency formats including A$ (Australian dollars).

7. Left/Right Detection (CHECK IN THIS ORDER - HIGHEST PRIORITY FIRST):
   - If text contains "(R)" anywhere (beginning, middle, or end) → Right
   - If text contains "(L)" anywhere (beginning, middle, or end) → Left
   - If text contains "[R]" anywhere → Right
   - If text contains "[L]" anywhere → Left
   - If text contains "RH" or "(RH)" → Right
   - If text contains "LH" or "(LH)" → Left
   - If text contains " R " (R with spaces around it) → Right
   - If text contains " L " (L with spaces around it) → Left
   - If text contains "Right" → Right
   - If text contains "Left" → Left
   - If text ends with " R" or starts with "R " → Right
   - If text ends with " L" or starts with "L " → Left
   - Examples:
     * "UNIT(R),HEAD LAMP" → Right (R) detected at beginning)
     * "UNIT(L),HEAD LAMP" → Left ((L) detected)
     * "LAMP ASSY (L)" → Left
     * "Condenser (R)" → Right
     * "(R) HEADLAMP" → Right
     * "HEADLAMP LH" → Left
     * "HEADLAMP RH" → Right

8. PART NUMBER IN PARENTHESES RULE:
   - If a part number appears in parentheses like "(ABC12345)" or "(12345678)", it should be IGNORED
   - Only extract part numbers that are NOT wrapped in parentheses
   - Example: "LR100570\\nCondenser\\n(JPLA19C600AC)" → Extract only "LR100570", ignore "(JPLA19C600AC)"

9. Focus on returning 2–9 MAIN parts maximum, but output no more than the first 8 valid parts found in text order.

10. PART NUMBER PATTERNS: Look for these formats as they are most likely part numbers:
   - **MERCEDES FORMAT**: Single letter + 9-13 digits (e.g., "A2349013506", "B1234567890")
     * CRITICAL: ALWAYS include the leading letter (A, B, C, etc.)
   - **FORD FORMAT (HIGHEST PRIORITY)**: PREFIX (2-4 letters ending in Z) + SPACE + NUMBER with optional hyphen
     * Examples: "N1WZ 9E731-D", "ML3Z 9E731-E", "P1WZ 14C022-B", "F1FZ 16607-AA", "JB3Z 13008 A"
     * CRITICAL: ALWAYS extract the COMPLETE part number INCLUDING the prefix
     * Common prefixes: N1WZ, ML3Z, P1WZ, F1FZ, E1FZ, C1FZ, D1FZ, JB3Z, JB3B, etc.
   - Hyphenated format: "21606-EB405", "26060-5X00B", "92120-EB400"
   - Alphanumeric codes: "21460EB31B", "8110560K40", "LR100570" (8+ characters, must contain digits)

11. Ignore irrelevant short codes like "10", "50", "110", "001" (these are quantities or prices, not part numbers).

12. Keep part numbers clean — e.g., "8110560K40" not "8110560K40 UNIT ASSY".

13. SINGLE LINE RULE: If multiple keywords appear in one line (e.g., "O FAN & MOTOR ASSY-CONDENSER"), select the LAST keyword as the part name with this priority: Condenser > Oil Cooler > Radiator > Fan > Motor > Assembly.

14. HEADLAMP DETECTION RULES:
    - "LAMP ASSY-HEAD" or "HEAD LAMP ASSY" → 'Headlamp' (this is Hyundai/Kia format)
    - If contains "LH" or "L" or "Left" → 'Left Headlamp'
    - If contains "RH" or "R" or "Right" → 'Right Headlamp'
    - DAYTIME HEADLAMP RULE: If a line contains 'headlamp' or 'headlight' WITH 'daytime' or 'combination' → classify as 'DayLight' (NOT 'Headlamp')

15. CAMERA DETECTION: If text contains 'camera' keyword → classify as 'Camera'. This is definitive and takes priority over other sensor types.

16. SENSOR DETECTION RULES (PRIORITY ORDER - CHECK IN THIS SEQUENCE):
    - BLINDSPOT SENSOR KEYWORDS: If text contains 'corner', 'rear corner', 'corner radar', 'rear corner radar', 'blindspot', 'blind spot', 'bsd' → classify as 'Blindspot Sensor' (Left or Right based on L/R context)
    - RADAR SENSOR KEYWORDS: If text contains ANY of these keywords → classify as 'Radar Sensor':
      * 'radar', 'radar sensor'
      * 'distance', 'distance sensor'
      * 'sonar', 'sonar sensor'
      * 'collision', 'collision mitigation', 'fwd collision mitigation system', 'forward collision mitigation', 'fcms'
      * 'mitigation', 'mitigation system'
      * 'speed', 'speed sensor'
      * 'crash', 'crash sensor'
      * 'bracket' (when combined with sensor)
      * 'sensor assy', 'sensor assembly'
    - FALLBACK RULE: If text contains 'sensor' but NO specific sensor type keywords above AND NO camera → Default to 'Radar Sensor'
    - PARKING SENSOR: Only classify as 'Parking Sensor' if text explicitly contains 'parking' or 'park assist'
    - For blindspot sensors: Use L/R context to determine 'Left Blindspot Sensor' or 'Right Blindspot Sensor'

17. FORD-SPECIFIC RULES:
    - FORD PART NUMBER FORMAT: Ford part numbers have a SPECIFIC format: PREFIX (2-4 letters ending in Z) + SPACE + NUMBER (with optional hyphen)
      * Examples: "N1WZ 9E731-D", "ML3Z 9E731-E", "P1WZ 14C022-B", "F1FZ 16607-AA"
      * CRITICAL: ALWAYS extract the COMPLETE part number INCLUDING the prefix
      * DO NOT extract just "9E731-D" when the full number is "N1WZ 9E731-D"
      * Common Ford prefixes: N1WZ, ML3Z, P1WZ, F1FZ, E1FZ, C1FZ, D1FZ, etc. (always end with 'Z')
    - FORD PART NUMBER SELECTION: When multiple values look like part numbers, prioritize the one that:
      * Has spaces in it (e.g., "N1WZ 9E731-D" vs "9E731D")
      * Includes the prefix before the space
    - FORD RADAR SENSOR DETECTION: If text contains 'Sensor Assy' OR 'Less Bracket' OR 'Les Bracket' → classify as 'Radar Sensor' for Ford cars
18. Honda part numbers are always connected by hyphens .e.g 80110-SNL-A03. You can ignore rest of the numbers and only use hyphen connected chars as part number. For example in this case ‘0 80110-SNL-A03’, only ‘80110-SNL-A03’ is part number.
CRITICAL SUPERSESSION RULES:
19. BMW rules:The part numbers of BMW looks like this, 63 117 478 153. The part number is never less than 10 chars in BMW and part numbers includes white space in between. Please make sure you capture all part numbers (normally 8 to 11) characters. Don’t miss the part number as it might be a bit confusing because of white space in between.

GENERAL
- NEVER leave a part without a part number if there are unused part numbers available
- If you extract 2 parts (RH and LH) and there are 4 part numbers, BOTH parts should get 2 numbers each
- If you extract 2 parts (RH and LH) and there are 2 part numbers, each part gets 1 number
- If there are more part numbers than parts, distribute them evenly or pair them logically
- Example: 4 numbers + 2 headlamps (RH + LH) → First 2 numbers to RH, last 2 to LH

IMPORTANT RULES:
- Use these exact standardized part names:
  'Left Headlamp', 'Right Headlamp', 'Left DayLight', 'Right DayLight', 'Left Rear Lamp', 'Right Rear Lamp', 'Radiator', 'Condenser', 'Fan Assembly', 'Intercooler', 'Left Intercooler', 'Right Intercooler', 'Add Cooler', 'Radar Sensor', 'Headlight Left', 'Headlight Right', 'Oil Cooler', 'Auxiliary Radiator', 'Camera', 'Parking Sensor', 'Left Blindspot Sensor', 'Right Blindspot Sensor', 'Blower Assembly'
- HEADLAMP VARIATIONS: Recognize these as headlamps:
  * "LAMP ASSY-HEAD" (Hyundai/Kia format)
  * "HEAD LAMP ASSY"
  * "HEADLAMP ASSY"
  * "LAMP ASSY, HEADLAMP"
- BLOWER/FAN DETECTION: If text contains "BLOWER ASSY" or "BLOWER ASSEMBLY" → classify as 'Fan Assembly' or 'Blower Assembly'
- COMBINATION LAMP DETECTION: If text contains "LAMP ASSY,COMBINATION" or "combination lamp" → classify as 'DayLight' (NOT 'Headlamp')
- For combination lamps: If text contains RH/R/Right → 'Right DayLight', if LH/L/Left → 'Left DayLight'
- Part naming priority:
  * RADIATOR: If "RADIATOR" is found, use "Radiator" instead of generic radiator terms
  * AUXILIARY RADIATOR: If text contains "auxiliary radiator", "additional radiator", "lowtemp radiator", "left radiator" OR part number starts with "G9" → classify as "Auxiliary Radiator" (NOT "Radiator")
  * INTERCOOLER VARIATIONS: 
    - If text contains "left intercooler", "lh intercooler", "intercooler left" → classify as "Left Intercooler"
    - If text contains "right intercooler", "rh intercooler", "intercooler right" → classify as "Right Intercooler"  
    - If text contains "add cooler", "additional cooler" → classify as "Add Cooler"
    - If text contains just "intercooler" without L/R context → use generic "Intercooler"
  * CONDENSER: If "CONDENSER" is found, use "Condenser" instead of "Refrigerant Condenser" or generic condenser terms
  * Only use "Refrigerant Condenser" if no specific "Condenser" is found
  * Only use generic radiator terms if no specific "RADIATOR" is found
  * If both "Headlamp" and "DayLight" appear in the same name → prioritize "Headlamp"
- For headlamps: If text contains RH/R/Right → 'Right Headlamp', if LH/L/Left → 'Left Headlamp'
- For daylights: If text contains RH/R/Right → 'Right DayLight', if LH/L/Left → 'Left DayLight'
- DAYTIME HEADLAMP DETECTION: If text contains 'headlamp' or 'headlight' WITH 'daytime' or 'combination' → classify as 'DayLight' (NOT 'Headlamp')
- COMBINATION LAMP ASSEMBLY: If text contains "LAMP ASSY,COMBINATION" or "combination lamp assembly" → always classify as 'DayLight' regardless of other keywords
- EXAMPLE: "LAMP ASSY,COMBINATION, FR RH" with price "A$855.86" → 'Right DayLight' with list_price: 855.86
- REAR LAMP DETECTION: If text contains "rear lamp", "back lamp", "rear light", "back light", "rear combination lamp", "back combination lamp", "tail lamp", "tail light", "tail combination lamp", "lens and body rear combination lamp" → classify as 'Rear Lamp' (Left or Right based on L/R context)
- REAR LAMP CONTEXT: 
  - If text contains "rear lamp lh", "rear combination lamp lh", "rear lamp l", "back lamp left", "tail lamp lh", "tail lamp l", "tail lamp left" → 'Left Rear Lamp'
  - If text contains "rear lamp rh", "rear combination lamp rh", "rear lamp r", "back lamp right", "tail lamp rh", "tail lamp r", "tail lamp right" → 'Right Rear Lamp'
  - If no L/R context is specified for rear lamp → default to 'Left Rear Lamp'
- PART NUMBER LENGTH: Only extract part numbers with ≥ 8 REAL alphanumeric characters (ignore special chars like hyphens)
- MAXIMUM 8 MAIN PARTS per response
- IGNORE: brackets, mounting hardware, bolts, nuts, clips, supporting components
- DUPLICATE HANDLING: If multiple instances of the same part type exist (e.g., multiple "Radiator" entries), extract each one separately - the system will automatically group them

RESPONSE FORMAT (JSON only):
{
  "parts": [
    {
      "partName": "Standardized part name",
      "partNumber": "Clean part number only",
      "context": "L/R context if applicable",
      "list_price": 125.50
    }
  ],
  "totalPartsFound": "Number of parts found",
  "ignoredContent": ["List of irrelevant content that was ignored"]
}

EXAMPLE EXTRACTIONS:

Basic Examples:
Input: "92101P1040\\nLAMP ASSY-HEAD, LH"
Output: { "partName": "Left Headlamp", "partNumber": "92101P1040", "context": "LH" }

Input: "99110P1000\\nUNIT ASSY-FRONT RADAR"
Output: { "partName": "Radar Sensor", "partNumber": "99110P1000", "context": null }

Ford Examples with Supersession:
Input: "JB3B 13D154 AD\\nJB3Z 13008 A\\nHEADLAMP ASSY, RH (PTD)"
Output: { "partName": "Right Headlamp", "partNumber": "JB3B13D154AD,JB3Z13008A", "context": "RH" }
Note: COMMA separates the two numbers. NOT "JB3B13D154ADJB3Z13008A"

Input: "JB3B 13D154 AD\\nJB3Z 13008 A\\nJB3B 13D155 AD\\nJB3Z 13008 E\\nHEADLAMP ASSY, RH\\nHEADLAMP ASSY, LH"
Output: [
  { "partName": "Right Headlamp", "partNumber": "JB3B13D154AD,JB3Z13008A", "context": "RH" },
  { "partName": "Left Headlamp", "partNumber": "JB3B13D155AD,JB3Z13008E", "context": "LH" }
]
Note: 4 numbers total, first 2 for RH, last 2 for LH, each pair comma-separated

Input: "N1WZ 9E731-D\\nML3Z 9E731-E\\nSENSOR ASSY"
Output: { "partName": "Radar Sensor", "partNumber": "N1WZ9E731D,ML3Z9E731E", "context": null }
Note: Multiple Ford supersessions, both complete prefixes included, comma-separated

Mercedes Examples (CRITICAL - Study These Carefully):
Input: "A 246 500 04 54\\nREFRIGERANT CONDENSER"
Output: { "partName": "Condenser", "partNumber": "A2465000454", "context": null }
Note: "A" is MANDATORY. Do NOT return "2465000454"

Input: "A 246 500 04 54\\nREFRIGERANT CONDENSER\\nA 246 500 00 54\\nCONDENSOR"
Output: [
  { "partName": "Condenser", "partNumber": "A2465000454", "context": null },
  { "partName": "Condenser", "partNumber": "A2465000054", "context": null }
]
Note: BOTH start with "A", BOTH must include the "A" prefix

Input: "B 123 456 78 90\\nRadiator"
Output: { "partName": "Radiator", "partNumber": "B1234567890", "context": null }
Note: "B" prefix included

L/R Detection Examples:
Input: "UNIT(R),HEAD LAMP\\nDB3P-51-0K0G"
Output: { "partName": "Right Headlamp", "partNumber": "DB3P510K0G", "context": "R" }
Note: (R) at beginning detected for Right

Input: "UNIT(L),HEAD LAMP\\nDB3P-51-0K0D"
Output: { "partName": "Left Headlamp", "partNumber": "DB3P510K0D", "context": "L" }
Note: (L) at beginning detected for Left

Input: "LR100570\\nCondenser\\n(L)"
Output: { "partName": "Left Condenser", "partNumber": "LR100570", "context": "L" }
Note: (L) at end detected for Left

Input: "Part Number: 12345678\\nHeadlamp (R)"
Output: { "partName": "Right Headlamp", "partNumber": "12345678", "context": "R" }
Note: (R) at end detected for Right

Parentheses Ignore Example:
Input: "LR100570\\nCondenser\\nUJ\\nA$870.34\\n(JPLA19C600AC)"
Output: { "partName": "Condenser", "partNumber": "LR100570", "context": null, "list_price": 870.34 }
Note: (JPLA19C600AC) ignored because it's in parentheses

Invalid Part Number Examples (REJECTED):
Input: "DESCRIPTION\\nHEADLAMP"
Output: NO OUTPUT - "DESCRIPTION" is all letters, no digits

Input: "CONDENSER\\nRadiator"
Output: NO OUTPUT - "CONDENSER" is all letters, no digits

Input: "ASSEMBLY\\nFan"
Output: NO OUTPUT - "ASSEMBLY" is all letters, no digits
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    let aiResponse: { parts: GeminiPartResponse[]; totalPartsFound?: number; ignoredContent?: string[] };
    
    try {
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      aiResponse = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return NextResponse.json({ useFallback: true });
    }

    if (!aiResponse.parts || !Array.isArray(aiResponse.parts)) {
      return NextResponse.json({ useFallback: true });
    }
    
    const extractedParts: AIPartExtraction[] = aiResponse.parts.map(part => ({
      partName: part.partName,
      partNumber: cleanPartNumber(part.partNumber),
      confidence: 1.0,
      rawText: ocrText,
      context: part.context || undefined,
      list_price: part.list_price
    }));
    
    // Post-process AI results to handle duplicates
    const partGroups = new Map<string, { part: AIPartExtraction; partNumbers: string[]; count: number }>();
    
    for (const part of extractedParts) {
      const normalizedName = part.partName.toLowerCase().trim();
      
      if (partGroups.has(normalizedName)) {
        const existing = partGroups.get(normalizedName)!;
        existing.partNumbers.push(part.partNumber);
        existing.count++;
        
        if (part.context && existing.part.context && part.context !== existing.part.context) {
          existing.part.context = `${existing.part.context}, ${part.context}`;
        }
      } else {
        partGroups.set(normalizedName, {
          part: { ...part },
          partNumbers: [part.partNumber],
          count: 1
        });
      }
    }
    
    const finalParts: AIPartExtraction[] = [];
    for (const [_, groupData] of partGroups) {
      if (groupData.count === 1) {
        finalParts.push(groupData.part);
      } else {
        finalParts.push({
          ...groupData.part,
          partNumber: groupData.partNumbers.join(','), // No spaces in joined part numbers
          context: groupData.part.context
        });
      }
    }
    
    return NextResponse.json({ parts: finalParts });
    
  } catch (error) {
    console.error('AI extraction API error:', error);
    return NextResponse.json(
      { error: 'Failed to extract parts', useFallback: true },
      { status: 500 }
    );
  }
}

