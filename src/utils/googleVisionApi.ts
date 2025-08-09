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
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const extractedParts: ExtractedPartInfo[] = [];

  // Comprehensive part keyword mapping to exact part names
  const partKeywordMapping = {
    'Radiator': [
      'radiator',
      'cooler for coolant',
      'cooling radiator', 
      'engine cooler',
      'coolant radiator',
      'water radiator',
      'cooling module',
      'heat exchanger'
    ],
    'Intercooler': [
      'intercooler',
      'charge air cooler',
      'turbo cooler',
      'air charge cooler',
      'charged air cooler',
      'turbo intercooler',
      'boost cooler'
    ],
    'Left Headlamp': [
      'left headlight',
      'left headlamp',
      'left front light',
      'left head lamp',
      'lh headlight',
      'lh headlamp',
      'driver side headlight',
      'driver headlight',
      'headlamp left',
      'headlight left'
    ],
    'Right Headlamp': [
      'right headlight',
      'right headlamp', 
      'right front light',
      'right head lamp',
      'rh headlight',
      'rh headlamp',
      'passenger side headlight',
      'passenger headlight',
      'headlamp right',
      'headlight right'
    ],
    'Condenser': [
      'condenser',
      'ac condenser',
      'air conditioning condenser',
      'a/c condenser',
      'aircon condenser',
      'cooling condenser',
      'refrigerant condenser'
    ],
    'Fan Assembly': [
      'fan assembly',
      'cooling fan',
      'radiator fan',
      'engine fan',
      'fan motor',
      'cooling fan assembly',
      'radiator fan assembly',
      'electric fan'
    ],
    'Radar Sensor': [
      'radar sensor',
      'parking sensor',
      'proximity sensor',
      'distance sensor',
      'ultrasonic sensor',
      'park assist sensor',
      'pdc sensor'
    ]
  };

  // Create a function to find the best part match
  const findPartMatch = (text: string): string | null => {
    const lowerText = text.toLowerCase();
    
    // Check each part type and its keywords
    for (const [partName, keywords] of Object.entries(partKeywordMapping)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          return partName;
        }
      }
    }
    
    // Fallback: check for generic terms that might need manual selection
    const genericTerms = [
      'headlight', 'headlamp', 'head lamp', 'front light'
    ];
    
    for (const term of genericTerms) {
      if (lowerText.includes(term)) {
        // If it's a generic headlight term without left/right specification,
        // default to Left Headlamp (user can change if needed)
        return 'Left Headlamp';
      }
    }
    
    return null;
  };

  // Enhanced part number patterns (more comprehensive)
  const partNumberPatterns = [
    /\b[A-Z0-9]{8,15}\b/g, // Alphanumeric codes 8-15 chars (like 98364837GD)
    /\b\d{8,12}[A-Z]{1,3}\b/g, // Numbers followed by letters (like 98364837GD)
    /\b[A-Z]{1,3}\d{8,12}\b/g, // Letters followed by numbers
    /\b\d{4,8}[-.]?\d{0,4}\b/g, // Numeric codes with optional separators
    /\b[A-Z]{2,4}\d{4,8}\b/g, // Letter prefix + numbers
    /\b\d{2,4}[A-Z]{2,4}\d{2,6}\b/g, // Numbers + letters + numbers
    /\b[A-Z0-9]{6,}\b/g, // Any alphanumeric string 6+ chars (fallback)
  ];

  // First, collect all potential part numbers from the entire text
  const allPartNumbers: string[] = [];
  const allText = text.replace(/\n/g, ' ');
  
  for (const numPattern of partNumberPatterns) {
    const matches = allText.match(numPattern);
    if (matches) {
      allPartNumbers.push(...matches);
    }
  }

  // Remove duplicates and sort by length (longer part numbers are usually more specific)
  const uniquePartNumbers = [...new Set(allPartNumbers)].sort((a, b) => b.length - a.length);

  // Now look for part names and associate them with nearby part numbers
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line contains a part name using our keyword mapping
    const matchedPartName = findPartMatch(line);
    
    if (matchedPartName) {
      let partNumber = '';
      let confidence = 0.7;
      let usedPartNumberIndex = -1;

      // Strategy 1: Look for part numbers in the same line
      for (const numPattern of partNumberPatterns) {
        const numbers = line.match(numPattern);
        if (numbers) {
          partNumber = numbers[0];
          confidence = 0.9; // High confidence for same line
          usedPartNumberIndex = uniquePartNumbers.indexOf(partNumber);
          break;
        }
      }

      // Strategy 2: Look in adjacent lines (before and after)
      if (!partNumber) {
        const searchRange = 2; // Look 2 lines before and after
        for (let offset = -searchRange; offset <= searchRange; offset++) {
          if (offset === 0) continue; // Skip current line (already checked)
          const lineIndex = i + offset;
          if (lineIndex >= 0 && lineIndex < lines.length) {
            const searchLine = lines[lineIndex];
            for (const numPattern of partNumberPatterns) {
              const numbers = searchLine.match(numPattern);
              if (numbers) {
                partNumber = numbers[0];
                confidence = Math.abs(offset) === 1 ? 0.8 : 0.7; // Higher confidence for adjacent lines
                usedPartNumberIndex = uniquePartNumbers.indexOf(partNumber);
                break;
              }
            }
            if (partNumber) break;
          }
        }
      }

      // Strategy 3: If still no part number, try to find the most likely unused part number
      if (!partNumber && uniquePartNumbers.length > 0) {
        // Find the first unused part number
        for (let j = 0; j < uniquePartNumbers.length; j++) {
          const candidateNumber = uniquePartNumbers[j];
          // Check if this part number hasn't been used yet
          const alreadyUsed = extractedParts.some(part => part.partNumber === candidateNumber);
          if (!alreadyUsed) {
            partNumber = candidateNumber;
            confidence = 0.6; // Lower confidence for guessed association
            usedPartNumberIndex = j;
            break;
          }
        }
      }

      // Remove the used part number from future searches
      if (usedPartNumberIndex >= 0) {
        uniquePartNumbers.splice(usedPartNumberIndex, 1);
      }

      // Check if we already have this part name (avoid duplicates)
      const existingPart = extractedParts.find(part => part.partName === matchedPartName);
      if (!existingPart) {
        extractedParts.push({
          partName: matchedPartName,
          partNumber: partNumber || 'Not found',
          confidence,
          rawText: `${line}${partNumber && !line.includes(partNumber) ? ` (Part #: ${partNumber})` : ''}`,
        });
      }
    }
  }

  // Strategy 4: Handle case where part numbers appear without explicit part names
  // Look for standalone part numbers that weren't associated with any part name
  if (extractedParts.length === 0 && uniquePartNumbers.length > 0) {
    // Try to infer part type from context or use generic naming
    for (const partNumber of uniquePartNumbers.slice(0, 3)) { // Limit to first 3 unmatched
      extractedParts.push({
        partName: 'Unknown Part', // Will need manual selection
        partNumber: partNumber,
        confidence: 0.5,
        rawText: `Part Number: ${partNumber}`,
      });
    }
  }

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