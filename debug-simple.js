// Simple debug test for "81150YP101 HEADLAMP ASSY, LH"
console.log('🧪 Testing: "81150YP101 HEADLAMP ASSY, LH"');
console.log('=' .repeat(50));

// Step 1: Simulate the text extraction from Google Vision API
const extractedText = '81150YP101 HEADLAMP\nASSY, LH';
console.log('📱 Extracted from Google Vision:');
console.log(extractedText);

// Step 2: Split into lines
const lines = extractedText.split('\n').filter(line => line.trim());
console.log('\n📝 Lines after splitting:');
console.log(lines);

// Step 3: Process each line
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  console.log(`\n🔍 Processing line ${i + 1}: "${line}"`);
  
  // Clean the text (remove commas, normalize spaces)
  const cleanedText = line.replace(/[,\.]/g, ' ').replace(/\s+/g, ' ');
  console.log(`🧹 Cleaned text: "${cleanedText}"`);
  
  // Split into words
  const words = cleanedText.split(/\s+/);
  console.log(`🔤 Words: [${words.join(', ')}]`);
  
  // Find part number (first word that looks like a part number)
  let partNumber = null;
  let partName = null;
  let remainingWords = [];
  
  // Check each word
  for (let j = 0; j < words.length; j++) {
    const word = words[j];
    console.log(`  🔍 Checking word "${word}":`);
    
    // Is it a part number? (mix of numbers and letters, 5+ chars)
    if (/\d/.test(word) && word.length >= 5) {
      const isPartNumber = /^[A-Z0-9]{5,20}$/i.test(word) || 
                          /^\d{5,15}$/.test(word) || 
                          /^\d+[A-Z]+\d*$/i.test(word) ||
                          /^[A-Z]+\d+[A-Z]*$/i.test(word);
      
      if (isPartNumber) {
        partNumber = word;
        console.log(`    ✅ Found part number: "${word}"`);
        break;
      } else {
        console.log(`    ❌ Not a part number: "${word}"`);
      }
    } else {
      console.log(`    📝 Text word: "${word}"`);
    }
  }
  
  // Find part name (look for actual part names, not generic words)
  for (let j = 0; j < words.length; j++) {
    const word = words[j];
    if (word === partNumber) continue; // Skip the part number
    
    // Check if it's a known part name
    const knownPartNames = ['headlamp', 'headlight', 'radiator', 'condenser', 'fan', 'radar', 'intercooler'];
    const isKnownPartName = knownPartNames.some(knownName => 
      word.toLowerCase() === knownName.toLowerCase()
    );
    
    if (isKnownPartName) {
      partName = word;
      console.log(`    🏷️ Found part name: "${word}"`);
      break;
    }
  }
  
  // Get remaining words
  remainingWords = words.filter(word => word !== partNumber && word !== partName);
  
  console.log(`\n📊 Line ${i + 1} Result:`);
  console.log(`  - Part Number: ${partNumber || 'none'}`);
  console.log(`  - Part Name: ${partName || 'none'}`);
  console.log(`  - Remaining: ${remainingWords.join(' ') || 'none'}`);
  
  // Now simulate what should happen in the matching logic
  if (partName) {
    console.log(`\n🔍 Now matching part name "${partName}" to main part categories...`);
    
    // Simple matching logic
    if (partName.toLowerCase() === 'headlamp' || partName.toLowerCase() === 'headlight') {
      // Check for L/R context
      const hasLContext = remainingWords.some(word => 
        word.toLowerCase() === 'lh' || word.toLowerCase() === 'l' || word.toLowerCase() === 'left'
      );
      const hasRContext = remainingWords.some(word => 
        word.toLowerCase() === 'rh' || word.toLowerCase() === 'r' || word.toLowerCase() === 'right'
      );
      
      if (hasLContext) {
        console.log(`    ✅ Matched to: Left Headlamp (because of LH context)`);
      } else if (hasRContext) {
        console.log(`    ✅ Matched to: Right Headlamp (because of RH context)`);
      } else {
        console.log(`    ⚠️ Matched to: Left Headlamp (default, no L/R context)`);
      }
    } else {
      console.log(`    ❌ No match found for "${partName}"`);
    }
  } else {
    console.log(`    ❌ No part name found in this line`);
  }
}

console.log('\n🎯 Summary:');
console.log('This should be straightforward:');
console.log('1. Extract part number: 81150YP101');
console.log('2. Extract part name: HEADLAMP');
console.log('3. Match HEADLAMP to Left Headlamp (because of LH context)');
console.log('4. Add to UI with confidence');
