'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ImagePasteArea } from '@/components/ui/ImagePasteArea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  X,
  Plus,
  AlertCircle,
  Car,
  User
} from 'lucide-react';

// Function to clean part numbers by removing special characters and replacing O with 0
const cleanPartNumber = (partNumber: string): string => {
  if (!partNumber) return '';
  return partNumber
    .replace(/O/g, '0') // Replace O with 0 to avoid confusion
    .replace(/[^a-zA-Z0-9]/g, ''); // Remove all special characters
};

// Function to get part icon from /public/part-icons
const getPartIcon = (partName: string): string | null => {
  const iconMap: Record<string, string> = {
    'Radiator': '/part-icons/radiator.png',
    'Left Headlamp': '/part-icons/headlight-left.png',
    'Right Headlamp': '/part-icons/headlight-right.png',
    'Condenser': '/part-icons/condenser.png',
    'Radar Sensor': '/part-icons/sensor.png',
    'Fan Assembly': '/part-icons/fa.png',
    'Intercooler': '/part-icons/intercooler.png',
    'Left DayLight': '/part-icons/lh.png', // Use left headlight icon
    'Right DayLight': '/part-icons/rh.png', // Use right headlight icon
    'Auxiliary Radiator': '/part-icons/aux.png'
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
  { name: 'Left DayLight', icon: getPartIcon('Left DayLight') }, // Reuse fan icon for now
  { name: 'Right DayLight', icon: getPartIcon('Right DayLight') }, // Reuse fan icon for now
  { name: 'Oil Cooler', icon: getPartIcon('Radiator') }, // Reuse radiator icon for now
  { name: 'Auxiliary Radiator', icon: getPartIcon('Auxiliary Radiator') }, // Reuse radiator icon for now
];

interface PartDetails {
  name: string;
  number: string;
  price: number | null;
  note: string;
}

interface ExtractedPartInfo {
  partName: string;
  partNumber: string;
  confidence: number;
  rawText: string;
  context?: string;
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
  const [extractedParts, setExtractedParts] = useState<ExtractedPartInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [isFormAccordionOpen, setIsFormAccordionOpen] = useState(false);


  const handlePartsExtracted = (parts: ExtractedPartInfo[]) => {
    setExtractedParts(prevParts => [...prevParts, ...parts]);

    // Auto-add extracted parts to selected parts and populate details
    parts.forEach(part => {
      // Use the AI-extracted part name directly instead of re-processing raw text
      let matchedPartName = part.partName;

      // Use context information to determine Left vs Right for Headlamp and DayLight
      if (part.context && (
        matchedPartName === 'Left Headlamp' || matchedPartName === 'Right Headlamp' ||
        matchedPartName === 'Left DayLight' || matchedPartName === 'Right DayLight'
      )) {
        if (part.context === 'RH' || part.context === 'R' || part.context === 'Right') {
          if (matchedPartName.includes('Headlamp')) {
            matchedPartName = 'Right Headlamp';
          } else if (matchedPartName.includes('DayLight')) {
            matchedPartName = 'Right DayLight';
          }
        } else if (part.context === 'LH' || part.context === 'L' || part.context === 'Left') {
          if (matchedPartName.includes('Headlamp')) {
            matchedPartName = 'Left Headlamp';
          } else if (matchedPartName.includes('DayLight')) {
            matchedPartName = 'Left DayLight';
          }
        }
      }

      // Add to selected parts if not already present
        setSelectedParts(prev => {
          if (!prev.includes(matchedPartName)) {
            return [...prev, matchedPartName];
          }
          return prev;
        });

      // Populate part details with confidence information
        setPartDetails(prev => ({
          ...prev,
          [matchedPartName]: {
            name: matchedPartName,
          number: part.partNumber !== 'Not found' ? cleanPartNumber(part.partNumber) : '',
          price: null,
          note: `AI-detected - Context: ${part.context || 'None'}`
          }
        }));
    });


  };

  const handlePartRemoved = (removedPart: ExtractedPartInfo) => {
    // Remove the part from extracted parts
    setExtractedParts(prevParts =>
      prevParts.filter(part =>
        !(part.partName === removedPart.partName && part.partNumber === removedPart.partNumber)
      )
    );

    // Use the AI-extracted part name directly
    const matchedPartName = removedPart.partName;

    // Check if this part was the only source for this part name
    const remainingPartsForName = extractedParts.filter(part => {
      if (part.partName === removedPart.partName && part.partNumber === removedPart.partNumber) {
        return false; // This is the one being removed
      }

      // Use the AI-extracted part name directly
      const otherMatchedPartName = part.partName;

      return otherMatchedPartName === matchedPartName;
    });

    // If no other parts with this name, remove from selected parts and clear details
    if (remainingPartsForName.length === 0) {
      setSelectedParts(prev => prev.filter(part => part !== matchedPartName));
      setPartDetails(prev => {
        const newDetails = { ...prev };
        delete newDetails[matchedPartName];
        return newDetails;
      });
    }
  };

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
            // Parse the date (format: "11/08/2025" - dd/mm/yyyy for Australian format)
            const [day, month, year] = dateLine.split('/');


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

            // Create ISO timestamp - explicitly handle Australian DD/MM/YYYY format
            // For "11/08/2025", we want day=11, month=08 (August), year=2025
            const parsedDay = parseInt(day);
            const parsedMonth = parseInt(month);
            const parsedYear = parseInt(year);
            
            // Validate that day and month make sense for Australian format
            if (parsedDay > 31 || parsedMonth > 12) {
              throw new Error('Invalid date: day or month out of range');
            }
            
            // Additional validation: ensure day doesn't exceed month limits
            const daysInMonth = new Date(parsedYear, parsedMonth, 0).getDate();
            if (parsedDay > daysInMonth) {
              throw new Error(`Invalid date: ${parsedDay} exceeds days in month ${parsedMonth}`);
            }
            
            // Create Date object with explicit Australian DD/MM/YYYY interpretation
            const deadline = new Date(parsedYear, parsedMonth - 1, parsedDay, hours, minutes);
            


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

      if (!key || !value) {
        continue;
      }

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

    // Auto-open the form accordion when data is populated
    if (Object.values(parsed).some(value => value)) {
      setIsFormAccordionOpen(true);
    }
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Text Input Section */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
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
                      let dateTimeValue = '';
                      let nextIndex = i + 1;
                      let linesCollected = 0;

                      while (nextIndex < lines.length && linesCollected < 2) {
                        const nextLine = lines[nextIndex]?.trim();
                        if (nextLine && !nextLine.match(/^(Reference|Make|Model|Series|Trans|Body|Mth\/Yr|Veh Reg|Purchaser|Ph:|General Info|Vehicle Info|Quote Status|Estimator)/i)) {
                          if (dateTimeValue) {
                            dateTimeValue += ' ' + nextLine;
                          } else {
                            dateTimeValue = nextLine;
                          }
                          linesCollected++;
                        }
                        nextIndex++;
                        if (linesCollected >= 2) break;
                      }

                      value = dateTimeValue;
                      i = nextIndex - 1; // Skip the processed lines
                    }

                    // Map the keys to our field names
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

                  // Update form fields
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
                placeholder="Paste Quote..."
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

          {/* Image Input Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-600">
                Part Screenshots
              </label>
              <div className="px-1 py-0.5 bg-gray-100 rounded-sm text-[11px] text-gray-600">
                <span>💡 Click the area below to focus, then use paste screenshots.</span>
              </div>
            </div>
            <ImagePasteArea
              onPartsExtracted={handlePartsExtracted}
              onPartRemoved={handlePartRemoved}
              onClearAll={() => {
                setSelectedParts([]);
                setPartDetails({});
                setExtractedParts([]);
              }}
            />
          </div>
        </div>
      </div>

      {/* Form Fields Accordion */}
              <Accordion
          type="single"
          collapsible
          value={isFormAccordionOpen ? "form-fields" : ""}
          onValueChange={(value) => setIsFormAccordionOpen(value === "form-fields")}
          className="mt-6"
        >
        <AccordionItem value="form-fields" className="border border-gray-200 rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="flex flex-col space-y-2 w-full">
              {/* First Row - Basic Info */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Car className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-900">Quote Details</span>
                </div>
                {fields.customer && fields.quoteRef && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>•</span>
                    <span className="font-medium text-blue-600">{fields.customer}</span>
                    <span>•</span>
                    <span className="font-mono text-green-600">{fields.quoteRef}</span>
                    {(fields.make || fields.model) && (
                      <>
                        <span>•</span>
                        <span className="text-purple-600">
                          {fields.make && fields.model ? `${fields.make} ${fields.model}` : fields.make || fields.model}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* Second Row - VIN & Registration with Copy Buttons */}
              {(fields.vin || fields.rego) && (
                <div className="flex items-center space-x-4 text-xs text-gray-600">
                  {fields.vin && (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">VIN:</span>
                      <span className="font-mono text-gray-700">{fields.vin}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(fields.vin);
                          // Visual confirmation
                          const button = e.currentTarget;
                          const originalIcon = button.innerHTML;
                          button.innerHTML = `
                            <svg class="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          `;
                          setTimeout(() => {
                            button.innerHTML = originalIcon;
                          }, 1500);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                        title="Copy VIN"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {fields.rego && (
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Rego:</span>
                      <span className="font-mono text-gray-700">{fields.rego}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(fields.rego);
                          // Visual confirmation
                          const button = e.currentTarget;
                          const originalIcon = button.innerHTML;
                          button.innerHTML = `
                            <svg class="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          `;
                          setTimeout(() => {
                            button.innerHTML = originalIcon;
                          }, 1500);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                        title="Copy Registration"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </AccordionTrigger>

          <AccordionContent className="px-4 pb-4">
            <div className="space-y-6">
              {/* Quote Reference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quote Reference
                </label>
                <Input
                  name="quoteRef"
                  value={fields.quoteRef}
                  onChange={handleChange}
                  className="w-full h-8 text-sm"
                  placeholder="Enter quote reference number"
                />
              </div>

              {/* Vehicle Details */}
              <div className="mt-6">
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                  <Car className="h-4 w-4" />
                  <span>Vehicle Details</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            VIN
          </label>
          <Input
            name="vin"
            value={fields.vin}
            onChange={handleChange}
            className="w-full h-8 text-sm"
                      placeholder="Enter VIN"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Registration (Rego)
          </label>
          <Input
            name="rego"
            value={fields.rego}
            onChange={handleChange}
            className="w-full h-8 text-sm"
                      placeholder="Enter registration"
          />
        </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Make
                    </label>
                    <Input
                      name="make"
                      value={fields.make}
                      onChange={handleChange}
                      className="w-full h-8 text-sm"
                      placeholder="e.g., Toyota, Honda"
                    />
      </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model
                    </label>
                    <Input
                      name="model"
                      value={fields.model}
                      onChange={handleChange}
                      className="w-full h-8 text-sm"
                      placeholder="e.g., Camry, Civic"
                    />
      </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Series
                    </label>
                    <Input
                      name="series"
                      value={fields.series}
                      onChange={handleChange}
                      className="w-full h-8 text-sm"
                      placeholder="e.g., LE, EX"
                    />
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
                      placeholder="e.g., Sedan, SUV"
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
                      placeholder="e.g., 2020, 2021"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Transmission
                    </label>
                    <select
                      name="auto"
                      value={fields.auto}
                      onChange={(e) => setFields(prev => ({ ...prev, auto: e.target.value }))}
                      className="w-full h-8 text-sm border border-gray-300 rounded-md px-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="true">Automatic</option>
                      <option value="false">Manual</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Customer Details */}
              <div className="mt-6">
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Customer Details</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name
                    </label>
                    <Input
                      name="customer"
                      value={fields.customer}
                      onChange={handleChange}
                      className="w-full h-8 text-sm"
                      placeholder="Enter customer name"
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
                      className="w-full h-8 text-sm"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <Input
                      name="address"
                      value={fields.address}
                      onChange={handleChange}
                      className="w-full h-8 text-sm"
                      placeholder="Enter customer address"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="mt-6">
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>Additional Details</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Required By
                    </label>
                    <Input
                      name="requiredBy"
                      value={fields.requiredBy}
                      onChange={handleChange}
                      className="w-full h-8 text-sm"
                      placeholder="Enter deadline (optional)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

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
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer flex items-center space-x-2 ${isSelected
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
          <div>
            <h3 className="text-md font-semibold text-gray-800 flex items-center space-x-2 mb-4">
              <Plus className="h-4 w-4" />
              <span>Part Details</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Remove part"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                    <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">
                        Part Number *
                      </label>
                        <Input
                          value={partDetails[partName]?.number || ''}
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