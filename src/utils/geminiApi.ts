// Gemini API service for AI-powered part extraction
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '');

export interface AIPartExtraction {
  partName: string;
  partNumber: string;
  confidence: number;
  context?: string;
  manufacturer?: string;
  isSupersession?: boolean;
  rawText: string;
}

export interface GeminiPartResponse {
  partName: string;
  partNumber: string;
  confidence: number;
  context?: string;
  manufacturer?: string;
  isSupersession?: boolean;
  reasoning?: string;
}

/**
 * Extract part information using Gemini AI
 */
export async function extractPartsWithAI(ocrText: string): Promise<AIPartExtraction[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are an expert automotive parts analyst. Extract part information from the following text.

TEXT TO ANALYZE:
"""
${ocrText}
"""

INSTRUCTIONS:
1. Identify the main automotive part
2. Extract the part number (alphanumeric codes, usually 5+ characters)
3. Determine if it's Left/Right specific (look for L, R, LH, RH, Left, Right indicators)
4. Identify manufacturer if mentioned
5. Check if this is a supersession (replacement part)

RESPONSE FORMAT (JSON only):
{
  "partName": "Standardized part name (e.g., 'Right Headlamp', 'Left Headlamp', 'Radiator', 'Condenser')",
  "partNumber": "Clean part number only (no descriptive text)",
  "confidence": 0.95,
  "context": "L/R context if applicable (e.g., 'RH', 'LH', 'Left', 'Right')",
  "manufacturer": "Brand name if mentioned, otherwise null",
  "isSupersession": false,
  "reasoning": "Brief explanation of your analysis"
}

IMPORTANT RULES:
- Use these exact part names: 'Left Headlamp', 'Right Headlamp', 'Left DayLight', 'Right DayLight', 'Radiator', 'Condenser', 'Fan Assembly', 'Intercooler', 'Radar Sensor'
- For headlamps: If text contains RH/R/Right → 'Right Headlamp', if LH/L/Left → 'Left Headlamp'
- For daylights: If text contains RH/R/Right → 'Right DayLight', if LH/L/Left → 'Left DayLight'
- Part numbers should be clean (e.g., "8110560K40" not "8110560K40 UNIT ASSY")
- Confidence should reflect how certain you are (0.7-1.0)
- Return valid JSON only
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const aiResponse: GeminiPartResponse = JSON.parse(jsonMatch[0]);
    
    // Validate and format the response
    const extractedPart: AIPartExtraction = {
      partName: aiResponse.partName,
      partNumber: aiResponse.partNumber,
      confidence: aiResponse.confidence,
      context: aiResponse.context,
      manufacturer: aiResponse.manufacturer,
      isSupersession: aiResponse.isSupersession || false,
      rawText: ocrText
    };
    
    return [extractedPart];
    
  } catch (error) {
    // Fallback to basic extraction
    return fallbackExtraction(ocrText);
  }
}

/**
 * Fallback extraction logic for when AI fails
 */
function fallbackExtraction(ocrText: string): AIPartExtraction[] {
  const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line);
  
  let partNumber = '';
  let partName = '';
  let context = '';
  
  // Simple fallback logic
  for (const line of lines) {
    // Look for part numbers (alphanumeric, 5+ chars)
    const partNumberMatch = line.match(/\b[A-Z0-9]{5,20}\b/i);
    if (partNumberMatch && !partNumber) {
      partNumber = partNumberMatch[0];
    }
    
    // Look for part names
    if (line.toLowerCase().includes('headlamp') || line.toLowerCase().includes('headlight')) {
      partName = 'Left Headlamp'; // Default
      
      // Check for L/R context
      if (/\b(rh|r\b|right)\b/i.test(line)) {
        partName = 'Right Headlamp';
        context = 'RH';
      } else if (/\b(lh|l\b|left)\b/i.test(line)) {
        partName = 'Left Headlamp';
        context = 'LH';
      }
    } else if (line.toLowerCase().includes('daylight') || line.toLowerCase().includes('drl')) {
      partName = 'Left DayLight'; // Default
      
      // Check for L/R context
      if (/\b(rh|r\b|right)\b/i.test(line)) {
        partName = 'Right DayLight';
        context = 'RH';
      } else if (/\b(lh|l\b|left)\b/i.test(line)) {
        partName = 'Left DayLight';
        context = 'LH';
      }
    } else if (line.toLowerCase().includes('radiator')) {
      partName = 'Radiator';
    } else if (line.toLowerCase().includes('condenser')) {
      partName = 'Condenser';
    }
  }
  
  if (partName && partNumber) {
    return [{
      partName,
      partNumber,
      confidence: 0.7,
      context,
      rawText: ocrText
    }];
  }
  
  return [];
}
