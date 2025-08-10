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

export const extractPartsFromText = (text: string): ExtractedPartInfo[] => {
  console.log('🔍 Starting part extraction from text:', text);
  
  // Simple classification functions
  const isPartName = (text: string): boolean => {
    // Part name: contains only alphabets, spaces, and special characters (no numbers)
    return /^[A-Za-z\s\-_\.\(\)\/]+$/.test(text.trim());
  };
  
  const isPartNumber = (text: string): boolean => {
    // Part number: contains at least one number (can be mix of numbers and alphabets)
    return /\d/.test(text.trim()) && text.trim().length > 0;
  };
  
  // Test the classification logic
  const testCases = ['Radiator', 'Cooler for coolant', '9283742874Rad', 'Con2398493', '123456789', 'ABC123', 'Headlamp'];
  console.log('🧪 Testing classification logic:');
  testCases.forEach(testCase => {
    console.log(`"${testCase}": ${isPartName(testCase) ? 'Part Name' : isPartNumber(testCase) ? 'Part Number' : 'Neither'}`);
  });
  
  // Split text into lines and process each line
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  console.log('📝 Processing lines:', lines);
  
  const extractedParts: ExtractedPartInfo[] = [];
  
  // First pass: collect all potential part names and part numbers
  const allPartNames: string[] = [];
  const allPartNumbers: string[] = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (isPartName(trimmedLine)) {
      allPartNames.push(trimmedLine);
      console.log(`✅ Found part name: "${trimmedLine}"`);
    } else if (isPartNumber(trimmedLine)) {
      allPartNumbers.push(trimmedLine);
      console.log(`🔢 Found part number: "${trimmedLine}"`);
    }
  }
  
  console.log('📋 All part names found:', allPartNames);
  console.log('🔢 All part numbers found:', allPartNumbers);
  
  // Now associate part names with part numbers based on proximity
  for (const partName of allPartNames) {
    let bestPartNumber = '';
    let bestConfidence = 0;
    let bestDistance = Infinity;
    
    // Strategy 1: Look for part numbers in the same line as the part name
    for (const line of lines) {
      if (line.includes(partName)) {
        // Find part numbers in this line
        const words = line.split(/\s+/);
        for (const word of words) {
          if (isPartNumber(word) && word !== partName) {
            const distance = Math.abs(line.indexOf(word) - line.indexOf(partName));
            if (distance < bestDistance) {
              bestPartNumber = word;
              bestConfidence = 0.95; // Very high confidence for same line
              bestDistance = distance;
              console.log(`🎯 Found part number "${word}" in same line as "${partName}" (distance: ${distance})`);
            }
          }
        }
        break; // Found the line, no need to check others
      }
    }
    
    // Strategy 2: If no same-line match, find the closest part number in adjacent lines
    if (!bestPartNumber) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(partName)) {
          // Check previous and next lines
          for (let offset = -1; offset <= 1; offset++) {
            if (offset === 0) continue; // Skip current line
            const lineIndex = i + offset;
            if (lineIndex >= 0 && lineIndex < lines.length) {
              const searchLine = lines[lineIndex];
              const words = searchLine.split(/\s+/);
              for (const word of words) {
                if (isPartNumber(word)) {
                  const distance = Math.abs(offset); // Distance in lines
                  if (distance < bestDistance) {
                    bestPartNumber = word;
                    bestConfidence = 0.8; // High confidence for adjacent lines
                    bestDistance = distance;
                    console.log(`🔍 Found part number "${word}" in ${offset > 0 ? 'next' : 'previous'} line for "${partName}"`);
                  }
                }
              }
            }
          }
          break;
        }
      }
    }
    
    // Strategy 3: If still no match, find any unused part number (lowest priority)
    if (!bestPartNumber && allPartNumbers.length > 0) {
      // Find the first unused part number
      for (const partNumber of allPartNumbers) {
        if (!extractedParts.some(part => part.partNumber === partNumber)) {
          bestPartNumber = partNumber;
          bestConfidence = 0.5; // Low confidence for fallback
          console.log(`🔄 Using fallback part number "${partNumber}" for "${partName}"`);
          break;
        }
      }
    }
    
    if (bestPartNumber) {
      extractedParts.push({
        partName,
        partNumber: bestPartNumber,
        confidence: bestConfidence,
        rawText: `${partName} - ${bestPartNumber}`
      });
      console.log(`✅ Created part: "${partName}" -> "${bestPartNumber}" (confidence: ${bestConfidence})`);
    } else {
      console.log(`⚠️ No part number found for "${partName}"`);
    }
  }
  
  console.log('🎉 Final extracted parts:', extractedParts);
  return extractedParts;
};

export const processImageForParts = async (base64Image: string): Promise<ExtractedPartInfo[]> => {
  try {
    const extractedText = await extractTextFromImage(base64Image);
    const parts = extractPartsFromText(extractedText);
    return parts;
  } catch (error) {
    console.error('Error processing image for parts:', error);
    return [];
  }
}; 