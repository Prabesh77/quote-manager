// Test file for intelligent part matching system
import { 
  findSmartPartMatch, 
  extractPartsWithSupersession,
  detectSupersession,
  isLikelyPartNumber,
  extractManufacturerHint 
} from './partMappingDictionary';

// Test cases for part matching
const testCases = [
  // Radiator tests
  { input: 'rad', expected: 'Radiator', description: 'Abbreviation: rad' },
  { input: 'radiator', expected: 'Radiator', description: 'Full word: radiator' },
  { input: 'cooler', expected: 'Radiator', description: 'Synonym: cooler' },
  { input: 'engine cooling', expected: 'Radiator', description: 'Phrase: engine cooling' },
  
  // Condenser tests
  { input: 'con', expected: 'Condenser', description: 'Abbreviation: con' },
  { input: 'cond', expected: 'Condenser', description: 'Abbreviation: cond' },
  { input: 'ac condenser', expected: 'Condenser', description: 'Phrase: ac condenser' },
  { input: 'air conditioning', expected: 'Condenser', description: 'Phrase: air conditioning' },
  
  // Radar tests
  { input: 'radar', expected: 'Radar Sensor', description: 'Full word: radar' },
  { input: 'cruise control', expected: 'Radar Sensor', description: 'Phrase: cruise control' },
  { input: 'smart cruise', expected: 'Radar Sensor', description: 'Phrase: smart cruise' },
  { input: 'front radar', expected: 'Radar Sensor', description: 'Phrase: front radar' },
  
  // Fan tests
  { input: 'fan', expected: 'Fan Assembly', description: 'Full word: fan' },
  { input: 'cooling fan', expected: 'Fan Assembly', description: 'Phrase: cooling fan' },
  { input: 'engine fan', expected: 'Fan Assembly', description: 'Phrase: engine fan' },
  
  // Intercooler tests
  { input: 'intercooler', expected: 'Intercooler', description: 'Full word: intercooler' },
  { input: 'charge air', expected: 'Intercooler', description: 'Phrase: charge air' },
  { input: 'turbo cooler', expected: 'Intercooler', description: 'Phrase: turbo cooler' },
  
  // Headlamp tests (these will need context for L/R)
  { input: 'headlamp', expected: 'Left Headlamp', description: 'Generic: headlamp' },
  { input: 'headlight', expected: 'Left Headlamp', description: 'Generic: headlight' },
  { input: 'lamp', expected: 'Left Headlamp', description: 'Generic: lamp' },
  
  // DRL tests
  { input: 'drl', expected: 'Daytime Running Light', description: 'Abbreviation: DRL' },
  { input: 'day running', expected: 'Daytime Running Light', description: 'Phrase: day running' },
  
  // Combination lamp tests
  { input: 'combination', expected: 'Combination Lamp', description: 'Full word: combination' },
  { input: 'combo', expected: 'Combination Lamp', description: 'Abbreviation: combo' },
  
  // Liquid tank tests
  { input: 'tank', expected: 'Liquid Tank', description: 'Full word: tank' },
  { input: 'reservoir', expected: 'Liquid Tank', description: 'Full word: reservoir' },
  { input: 'fluid reservoir', expected: 'Liquid Tank', description: 'Phrase: fluid reservoir' }
];

// Test cases for L/R context detection
const headlampContextTests = [
  {
    input: 'headlamp',
    context: ['L', 'left', 'lh'],
    expected: 'Left Headlamp',
    description: 'Headlamp with L context'
  },
  {
    input: 'headlamp',
    context: ['R', 'right', 'rh'],
    expected: 'Right Headlamp',
    description: 'Headlamp with R context'
  },
  {
    input: 'lamp assy',
    context: ['LH'],
    expected: 'Left Headlamp',
    description: 'Lamp assy with LH context'
  }
];

// Test cases for supersession detection
const supersessionTests = [
  {
    lines: [
      '84002vc160. 1. Lamp Assembly-Head Right',
      '84002vc161. 1. Lamp Assembly-Head Right'
    ],
    expectedSupersessions: 1,
    description: 'Detect supersession between similar lines'
  }
];

// Test cases for part number detection
const partNumberTests = [
  { input: '84002vc160', expected: true, description: 'Alphanumeric part number' },
  { input: '3G2 941 114 A', expected: true, description: 'Complex part number with spaces' },
  { input: '123456789', expected: true, description: 'Numeric part number' },
  { input: 'ABC123', expected: true, description: 'Mixed alphanumeric' },
  { input: 'just text', expected: false, description: 'Text without numbers' }
];

