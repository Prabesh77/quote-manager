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

export async function POST(request: NextRequest) {
  try {
    const { ocrText } = await request.json();

    if (!ocrText || typeof ocrText !== 'string') {
      return NextResponse.json(
        { error: 'Invalid OCR text provided' },
        { status: 400 }
      );
    }

    // Check if this looks like a Nissan layout (complex, scattered format)
    const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line);
    
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
    
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are an expert automotive parts analyst. Analyze the provided OCR text and extract ONLY the MAIN automotive parts according to the rules below.

TEXT TO ANALYZE:
"""
${ocrText}
"""

INSTRUCTIONS:
1. Identify ONLY MAIN automotive parts. Exclude brackets, mounting hardware, bolts, nuts, clips, and other supporting components.
2. Extract part numbers for each MAIN part. A valid part number must contain ≥ 8 letters/digits combined (ignore hyphens, spaces, and special characters when counting). Ignore any shorter numbers.
3. PART-TO-NUMBER PAIRING: In the OCR text, part numbers typically appear on the line DIRECTLY ABOVE or BEFORE the part description. Always pair them together.
   - Example: "92101P1040\\nLAMP ASSY-HEAD, LH" → Part Number: 92101P1040, Part Name: Left Headlamp
   - Example: "99110P1000\\nUNIT ASSY-FRONT RADAR" → Part Number: 99110P1000, Part Name: Radar Sensor
4. Extract prices when available. Look for prices with $ signs (e.g., $125.50, $89.99, A$855.86). These are likely list prices for the parts. Handle various currency formats including A$ (Australian dollars).
5. Determine Left/Right context (CHECK IN THIS ORDER):
   - If text contains "LH" or "Left" → Left
   - If text contains "RH" or "Right" → Right
   - If text contains standalone "L" (with spaces/newlines around it, not part of a word) → Left
   - If text contains standalone "R" (with spaces/newlines around it, not part of a word) → Right
   - If text contains "(L)" or "[L]" → Left
   - If text contains "(R)" or "[R]" → Right
   - Examples of standalone detection:
     * "LAMP ASSY-HEAD L" → Left (L at end)
     * "L HEADLAMP" → Left (L at start)
     * "HEADLAMP (L)" → Left (L in parentheses)
     * "Part L 123456" → Left (standalone L)
6. Focus on returning 2–9 MAIN parts maximum, but output no more than the first 8 valid parts found in text order.
7. PART NUMBER PATTERNS: Look for these formats as they are most likely part numbers:
   - **FORD FORMAT (HIGHEST PRIORITY)**: PREFIX (2-4 letters ending in Z) + SPACE + NUMBER with optional hyphen
     * Examples: "N1WZ 9E731-D", "ML3Z 9E731-E", "P1WZ 14C022-B", "F1FZ 16607-AA"
     * CRITICAL: ALWAYS extract the COMPLETE part number INCLUDING the prefix (e.g., "N1WZ 9E731-D" NOT "9E731-D")
     * Common prefixes: N1WZ, ML3Z, P1WZ, F1FZ, E1FZ, C1FZ, D1FZ, etc.
   - Hyphenated format: "21606-EB405", "26060-5X00B", "92120-EB400"
   - Alphanumeric codes: "21460EB31B", "8110560K40" (8+ characters)
8. Ignore irrelevant short codes like "10", "50", "110", "001" (these are quantities or prices, not part numbers).
9. Keep part numbers clean — e.g., "8110560K40" not "8110560K40 UNIT ASSY".
10. SINGLE LINE RULE: If multiple keywords appear in one line (e.g., "O FAN & MOTOR ASSY-CONDENSER"), select the LAST keyword as the part name with this priority: Condenser > Oil Cooler > Radiator > Fan > Motor > Assembly.
11. HEADLAMP DETECTION RULES:
    - "LAMP ASSY-HEAD" or "HEAD LAMP ASSY" → 'Headlamp' (this is Hyundai/Kia format)
    - If contains "LH" or "L" or "Left" → 'Left Headlamp'
    - If contains "RH" or "R" or "Right" → 'Right Headlamp'
    - DAYTIME HEADLAMP RULE: If a line contains 'headlamp' or 'headlight' WITH 'daytime' or 'combination' → classify as 'DayLight' (NOT 'Headlamp')
12. CAMERA DETECTION: If text contains 'camera' keyword → classify as 'Camera'. This is definitive and takes priority over other sensor types.
13. SENSOR DETECTION RULES (PRIORITY ORDER - CHECK IN THIS SEQUENCE):
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
14. FORD-SPECIFIC RULES:
    - FORD PART NUMBER FORMAT: Ford part numbers have a SPECIFIC format: PREFIX (2-4 letters ending in Z) + SPACE + NUMBER (with optional hyphen)
      * Examples: "N1WZ 9E731-D", "ML3Z 9E731-E", "P1WZ 14C022-B", "F1FZ 16607-AA"
      * CRITICAL: ALWAYS extract the COMPLETE part number INCLUDING the prefix
      * DO NOT extract just "9E731-D" when the full number is "N1WZ 9E731-D"
      * Common Ford prefixes: N1WZ, ML3Z, P1WZ, F1FZ, E1FZ, C1FZ, D1FZ, etc. (always end with 'Z')
    - FORD PART NUMBER SELECTION: When multiple values look like part numbers, prioritize the one that:
      * Has spaces in it (e.g., "N1WZ 9E731-D" vs "9E731D")
      * Includes the prefix before the space
    - FORD RADAR SENSOR DETECTION: If text contains 'Sensor Assy' OR 'Less Bracket' OR 'Les Bracket' → classify as 'Radar Sensor' for Ford cars

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
Input: "92101P1040\\nLAMP ASSY-HEAD, LH"
Output: { "partName": "Left Headlamp", "partNumber": "92101P1040", "context": "LH" }

Input: "99110P1000\\nUNIT ASSY-FRONT RADAR"
Output: { "partName": "Radar Sensor", "partNumber": "99110P1000", "context": null }

Input: "N1WZ 9E731-D\\nSENSOR ASSY, LESS BRACKET"
Output: { "partName": "Radar Sensor", "partNumber": "N1WZ 9E731-D", "context": null }

Input: "25380N9600\\nBLOWER ASSY"
Output: { "partName": "Fan Assembly", "partNumber": "25380N9600", "context": null }

Input: "26060-5X00B\\nCONDENSER ASSY-COOLER"
Output: { "partName": "Condenser", "partNumber": "26060-5X00B", "context": null }
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
      partNumber: part.partNumber,
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
          partNumber: groupData.partNumbers.join(', '),
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

