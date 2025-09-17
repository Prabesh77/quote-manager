/**
 * Parser utility for extracting quote data from Partscheck and RepairConnection formats
 */

export interface ParsedQuoteData {
  quoteRef: string;
  vin: string;
  make: string;
  model: string;
  series: string;
  auto: string;
  body: string;
  mthyr: string;
  rego: string;
  requiredBy: string;
  customer: string;
  address: string;
  phone: string;
  notes: string;
  source: 'partscheck' | 'repairconnection' | 'unknown';
}

// List of known vehicle makes/brands for parsing
const KNOWN_MAKES = [
  'Ford', 'Holden', 'Toyota', 'Mazda', 'Nissan', 'Mitsubishi', 'Subaru', 'Honda',
  'Hyundai', 'Kia', 'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Porsche', 'Volvo',
  'Jaguar', 'Land Rover', 'Range Rover', 'Lexus', 'Infiniti', 'Acura', 'Genesis',
  'Chevrolet', 'Dodge', 'Chrysler', 'Jeep', 'Cadillac', 'Lincoln', 'Buick',
  'Fiat', 'Alfa Romeo', 'Maserati', 'Ferrari', 'Lamborghini', 'Bentley', 'Rolls Royce',
  'Mini', 'Smart', 'Saab', 'MG', 'Haval', 'Chery', 'BYD', 'Great Wall', 'Geely',
  'Tesla', 'Polestar', 'Rivian', 'Lucid'
];

/**
 * Parse vehicle make and model from combined Vehicle field
 * @param vehicleString - Combined make and model string
 * @returns Object with make and model separated
 */
function parseVehicleMakeModel(vehicleString: string): { make: string; model: string } {
  if (!vehicleString || typeof vehicleString !== 'string') {
    return { make: '', model: '' };
  }

  const cleanVehicle = vehicleString.trim();
  
  // Try to find a known make at the beginning of the string
  for (const make of KNOWN_MAKES) {
    const makeRegex = new RegExp(`^${make}\\s+`, 'i');
    if (makeRegex.test(cleanVehicle)) {
      const model = cleanVehicle.replace(makeRegex, '').trim();
      return { make, model };
    }
  }

  // If no known make found, try to extract first word as make
  const words = cleanVehicle.split(/\s+/);
  if (words.length >= 2) {
    const make = words[0];
    const model = words.slice(1).join(' ');
    return { make, model };
  }

  // If only one word, treat as make
  return { make: cleanVehicle, model: '' };
}

/**
 * Parse transmission field to boolean string
 * @param transString - Transmission string
 * @returns 'true' for automatic, 'false' for manual, 'true' as default
 */
function parseTransmission(transString: string): string {
  if (!transString) return 'true';
  
  const lowerTrans = transString.toLowerCase();
  if (lowerTrans.includes('manual')) {
    return 'false';
  }
  // Default to automatic for 'automatic', 'auto', or any other value
  return 'true';
}

/**
 * Clean and format date strings
 * @param dateString - Raw date string
 * @returns Formatted date string or original if parsing fails
 */
function formatDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    // Handle various date formats
    const cleanDate = dateString.trim();
    
    // If it already looks like dd/mm/yyyy, return as is
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(cleanDate)) {
      return cleanDate;
    }
    
    // Try to parse and reformat
    const parsed = new Date(cleanDate);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('en-AU'); // Australian format
    }
    
    return cleanDate;
  } catch {
    return dateString;
  }
}

/**
 * Detect the format type based on content
 * @param text - Raw text content
 * @returns Detected format type
 */
function detectFormat(text: string): 'partscheck' | 'repairconnection' | 'unknown' {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('required by:') && lowerText.includes('purchaser:')) {
    return 'partscheck';
  }
  
  if (lowerText.includes('received:') && lowerText.includes('bodyshop:')) {
    return 'repairconnection';
  }
  
  return 'unknown';
}

/**
 * Parse Partscheck format
 * @param text - Raw text content
 * @returns Parsed quote data
 */
function parsePartscheckFormat(text: string): Partial<ParsedQuoteData> {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const data: Partial<ParsedQuoteData> = { source: 'partscheck' };
  
  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    if (!key || valueParts.length === 0) continue;
    
    const value = valueParts.join(':').trim();
    const lowerKey = key.toLowerCase();
    
    switch (lowerKey) {
      case 'required by':
        data.requiredBy = formatDate(value);
        break;
      case 'purchaser':
        data.customer = value;
        break;
      case 'address':
        data.address = value;
        break;
      case 'ph':
        data.phone = value;
        break;
      case 'estimator':
        data.notes = `Estimator: ${value}`;
        break;
      case 'reference':
        data.quoteRef = value;
        break;
      case 'make':
        data.make = value;
        break;
      case 'model':
        data.model = value;
        break;
      case 'model nr':
        data.series = value;
        break;
      case 'trans':
        data.auto = parseTransmission(value);
        break;
      case 'colour':
        data.notes = (data.notes || '') + (data.notes ? ' | ' : '') + `Colour: ${value}`;
        break;
      case 'vin':
        data.vin = value;
        break;
      case 'body':
        data.body = value;
        break;
      case 'mth/yr':
        data.mthyr = value;
        break;
      case 'veh reg':
        data.rego = value;
        break;
      case 'claim nr':
        data.notes = (data.notes || '') + (data.notes ? ' | ' : '') + `Claim Nr: ${value}`;
        break;
    }
  }
  
  return data;
}

