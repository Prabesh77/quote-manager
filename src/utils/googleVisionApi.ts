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
      context: aiPart.context
    }));
    
    return parts;
    
  } catch (error) {
    // Fallback to basic extraction if AI fails
    return fallbackExtraction(text);
  }
};

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
      context
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