// Test for new "find part name first" logic
console.log('🧪 Testing new "find part name first" logic');
console.log('=' .repeat(70));

// Mock the improved extractPartsFromText function
const extractPartsFromText = (text) => {
  console.log('🔍 Starting part extraction from text:', text);
  
  // Split text into lines and process each line
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  console.log('📝 Lines found:', lines);
  
  const extractedParts = [];
  
  if (lines.length >= 2) {
    let partNumber = '';
    let partName = '';
    
    // Step 1: Find the part name first (more distinctive)
    for (const line of lines) {
      const trimmedLine = line.trim();
      console.log(`🔍 Checking line for part name: "${trimmedLine}"`);
      
      // Check if this line contains part-related keywords
      const partKeywords = ['headlamp', 'headlight', 'lamp', 'radiator', 'condenser', 'fan', 'radar', 'intercooler', 'unit', 'assy', 'assembly'];
      const hasPartKeyword = partKeywords.some(keyword => 
        trimmedLine.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (hasPartKeyword) {
        partName = trimmedLine;
        console.log(`🏷️ Found part name: "${trimmedLine}"`);
        break;
      }
    }
    
    // Step 2: Once we have the part name, find the part number
    if (partName) {
      // Look for a line that contains numbers (likely the part number)
      for (const line of lines) {
        const trimmedLine = line.trim();
        console.log(`🔍 Checking line for part number: "${trimmedLine}"`);
        
        // If this line contains numbers and is different from the part name line
        if (/\d/.test(trimmedLine) && trimmedLine !== partName) {
          partNumber = trimmedLine;
          console.log(`🔢 Found part number: "${trimmedLine}"`);
          break;
        }
      }
      
      // If no separate line with numbers, check if part name line also contains numbers
      if (!partNumber && /\d/.test(partName)) {
        // Split the part name line to separate part name from part number
        const words = partName.split(/\s+/);
        const partNameWords = [];
        const partNumberWords = [];
        
        for (const word of words) {
          if (/\d/.test(word)) {
            partNumberWords.push(word);
          } else {
            partNameWords.push(word);
          }
        }
        
        if (partNumberWords.length > 0) {
          partNumber = partNumberWords.join(' ');
          partName = partNameWords.join(' ');
          console.log(`🔄 Split line: Part Number: "${partNumber}", Part Name: "${partName}"`);
        }
      }
    }
    
    // If we found both, create the part
    if (partNumber && partName) {
      console.log('✅ Found valid part number and part name');
      
      extractedParts.push({
        partName: partName,
        partNumber: partNumber,
        confidence: 0.95,
        rawText: `${partNumber}\n${partName}`
      });
    } else {
      console.log('⚠️ Missing part number or part name');
      console.log(`  - Part Number: ${partNumber || 'not found'}`);
      console.log(`  - Part Name: ${partName || 'not found'}`);
    }
  } else {
    console.log('⚠️ Not enough lines to extract parts');
  }
  
  console.log('🎉 Final extracted parts:', extractedParts);
  return extractedParts;
};

// Test Case 1: Multi-line with separate part number and part name
console.log('\n📱 Test Case 1: Multi-line format');
console.log('Text: "8117026B10 UNIT ASSY,\\nHEADLAMP,\\nLH"');
const result1 = extractPartsFromText('8117026B10 UNIT ASSY,\nHEADLAMP,\nLH');

// Test Case 2: Multi-line with spaced part number
console.log('\n📱 Test Case 2: Spaced part number');
console.log('Text: "3G2 941 114 A\\nLED headlight"');
const result2 = extractPartsFromText('3G2 941 114 A\nLED headlight');

// Test Case 3: Single line with mixed content
console.log('\n📱 Test Case 3: Single line mixed content');
console.log('Text: "Radiator Assy 12345"');
const result3 = extractPartsFromText('Radiator Assy 12345');

console.log('\n🎯 Summary of Results:');
console.log('Case 1 (Multi-line):', result1.length, 'parts');
console.log('Case 2 (Spaced part number):', result2.length, 'parts');
console.log('Case 3 (Single line mixed):', result3.length, 'parts');

console.log('\n✅ Test completed!');