/**
 * Parse RepairConnection format
 * @param text - Raw text content
 * @returns Parsed quote data
 */
function parseRepairConnectionFormat(text: string): Partial<ParsedQuoteData> {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const data: Partial<ParsedQuoteData> = { source: 'repairconnection' };
  
  for (const line of lines) {
    const [key, ...valueParts] = line.split(':');
    if (!key || valueParts.length === 0) continue;
    
    const value = valueParts.join(':').trim();
    const lowerKey = key.toLowerCase();
    
    switch (lowerKey) {
      case 'received':
        data.notes = `Received: ${value}`;
        break;
      case 'bodyshop':
        data.customer = value;
        break;
      case 'repairer address':
        data.address = value;
        break;
      case 'repairer contact':
        data.notes = (data.notes || '') + (data.notes ? ' | ' : '') + `Contact: ${value}`;
        break;
      case 'telephone':
        data.phone = value;
        break;
      case 'email':
        data.notes = (data.notes || '') + (data.notes ? ' | ' : '') + `Email: ${value}`;
        break;
      case 'estimate number':
        data.quoteRef = value;
        break;
      case 'insurer':
        data.notes = (data.notes || '') + (data.notes ? ' | ' : '') + `Insurer: ${value}`;
        break;
      case 'claim number':
        data.notes = (data.notes || '') + (data.notes ? ' | ' : '') + `Claim: ${value}`;
        break;
      case 'required':
        // Parse duration like "0h:55m" and calculate deadline from current time
        try {
          const durationMatch = value.match(/(\d+)h:(\d+)m/);
          if (durationMatch) {
            const hours = parseInt(durationMatch[1]);
            const minutes = parseInt(durationMatch[2]);
            
            // Add duration to current time
            const now = new Date();
            const deadline = new Date(now.getTime() + (hours * 60 + minutes) * 60 * 1000);
            
            // Format as "DD/MM/YYYY H:MMam/pm"
            const day = deadline.getDate().toString().padStart(2, '0');
            const month = (deadline.getMonth() + 1).toString().padStart(2, '0');
            const year = deadline.getFullYear();
            const hours12 = deadline.getHours() % 12 || 12;
            const mins = deadline.getMinutes().toString().padStart(2, '0');
            const ampm = deadline.getHours() >= 12 ? 'pm' : 'am';
            
            data.requiredBy = `${day}/${month}/${year} ${hours12}:${mins}${ampm}`;
          } else {
            // If not a duration format, just use the value as is
            data.requiredBy = value;
          }
        } catch (e) {
          // If parsing fails, use the original value
          data.requiredBy = value;
        }
        break;
      case 'vehicle':
        const { make, model } = parseVehicleMakeModel(value);
        data.make = make;
        data.model = model;
        break;
      case 'manufactured':
        data.mthyr = value;
        break;
      case 'registration':
        data.rego = value;
        break;
      case 'vin':
        data.vin = value;
        break;
      case 'body':
        data.body = value;
        break;
      case 'transmission':
        data.auto = parseTransmission(value);
        break;
      case 'colour':
        data.notes = (data.notes || '') + (data.notes ? ' | ' : '') + `Colour: ${value}`;
        break;
    }
  }
  
  return data;
}

/**
 * Main parser function that detects format and parses accordingly
 * @param text - Raw text content from textarea
 * @returns Parsed quote data
 */
export function parseQuoteData(text: string): ParsedQuoteData {
  if (!text || typeof text !== 'string') {
    return {
      quoteRef: '',
      vin: '',
      make: '',
      model: '',
      series: '',
      auto: 'true',
      body: '',
      mthyr: '',
      rego: '',
      requiredBy: '',
      customer: '',
      address: '',
      phone: '',
      notes: '',
      source: 'unknown'
    };
  }

  const format = detectFormat(text);
  
  let parsedData: Partial<ParsedQuoteData>;
  
  switch (format) {
    case 'partscheck':
      parsedData = parsePartscheckFormat(text);
      break;
    case 'repairconnection':
      parsedData = parseRepairConnectionFormat(text);
      break;
    default:
      parsedData = { source: 'unknown' };
  }

  // Merge with default values
  return {
    quoteRef: parsedData.quoteRef || '',
    vin: parsedData.vin || '',
    make: parsedData.make || '',
    model: parsedData.model || '',
    series: parsedData.series || '',
    auto: parsedData.auto || 'true',
    body: parsedData.body || '',
    mthyr: parsedData.mthyr || '',
    rego: parsedData.rego || '',
    requiredBy: parsedData.requiredBy || '',
    customer: parsedData.customer || '',
    address: parsedData.address || '',
    phone: parsedData.phone || '',
    notes: parsedData.notes || '',
    source: parsedData.source || 'unknown'
  };
}

/**
 * Check if the text appears to be in a supported format
 * @param text - Raw text content
 * @returns True if format is supported
 */
export function isSupportedFormat(text: string): boolean {
  return detectFormat(text) !== 'unknown';
}