// Test cases for manufacturer detection
const manufacturerTests = [
  { input: 'HILUX', expected: 'HILUX', description: 'Toyota Hilux' },
  { input: 'Mitsubishi', expected: 'Mitsubishi', description: 'Mitsubishi' },
  { input: 'Nissan', expected: 'Nissan', description: 'Nissan' },
  { input: 'Honda', expected: 'Honda', description: 'Honda' },
  { input: 'random text', expected: null, description: 'No manufacturer' }
];

// Run all tests
export const runAllTests = () => {
  console.log('🧪 Running Intelligent Part Matching Tests...\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test basic part matching
  console.log('📋 Testing Basic Part Matching:');
  testCases.forEach(test => {
    totalTests++;
    const result = findSmartPartMatch(test.input);
    const passed = result?.mainPartName === test.expected;
    
    if (passed) {
      passedTests++;
      console.log(`✅ ${test.description}: ${test.input} → ${result?.mainPartName} (${(result?.confidence * 100).toFixed(0)}%)`);
    } else {
      console.log(`❌ ${test.description}: ${test.input} → Expected: ${test.expected}, Got: ${result?.mainPartName || 'null'}`);
    }
  });
  
  // Test headlamp context detection
  console.log('\n🚗 Testing Headlamp Context Detection:');
  headlampContextTests.forEach(test => {
    totalTests++;
    const result = findSmartPartMatch(test.input, test.context);
    const passed = result?.mainPartName === test.expected;
    
    if (passed) {
      passedTests++;
      console.log(`✅ ${test.description}: ${test.input} with context ${test.context} → ${result?.mainPartName} (${(result?.confidence * 100).toFixed(0)}%)`);
    } else {
      console.log(`❌ ${test.description}: ${test.input} with context ${test.context} → Expected: ${test.expected}, Got: ${result?.mainPartName || 'null'}`);
    }
  });
  
  // Test supersession detection
  console.log('\n🔄 Testing Supersession Detection:');
  supersessionTests.forEach(test => {
    totalTests++;
    const supersessions = detectSupersession(test.lines);
    const passed = supersessions.length === test.expectedSupersessions;
    
    if (passed) {
      passedTests++;
      console.log(`✅ ${test.description}: Detected ${supersessions.length} supersessions`);
    } else {
      console.log(`❌ ${test.description}: Expected ${test.expectedSupersessions}, Got ${supersessions.length}`);
    }
  });
  
  // Test part number detection
  console.log('\n🔢 Testing Part Number Detection:');
  partNumberTests.forEach(test => {
    totalTests++;
    const result = isLikelyPartNumber(test.input);
    const passed = result === test.expected;
    
    if (passed) {
      passedTests++;
      console.log(`✅ ${test.description}: ${test.input} → ${result}`);
    } else {
      console.log(`❌ ${test.description}: ${test.input} → Expected: ${test.expected}, Got: ${result}`);
    }
  });
  
  // Test manufacturer detection
  console.log('\n🏭 Testing Manufacturer Detection:');
  manufacturerTests.forEach(test => {
    totalTests++;
    const result = extractManufacturerHint(test.input);
    const passed = result === test.expected;
    
    if (passed) {
      passedTests++;
      console.log(`✅ ${test.description}: ${test.input} → ${result}`);
    } else {
      console.log(`❌ ${test.description}: ${test.input} → Expected: ${test.expected}, Got: ${result}`);
    }
  });
  
  // Test enhanced part extraction
  console.log('\n🚀 Testing Enhanced Part Extraction:');
  const sampleText = [
    '84002vc160. 1. Lamp Assembly-Head Right',
    'Unit Assy, Headlamp, LH',
    'Radar Control unit with software',
    'Charge Air cooler'
  ];
  
  totalTests++;
  const extractedParts = extractPartsWithSupersession(sampleText);
  const expectedParts = 4;
  const passed = extractedParts.length === expectedParts;
  
  if (passed) {
    passedTests++;
    console.log(`✅ Enhanced extraction: Found ${extractedParts.length} parts`);
    extractedParts.forEach((part, index) => {
      console.log(`   ${index + 1}. ${part.mainPartName} (${(part.confidence * 100).toFixed(0)}%) - ${part.context}`);
    });
  } else {
    console.log(`❌ Enhanced extraction: Expected ${expectedParts}, Got ${extractedParts.length}`);
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! The intelligent part matching system is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the results above.');
  }
  
  return { passed: passedTests, total: totalTests, successRate: (passedTests / totalTests) * 100 };
};

// Export for use in development
export default runAllTests;
