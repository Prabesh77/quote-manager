'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  X,
  Plus,
  AlertCircle
} from 'lucide-react';

// Function to get part icon from /public/part-icons
const getPartIcon = (partName: string): string | null => {
  const iconMap: Record<string, string> = {
    'Radiator': '/part-icons/radiator.png',
    'Left Headlamp': '/part-icons/headlight-left.png',
    'Right Headlamp': '/part-icons/headlight-right.png',
    'Condenser': '/part-icons/condenser.png',
    'Radar Sensor': '/part-icons/sensor.png',
    'Fan Assembly': '/part-icons/fan.png',
    'Intercooler': '/part-icons/intercooler.png',
  };
  
  return iconMap[partName] || null;
};

const PART_OPTIONS = [
  { name: 'Radiator', icon: getPartIcon('Radiator') },
  { name: 'Left Headlamp', icon: getPartIcon('Left Headlamp') },
  { name: 'Right Headlamp', icon: getPartIcon('Right Headlamp') },
  { name: 'Condenser', icon: getPartIcon('Condenser') },
  { name: 'Radar Sensor', icon: getPartIcon('Radar Sensor') },
  { name: 'Fan Assembly', icon: getPartIcon('Fan Assembly') },
  { name: 'Intercooler', icon: getPartIcon('Intercooler') },
];

interface PartDetails {
  name: string;
  number: string;
  price: number | null;
  note: string;
}

interface QuoteFormProps {
  onSubmit: (fields: Record<string, string>, parts: PartDetails[]) => void;
}

