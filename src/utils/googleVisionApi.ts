// Google Vision API service for OCR text extraction
import { extractPartsWithAI, AIPartExtraction } from './geminiApi';

interface VisionApiResponse {
  responses: Array<{
    textAnnotations?: Array<{
      description: string;
      boundingPoly?: {
        vertices: Array<{ x: number; y: number }>;
      };
    }>;
    fullTextAnnotation?: {
      text: string;
    };
  }>;
}

interface ExtractedPartInfo {
  partName: string;
  partNumber: string;
  confidence: number;
  rawText: string;
  context?: string;
  list_price?: number;
}

export const extractTextFromImage = async (base64Image: string): Promise<string> => {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Vision API key not configured');
    }

    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Image.split(',')[1], // Remove data:image/jpeg;base64, prefix
            },
            features: [
              {
                type: 'TEXT_DETECTION',
                maxResults: 50,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status}`);
    }

    const data: VisionApiResponse = await response.json();
    
    if (data.responses[0]?.fullTextAnnotation?.text) {
      return data.responses[0].fullTextAnnotation.text;
    }
    
    if (data.responses[0]?.textAnnotations?.[0]?.description) {
      return data.responses[0].textAnnotations[0].description;
    }

    return '';
  } catch (error) {
    console.error('Error extracting text from image:', error);
    throw error;
  }
};

export const extractPartsFromText = async (text: string): Promise<ExtractedPartInfo[]> => {
  try {
    // Use AI for part extraction
    const aiParts = await extractPartsWithAI(text);
    
    // Convert AI response to ExtractedPartInfo format
    const parts: ExtractedPartInfo[] = aiParts.map(aiPart => ({
      partName: aiPart.partName,
      partNumber: aiPart.partNumber,
      confidence: aiPart.confidence,
      rawText: aiPart.rawText,
      context: aiPart.context,
      list_price: aiPart.list_price
    }));
    
    // If AI found parts with names, return them
    if (parts.length > 0) {
      return parts;
    }
    
    // If no parts found, try to extract orphan part numbers (numbers without names)
    const orphanNumbers = extractOrphanPartNumbers(text);
    if (orphanNumbers.length > 0) {
      return orphanNumbers;
    }
    
    return parts;
    
  } catch (error) {
    // Fallback to basic extraction if AI fails
    const fallbackParts = fallbackExtraction(text);
    if (fallbackParts.length > 0) {
      return fallbackParts;
    }
    
    // Last resort: try to extract orphan part numbers
    return extractOrphanPartNumbers(text);
  }
};

/**
 * Extract orphan part numbers (numbers without part names)
 * Used when no parts are detected but there are valid part numbers in the text
 */
function extractOrphanPartNumbers(text: string): ExtractedPartInfo[] {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const orphanParts: ExtractedPartInfo[] = [];
  
  // Patterns for different part number formats
  const patterns = [
    // Mercedes format: Single letter + 9-13 digits
    /\b([A-Z])\s*(\d{9,13})\b/gi,
    // Ford format: PREFIX + space + number with optional hyphen
    /\b([A-Z]{2,4}Z)\s+([A-Z0-9]{5,15}(?:-[A-Z0-9]{1,5})?)\b/gi,
    // Hyphenated format
    /\b([A-Z0-9]{3,10}-[A-Z0-9]{3,10})\b/gi,
    // Alphanumeric (8+ chars, must contain at least one digit)
    /\b([A-Z0-9]*\d[A-Z0-9]{7,})\b/gi,
  ];
  
  const foundNumbers = new Set<string>();
  
  for (const line of lines) {
    // Skip lines that look like part names or descriptions
    const lowerLine = line.toLowerCase();
    if (lowerLine.includes('headlamp') || lowerLine.includes('radiator') || 
        lowerLine.includes('condenser') || lowerLine.includes('sensor') ||
        lowerLine.includes('assembly') || lowerLine.includes('assy') ||
        line.length < 6) {
      continue;
    }
    
    // Skip lines wrapped in parentheses
    if (line.startsWith('(') && line.endsWith(')')) {
      continue;
    }
    
    // Try each pattern
    for (const pattern of patterns) {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        let partNumber = '';
        
        // Handle different match groups
        if (match[0].includes(' ') && match[1] && match[2]) {
          // Ford or Mercedes format with groups
          partNumber = (match[1] + match[2]).replace(/\s+/g, '');
        } else {
          // Single group match
          partNumber = match[0].replace(/\s+/g, '');
        }
        
        // Validate: must be 8+ chars and contain at least one digit
        const hasDigit = /\d/.test(partNumber);
        const isAllLetters = /^[A-Z]+$/i.test(partNumber);
        
        if (partNumber.length >= 8 && hasDigit && !isAllLetters && !foundNumbers.has(partNumber)) {
          foundNumbers.add(partNumber);
          
          orphanParts.push({
            partName: 'Part Number', // Generic placeholder name
            partNumber: partNumber,
            confidence: 0.6, // Lower confidence since no part name
            rawText: text,
            context: '(Copy to required part)',
            list_price: undefined
          });
        }
      }
    }
  }
  
  return orphanParts;
}

/**
 * Fallback extraction logic for when AI fails
 */
function fallbackExtraction(text: string): ExtractedPartInfo[] {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  if (lines.length === 0) {
    return [];
  }
  
  const parts: ExtractedPartInfo[] = [];
  
  // Simple fallback logic
  let partNumber = '';
  let partName = '';
  let context = '';
  
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
    } else if (line.toLowerCase().includes('radiator')) {
      partName = 'Radiator';
    } else if (line.toLowerCase().includes('condenser')) {
      partName = 'Condenser';
    }
  }
  
  if (partName && partNumber) {
    const extractedPart: ExtractedPartInfo = {
      partName,
      partNumber,
      confidence: 0.7,
      rawText: text,
      context,
      list_price: undefined
    };
    
    parts.push(extractedPart);
  }
  
  return parts;
}

export const processImageForParts = async (base64Image: string): Promise<ExtractedPartInfo[]> => {
  try {
    const extractedText = await extractTextFromImage(base64Image);
    const parts = await extractPartsFromText(extractedText);
    return parts;
  } catch (error) {
    console.error('Error processing image for parts:', error);
    return [];
  }
}; 