export const QuoteForm = ({ onSubmit }: QuoteFormProps) => {
  const [rawText, setRawText] = useState('');
  const [fields, setFields] = useState({
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
  });
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [partDetails, setPartDetails] = useState<Record<string, PartDetails>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');

  const handlePaste = () => {
    const lines = rawText.split('\n');
    const parsed: Record<string, string> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const trimmedLine = lines[i].trim();
      if (!trimmedLine) continue;
      
      // Handle different patterns in the data
      let key = '';
      let value = '';
      
      // Pattern 1: "Reference28495#2" (no space)
      if (trimmedLine.match(/^(Reference|Make|Model|Series|Trans|Body|Mth\/Yr|Veh Reg)(.+)$/i)) {
        const match = trimmedLine.match(/^(Reference|Make|Model|Series|Trans|Body|Mth\/Yr|Veh Reg)(.+)$/i);
        if (match) {
          key = match[1].toLowerCase();
          value = match[2].trim();
        }
      }
      // Pattern 2: "Reference 28495#2" (with space)
      else if (trimmedLine.match(/^(Reference|Make|Model|Series|Trans|Body|Mth\/Yr|Veh Reg)\s+(.+)$/i)) {
        const match = trimmedLine.match(/^(Reference|Make|Model|Series|Trans|Body|Mth\/Yr|Veh Reg)\s+(.+)$/i);
        if (match) {
          key = match[1].toLowerCase();
          value = match[2].trim();
        }
      }
      // Pattern 3: "Reference: 28495#2" (with colon)
      else if (trimmedLine.includes(':')) {
        const [k, ...rest] = trimmedLine.split(':');
        key = k.trim().toLowerCase();
        value = rest.join(':').trim();
      }
      // Pattern 4: Standalone "VIN" followed by value on next line
      else if (trimmedLine === 'VIN' && i + 1 < lines.length) {
        key = 'vin';
        value = lines[i + 1].trim();
        i++; // Skip the next line since we've processed it
      }
      // Pattern 5: "Required By" followed by value on next line
      else if (trimmedLine === 'Required By' && i + 1 < lines.length) {
        key = 'required by';
        // Get the next two lines for date and time
        const dateLine = lines[i + 1]?.trim();
        const timeLine = lines[i + 2]?.trim();
        
        if (dateLine && timeLine) {
          try {
            // Parse the date (format: "08/04/2025" - dd/mm/yyyy for Australian format)
            const [day, month, year] = dateLine.split('/');
            
            // Debug logging
            console.log('Date parsing:', { dateLine, day, month, year });
            
            // Validate date components
            if (!day || !month || !year || isNaN(parseInt(day)) || isNaN(parseInt(month)) || isNaN(parseInt(year))) {
              throw new Error('Invalid date format');
            }
            
            // Parse the time (format: "12:00pm" or "1200pm")
            const timeStr = timeLine.toLowerCase();
            let hours = 0;
            let minutes = 0;
            
            if (timeStr.includes('pm')) {
              const time = timeStr.replace('pm', '');
              if (time.includes(':')) {
                const [h, m] = time.split(':');
                const hour = parseInt(h);
                // 12 PM should be 12, not 24
                hours = hour === 12 ? 12 : hour + 12;
                minutes = parseInt(m || '0');
              } else {
                // Handle format like "1200pm"
                const timeNum = parseInt(time);
                const hour = Math.floor(timeNum / 100);
                // 12 PM should be 12, not 24
                hours = hour === 12 ? 12 : hour + 12;
                minutes = timeNum % 100;
              }
            } else if (timeStr.includes('am')) {
              const time = timeStr.replace('am', '');
              if (time.includes(':')) {
                const [h, m] = time.split(':');
                hours = parseInt(h);
                minutes = parseInt(m || '0');
              } else {
                // Handle format like "1200am"
                const timeNum = parseInt(time);
                hours = Math.floor(timeNum / 100);
                minutes = timeNum % 100;
              }
            }
            
            // Validate time components
            if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
              throw new Error('Invalid time format');
            }
            
            // Create ISO timestamp
            const deadline = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hours, minutes);
            
            // Debug logging
            console.log('Created deadline:', { deadline: deadline.toISOString(), year, month, day, hours, minutes });
            
            // Validate the created date
            if (isNaN(deadline.getTime())) {
              throw new Error('Invalid date/time combination');
            }
            
            value = deadline.toISOString();
          } catch (error) {
            // Fallback to original format if parsing fails
            value = `${dateLine} ${timeLine}`;
          }
          i += 2; // Skip the next two lines since we've processed them
        } else if (dateLine) {
          value = dateLine;
          i += 1; // Skip the next line since we've processed it
        }
      }
      
      console.log('Before continue check - key:', key, 'value:', value);
      if (!key || !value) {
        console.log('Continue triggered - key or value is empty');
        continue;
      }
      
      console.log('Processing key:', key, 'value:', value);
      
      // Map the keys to our form fields
      switch (key) {
        case 'reference':
          parsed['quoteRef'] = value;
          break;
        case 'vin':
          parsed['vin'] = value;
          break;
        case 'make':
          parsed['make'] = value;
          break;
        case 'model':
          parsed['model'] = value;
          break;
        case 'series':
          parsed['series'] = value;
          break;
        case 'trans':
          parsed['auto'] = value.toLowerCase().includes('auto') ? 'true' : 'false';
          break;
        case 'body':
          parsed['body'] = value;
          break;
        case 'mth/yr':
        case 'mthyr':
          parsed['mthyr'] = value;
          break;
        case 'veh reg':
          parsed['rego'] = value;
          break;
        case 'required by':
          parsed['requiredBy'] = value;
          break;
        case 'customer':
          parsed['customer'] = value;
          console.log('Mapped customer to parsed:', value);
          break;
        case 'address':
          parsed['address'] = value;
          console.log('Mapped address to parsed:', value);
          break;
        case 'phone':
          parsed['phone'] = value;
          console.log('Mapped phone to parsed:', value);
          break;
      }
    }
    
    console.log('Reached end of parsing loop');
    console.log('Final parsed object:', parsed);
    console.log('Setting customer to:', parsed['customer']);
    console.log('Setting address to:', parsed['address']);
    console.log('Setting phone to:', parsed['phone']);
    setFields({
      quoteRef: parsed['quoteRef'] || '',
      vin: parsed['vin'] || '',
      make: parsed['make'] || '',
      model: parsed['model'] || '',
      series: parsed['series'] || '',
      auto: parsed['auto'] || 'true',
      body: parsed['body'] || '',
      mthyr: parsed['mthyr'] || '',
      rego: parsed['rego'] || '',
      requiredBy: parsed['requiredBy'] || '',
      customer: parsed['customer'] || '',
      address: parsed['address'] || '',
      phone: parsed['phone'] || '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  const handleAutoChange = (value: string) => {
    setFields({ ...fields, auto: value });
  };

  const clearForm = () => {
    setRawText('');
    setFields({
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
    });
    setSelectedParts([]);
    setPartDetails({});
  };

  const togglePart = (partName: string) => {
    setSelectedParts(prev => {
      if (prev.includes(partName)) {
        // Remove part and its details
        const newDetails = { ...partDetails };
        delete newDetails[partName];
        setPartDetails(newDetails);
        return prev.filter(p => p !== partName);
      } else {
        // Add part with default details
        setPartDetails(prev => ({
          ...prev,
          [partName]: {
            name: partName,
            number: '',
            price: null,
            note: ''
          }
        }));
        return [...prev, partName];
      }
    });
  };

  const updatePartDetail = (partName: string, field: keyof PartDetails, value: string | number | null) => {
    setPartDetails(prev => ({
      ...prev,
      [partName]: {
        ...prev[partName],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { quoteRef, vin, make, model, series, auto, body, mthyr, rego, requiredBy, customer, address, phone } = fields;
    if (!quoteRef) return;
    if (selectedParts.length === 0) {
      setValidationMessage('Please select at least one part');
      setShowValidationPopup(true);
      return;
    }
    
    // Validate that all parts have part numbers
    const partsWithoutNumbers = selectedParts.filter(partName => {
      const part = partDetails[partName];
      return !part || !part.number || part.number.trim() === '';
    });
    
    if (partsWithoutNumbers.length > 0) {
      const missingParts = partsWithoutNumbers.join(', ');
      setValidationMessage(`Please add part numbers for the following parts: ${missingParts}`);
      setShowValidationPopup(true);
      return;
    }
    
    setIsLoading(true);
    try {
      // Convert part details to array
      const partsArray = selectedParts.map(partName => partDetails[partName]);
      
      await onSubmit({
        quoteRef,
        vin,
        make,
        model,
        series,
        auto,
        body,
        mthyr,
        rego,
        requiredBy,
        customer,
        address,
        phone,
      }, partsArray);
      clearForm();
    } catch (error) {
      // console.error('Error submitting quote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Create New Quote</h2>
      
      {/* Raw Data Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paste Raw Data
        </label>
        <div className="relative">
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
            onPaste={(e) => {
              // Get the pasted text immediately
              const pastedText = e.clipboardData.getData('text');
              setRawText(pastedText);
              // Process the pasted text directly
                const lines = pastedText.split('\n');
                const parsed: Record<string, string> = {};
                
                for (let i = 0; i < lines.length; i++) {
                  const trimmedLine = lines[i].trim();
                  if (!trimmedLine) continue;
                  

                  
                  // Handle different patterns in the data
                  let key = '';
                  let value = '';
                  
                  // Pattern 1: "Reference28495#2" (no space) - but exclude "Model Nr"
                  if (trimmedLine.match(/^(Reference|Make|Series|Trans|Body|Mth\/Yr|Veh Reg)(.+)$/i)) {
                    const match = trimmedLine.match(/^(Reference|Make|Series|Trans|Body|Mth\/Yr|Veh Reg)(.+)$/i);
                    if (match) {
                      key = match[1].toLowerCase();
                      value = match[2].trim();
                    }
                  }
                  // Pattern 1.5: "ModelAccent" (Model without space) - but ignore "Model Nr"
                  else if (trimmedLine.match(/^Model(.+)$/i)) {
                    const match = trimmedLine.match(/^Model(.+)$/i);
                    if (match) {
                      const modelValue = match[1].trim();
                      // If the value is "Nr", ignore it (it's not a model value)
                      if (modelValue !== 'Nr') {
                        key = 'model';
                        value = modelValue;
                      }
                    }
                  }
                  // Pattern 2: "Reference 28495#2" (with space)
                  else if (trimmedLine.match(/^(Reference|Make|Series|Trans|Body|Mth\/Yr|Veh Reg)\s+(.+)$/i)) {
                    const match = trimmedLine.match(/^(Reference|Make|Series|Trans|Body|Mth\/Yr|Veh Reg)\s+(.+)$/i);
                    if (match) {
                      key = match[1].toLowerCase();
                      value = match[2].trim();
                    }
                  }
                  // Pattern 3: "Ph:" followed by phone number (check before general colon pattern)
                  else if (trimmedLine.startsWith('Ph:')) {
                    key = 'phone';
                    value = trimmedLine.replace('Ph:', '').trim();

                  }
                  // Pattern 4: "Reference: 28495#2" (with colon)
                  else if (trimmedLine.includes(':')) {
                    const [k, ...rest] = trimmedLine.split(':');
                    key = k.trim().toLowerCase();
                    value = rest.join(':').trim();

                  }
                  // Pattern 5: Standalone "VIN" followed by value on next line
                  else if (trimmedLine === 'VIN' && i + 1 < lines.length) {
                    key = 'vin';
                    value = lines[i + 1].trim();
                    i++; // Skip the next line since we've processed it
                  }
                  // Pattern 6: "Purchaser" followed by customer name
                  else if (trimmedLine.startsWith('Purchaser')) {
                    key = 'customer';
                    value = trimmedLine.replace('Purchaser', '').trim();

                  }
                  // Pattern 7: Address lines (after Purchaser, before Ph:)
                  else if (trimmedLine && !trimmedLine.includes(':') && !trimmedLine.match(/^(Reference|Make|Model|Series|Trans|Body|Mth\/Yr|Veh Reg|Required By|Purchaser|Ph:|General Info|Vehicle Info|Quote Status|Estimator)/i)) {
                    // Check if this might be an address line
                    if (i > 0) {
                      const prevLine = lines[i - 1]?.trim();
                      // If we haven't found an address yet and this line looks like an address
                      if (!parsed['address'] && prevLine && prevLine.startsWith('Purchaser')) {
                        key = 'address';
                        value = trimmedLine;
                        // Look ahead for additional address lines
                        let fullAddress = trimmedLine;
                        let nextIndex = i + 1;
                        while (nextIndex < lines.length) {
                          const nextLine = lines[nextIndex]?.trim();
                          if (nextLine && !nextLine.includes(':') && !nextLine.match(/^(Reference|Make|Model|Series|Trans|Body|Mth\/Yr|Veh Reg|Required By|Purchaser|Ph:|General Info|Vehicle Info|Quote Status|Estimator)/i)) {
                            fullAddress += ', ' + nextLine;
                            nextIndex++;
                          } else {
                            break;
                          }
                        }
                        value = fullAddress;
                        i = nextIndex - 1; // Skip the processed lines
                        // Don't continue - let it reach the switch statement
                      }
                    }
                  }
                  // Pattern 8: "Required By" followed by value on next line
                  else if (trimmedLine === 'Required By' && i + 1 < lines.length) {
                    key = 'required by';
                    // Get the next two lines for date and time, skipping empty lines
                    let dateLine = '';
                    let timeLine = '';
                    let lineIndex = i + 1;
                    
                    // Find the first non-empty line for date
                    while (lineIndex < lines.length && !dateLine) {
                      const line = lines[lineIndex]?.trim();
                      if (line) {
                        dateLine = line;
                      }
                      lineIndex++;
                    }
                    
                    // Find the next non-empty line for time
                    while (lineIndex < lines.length && !timeLine) {
                      const line = lines[lineIndex]?.trim();
                      if (line) {
                        timeLine = line;
                      }
                      lineIndex++;
                    }
                    
                    if (dateLine && timeLine) {
                      try {
                        // Parse the date (format: "08/04/2025" - dd/mm/yyyy for Australian format)
                        const [day, month, year] = dateLine.split('/');
                        
                        // Debug logging
                        console.log('Date parsing (second occurrence):', { dateLine, day, month, year });
                        
                        // Validate date components
                        if (!day || !month || !year || isNaN(parseInt(day)) || isNaN(parseInt(month)) || isNaN(parseInt(year))) {
                          console.log('Date validation failed');
                          throw new Error('Invalid date format');
                        }
                        
                        console.log('Date validation passed');
                        
                        // Parse the time (format: "12:00pm" or "1200pm")
                        const timeStr = timeLine.toLowerCase();
                        let hours = 0;
                        let minutes = 0;
                        
                        if (timeStr.includes('pm')) {
                          const time = timeStr.replace('pm', '');
                          if (time.includes(':')) {
                            const [h, m] = time.split(':');
                            const hour = parseInt(h);
                            // 12 PM should be 12, not 24
                            hours = hour === 12 ? 12 : hour + 12;
                            minutes = parseInt(m || '0');
                          } else {
                            // Handle format like "1200pm"
                            const timeNum = parseInt(time);
                            const hour = Math.floor(timeNum / 100);
                            // 12 PM should be 12, not 24
                            hours = hour === 12 ? 12 : hour + 12;
                            minutes = timeNum % 100;
                          }
                        } else if (timeStr.includes('am')) {
                          const time = timeStr.replace('am', '');
                          if (time.includes(':')) {
                            const [h, m] = time.split(':');
                            hours = parseInt(h);
                            minutes = parseInt(m || '0');
                          } else {
                            // Handle format like "1200am"
                            const timeNum = parseInt(time);
                            hours = Math.floor(timeNum / 100);
                            minutes = timeNum % 100;
                          }
                        }
                        
                        // Validate time components
                        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
                          console.log('Time validation failed:', { hours, minutes });
                          throw new Error('Invalid time format');
                        }
                        
                        console.log('Time validation passed:', { hours, minutes });
                        
                        // Create ISO timestamp
                        const deadline = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hours, minutes);
                        
                        // Debug logging
                        console.log('Created deadline (second occurrence):', { deadline: deadline.toISOString(), year, month, day, hours, minutes });
                        
                        // Validate the created date
                        if (isNaN(deadline.getTime())) {
                          console.log('Deadline validation failed');
                          throw new Error('Invalid date/time combination');
                        }
                        
                        console.log('Deadline validation passed');
                        value = deadline.toISOString();
                        console.log('Final value:', value);
                      } catch (error) {
                        // Fallback to original format if parsing fails
                        console.log('Date parsing failed, using fallback:', error);
                        value = `${dateLine} ${timeLine}`;
                        console.log('Fallback value:', value);
                      }
                      // Skip the lines we processed
                      i = lineIndex - 1;
                    } else if (dateLine) {
                      value = dateLine;
                      i = lineIndex - 1;
                    }
                  }
                  
                  if (!key || !value) continue;
                  
                  // Map the keys to our form fields
                  switch (key) {
                    case 'reference':
                      parsed['quoteRef'] = value;
                      break;
                    case 'vin':
                      parsed['vin'] = value;
                      break;
                    case 'make':
                      parsed['make'] = value;
                      break;
                    case 'model':
                      parsed['model'] = value;
                      break;
                    case 'series':
                      parsed['series'] = value;
                      break;
                    case 'trans':
                      parsed['auto'] = value.toLowerCase().includes('auto') ? 'true' : 'false';
                      break;
                    case 'body':
                      parsed['body'] = value;
                      break;
                    case 'mth/yr':
                    case 'mthyr':
                      parsed['mthyr'] = value;
                      break;
                    case 'veh reg':
                      parsed['rego'] = value;
                      break;
                    case 'required by':
                      parsed['requiredBy'] = value;
                      break;
                    case 'customer':
                      parsed['customer'] = value;

                      break;
                    case 'address':
                      parsed['address'] = value;

                      break;
                    case 'phone':
                      parsed['phone'] = value;

                      break;
                  }
                }
                
                setFields({
                  quoteRef: parsed['quoteRef'] || '',
                  vin: parsed['vin'] || '',
                  make: parsed['make'] || '',
                  model: parsed['model'] || '',
                  series: parsed['series'] || '',
                  auto: parsed['auto'] || 'true',
                  body: parsed['body'] || '',
                  mthyr: parsed['mthyr'] || '',
                  rego: parsed['rego'] || '',
                  requiredBy: parsed['requiredBy'] || '',
                  customer: parsed['customer'] || '',
                  address: parsed['address'] || '',
                  phone: parsed['phone'] || '',
                });
                            }}
            placeholder="Paste your quote data here and it will auto-populate the form below..."
            className="w-full h-32 p-4 text-sm border-2 border-gray-300 rounded-lg shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:outline-none transition-all duration-200 bg-gray-50 font-mono resize-none"
            style={{
              backgroundImage: 'linear-gradient(45deg, #f9fafb 25%, transparent 25%), linear-gradient(-45deg, #f9fafb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f9fafb 75%), linear-gradient(-45deg, transparent 75%, #f9fafb 75%)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
            }}
          />
          <div className="absolute top-2 right-2">
            <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Auto-fill enabled</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Paste your data and the form will automatically populate below
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quote Reference
          </label>
          <Input
            name="quoteRef"
            value={fields.quoteRef}
            onChange={handleChange}
            className="w-full h-8 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            VIN Number
          </label>
          <Input
            name="vin"
            value={fields.vin}
            onChange={handleChange}
            className="w-full h-8 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle Make
          </label>
          <Input
            name="make"
            value={fields.make}
            onChange={handleChange}
            className="w-full h-8 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle Model
          </label>
          <Input
            name="model"
            value={fields.model}
            onChange={handleChange}
            className="w-full h-8 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle Series
          </label>
          <Input
            name="series"
            value={fields.series}
            onChange={handleChange}
            className="w-full h-8 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Transmission Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="auto"
                value="true"
                checked={fields.auto === 'true'}
                onChange={(e) => handleAutoChange(e.target.value)}
                className="mr-2 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">Automatic</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="auto"
                value="false"
                checked={fields.auto === 'false'}
                onChange={(e) => handleAutoChange(e.target.value)}
                className="mr-2 text-red-600 focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">Manual</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Body Type
          </label>
          <Input
            name="body"
            value={fields.body}
            onChange={handleChange}
            className="w-full h-8 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Month/Year
          </label>
          <Input
            name="mthyr"
            value={fields.mthyr}
            onChange={handleChange}
            className="w-full h-8 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Rego
          </label>
          <Input
            name="rego"
            value={fields.rego}
            onChange={handleChange}
            className="w-full h-8 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Required By
          </label>
          <Input
            name="requiredBy"
            value={fields.requiredBy}
            onChange={handleChange}
            placeholder="e.g., 28/07/2025 12:00pm"
            className="w-full h-8 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Customer Name
          </label>
          <Input
            name="customer"
            value={fields.customer}
            onChange={handleChange}
            placeholder=""
            className="w-full h-8 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <Input
            name="address"
            value={fields.address}
            onChange={handleChange}
            placeholder=""
            className="w-full h-8 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <Input
            name="phone"
            value={fields.phone}
            onChange={handleChange}
            placeholder="e.g., 03 9786 8199"
            className="w-full h-8 text-sm"
          />
        </div>
      </div>

      {/* Parts Selection */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Parts Required
        </label>
        <div className="flex flex-wrap gap-2 mb-4">
          {PART_OPTIONS.map((part) => {
            const iconUrl = part.icon;
            const isSelected = selectedParts.includes(part.name);
            
            return (
              <button
                key={part.name}
                type="button"
                onClick={() => togglePart(part.name)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer flex items-center space-x-2 ${
                  isSelected
                    ? 'bg-red-600 text-white shadow-md hover:bg-red-700 border-2 border-red-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200'
                }`}
              >
                {iconUrl && (
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200">
                    <img src={iconUrl} alt={part.name} className="h-4 w-4 object-contain" />
                  </div>
                )}
                <span>{part.name}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Part Details */}
        {selectedParts.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-md font-semibold text-gray-800 flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Part Details</span>
            </h3>
            
            {selectedParts.map((partName) => {
              const part = partDetails[partName];
              const iconUrl = getPartIcon(partName);
              
              return (
                <div key={partName} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {iconUrl && (
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200">
                          <img src={iconUrl} alt={partName} className="h-4 w-4 object-contain" />
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{partName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePart(partName)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove part"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Part Number *
                      </label>
                      <Input
                        value={part.number}
                        onChange={(e) => updatePartDetail(partName, 'number', e.target.value)}
                        placeholder="Enter part number"
                        className="w-full h-8 text-sm"
                      />
                    </div>
                    
                    {/* Price and Notes fields hidden in quote creation - will be added during pricing workflow */}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Quote Button */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <Button
          onClick={handleSubmit}
          type="submit"
          size="sm"
          disabled={isLoading}
          className="cursor-pointer bg-red-600 hover:bg-red-700 w-full max-w-64 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Creating Quote...</span>
            </div>
          ) : (
            'Create Quote'
          )}
        </Button>
      </div>

      {/* Beautiful Validation Popup */}
      {showValidationPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all border border-gray-200">
            <div className="flex items-center space-x-3 p-6 border-b border-gray-200">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Validation Required</h3>
                <p className="text-sm text-gray-600 mt-1">Please fix the following issues:</p>
              </div>
            </div>
            
            <div className="p-6">
              <p className="text-gray-700 leading-relaxed mb-3">{validationMessage.split(':')[0]}:</p>
              {validationMessage.includes('Please add part numbers for the following parts:') && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Missing part numbers:</p>
                  <div className="space-y-2">
                    {validationMessage.split('Please add part numbers for the following parts: ')[1]?.split(', ').map((part, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-white rounded border border-gray-200 shadow-sm">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm font-medium text-gray-900">{part}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end p-6 border-t border-gray-200">
              <Button
                onClick={() => setShowValidationPopup(false)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 