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
import { getAvailablePartsForBrand, getPartDescriptionForBrand } from '@/config/brandPartRules';
import { parseQuoteData } from '@/utils/quoteDataParser';
import PartsSection from './PartsSection';

// Function to clean part numbers by removing special characters and replacing O with 0
const cleanPartNumber = (partNumber: string): string => {
  if (!partNumber) return '';
  return partNumber
    .replace(/O/g, '0') // Replace O with 0 to avoid confusion
    .replace(/[^a-zA-Z0-9,]/g, ''); // Remove special characters but preserve commas
};


interface PartDetails {
  name: string;
  number: string;
  price: number | null;
  list_price: number | null;
  note: string;
}

interface ExtractedPartInfo {
  partName: string;
  partNumber: string;
  confidence: number;
  rawText: string;
  context?: string;
  list_price?: number;
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
    notes: '',
  });
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [partDetails, setPartDetails] = useState<Record<string, PartDetails>>({});
  const [extractedParts, setExtractedParts] = useState<ExtractedPartInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [isFormAccordionOpen, setIsFormAccordionOpen] = useState(false);
  const [showPartsSection, setShowPartsSection] = useState(false);


  const handlePartsExtracted = (parts: ExtractedPartInfo[]) => {
    setExtractedParts(prevParts => [...prevParts, ...parts]);
    setShowPartsSection(true); // Show parts section when parts are extracted

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

      // Auto-assignment logic for left/right parts
      const leftRightParts = [
        'Left Headlamp', 'Right Headlamp',
        'Left DayLight', 'Right DayLight', 
        'Left Blindspot Sensor', 'Right Blindspot Sensor'
      ];
      
      const getOppositeSidePart = (name: string): string => {
        const partMappings: Record<string, string> = {
          'Left Headlamp': 'Right Headlamp',
          'Right Headlamp': 'Left Headlamp',
          'Left DayLight': 'Right DayLight',
          'Right DayLight': 'Left DayLight',
          'Left Blindspot Sensor': 'Right Blindspot Sensor',
          'Right Blindspot Sensor': 'Left Blindspot Sensor'
        };
        return partMappings[name] || name;
      };

      // Check if this is an unidentified left/right part (e.g., "Headlamp", "Headlight", "DayLight", "Blindspot Sensor")
      const isUnidentifiedLeftRightPart = (
        matchedPartName === 'Headlamp' || matchedPartName === 'Headlight' ||
        matchedPartName === 'DayLight' || matchedPartName === 'Daylight' ||
        matchedPartName === 'Blindspot Sensor' || matchedPartName === 'Blindspot'
      );

      // Apply auto-assignment rules for left/right parts
      if (leftRightParts.includes(matchedPartName) || isUnidentifiedLeftRightPart) {
        setSelectedParts(prev => {
          let partType: string;
          
          // Determine the part type based on the matched part name
          if (isUnidentifiedLeftRightPart) {
            // Handle unidentified parts
            if (matchedPartName === 'Headlamp' || matchedPartName === 'Headlight') {
              partType = 'Headlamp';
            } else if (matchedPartName === 'DayLight' || matchedPartName === 'Daylight') {
              partType = 'DayLight';
            } else if (matchedPartName === 'Blindspot Sensor' || matchedPartName === 'Blindspot') {
              partType = 'Blindspot Sensor';
            } else {
              partType = matchedPartName;
            }
          } else {
            // Handle identified parts (already have Left/Right)
            partType = matchedPartName.split(' ')[1]; // Get "Headlamp", "DayLight", or "Blindspot Sensor"
          }
          
          // Count existing parts of this type (both left and right)
          const leftPartName = `Left ${partType}`;
          const rightPartName = `Right ${partType}`;
          const leftExists = prev.includes(leftPartName);
          const rightExists = prev.includes(rightPartName);
          
          if (leftExists && rightExists) {
            // Both parts exist - keep current assignment if it's not already present
            if (!prev.includes(matchedPartName)) {
              return [...prev, matchedPartName];
            }
          } else if (leftExists && !rightExists) {
            // Left exists, right doesn't - assign as right
            if (!prev.includes(rightPartName)) {
              matchedPartName = rightPartName;
            }
          } else if (!leftExists && rightExists) {
            // Right exists, left doesn't - assign as left
            if (!prev.includes(leftPartName)) {
              matchedPartName = leftPartName;
            }
          } else {
            // Neither exists - assign as left by default (first part)
            matchedPartName = leftPartName;
          }
          
          if (!prev.includes(matchedPartName)) {
            return [...prev, matchedPartName];
          }
          return prev;
        });
      } else {
        // Add to selected parts if not already present (non left/right parts)
        setSelectedParts(prev => {
          if (!prev.includes(matchedPartName)) {
            return [...prev, matchedPartName];
          }
          return prev;
        });
      }

      // Populate part details with confidence information
      setPartDetails(prev => ({
        ...prev,
        [matchedPartName]: {
          name: matchedPartName,
          number: part.partNumber !== 'Not found' ? cleanPartNumber(part.partNumber) : '',
          price: null,
          list_price: part.list_price || null,
          note: ''
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

      // Pattern 0: New format - "Received: 02/09/2025 12:00 PM" etc.
      if (trimmedLine.includes(':')) {
        const colonIndex = trimmedLine.indexOf(':');
        const fieldName = trimmedLine.substring(0, colonIndex).trim().toLowerCase();
        const fieldValue = trimmedLine.substring(colonIndex + 1).trim();
        
        switch (fieldName) {
          case 'received':
            // Skip received date for now, but could be used for notes
            break;
          case 'bodyshop':
            parsed['customer'] = fieldValue;
            break;
          case 'repairer address':
            parsed['address'] = fieldValue;
            break;
          case 'repairer contact':
            // Could be used for additional contact info in notes
            if (parsed['notes']) {
              parsed['notes'] += ` | Contact: ${fieldValue}`;
            } else {
              parsed['notes'] = `Contact: ${fieldValue}`;
            }
            break;
          case 'telephone':
            parsed['phone'] = fieldValue;
            break;
          case 'email':
            // Could be used for additional contact info in notes
            if (parsed['notes']) {
              parsed['notes'] += ` | Email: ${fieldValue}`;
            } else {
              parsed['notes'] = `Email: ${fieldValue}`;
            }
            break;
          case 'estimate number':
            parsed['quoteRef'] = fieldValue;
            break;
          case 'insurer':
            // Could be used for additional info in notes
            if (parsed['notes']) {
              parsed['notes'] += ` | Insurer: ${fieldValue}`;
            } else {
              parsed['notes'] = `Insurer: ${fieldValue}`;
            }
            break;
          case 'claim number':
            // Could be used for additional info in notes
            if (parsed['notes']) {
              parsed['notes'] += ` | Claim: ${fieldValue}`;
            } else {
              parsed['notes'] = `Claim: ${fieldValue}`;
            }
            break;
          case 'required':
            // Parse required date/time - format: "02/09/2025 1:00 PM"
            try {
              // Split date and time
              const [datePart, timePart] = fieldValue.split(' ');
              if (datePart && timePart) {
                const [day, month, year] = datePart.split('/');
                const timeStr = timePart.toLowerCase();
                
                let hours = 0;
                let minutes = 0;
                
                if (timeStr.includes('pm')) {
                  const time = timeStr.replace('pm', '');
                  if (time.includes(':')) {
                    const [h, m] = time.split(':');
                    const hour = parseInt(h);
                    hours = hour === 12 ? 12 : hour + 12;
                    minutes = parseInt(m || '0');
                  } else {
                    const timeNum = parseInt(time);
                    const hour = Math.floor(timeNum / 100);
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
                    const timeNum = parseInt(time);
                    hours = Math.floor(timeNum / 100);
                    minutes = timeNum % 100;
                  }
                }
                
                const deadline = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hours, minutes);
                if (!isNaN(deadline.getTime())) {
                  parsed['requiredBy'] = deadline.toISOString();
                }
              }
            } catch (error) {
              parsed['requiredBy'] = fieldValue;
            }
            break;
          case 'vehicle':
            // Parse vehicle info - format: "TOYOTA LANDCRUISER  SAHARA LC300"
            const vehicleParts = fieldValue.split('  ').map(part => part.trim()).filter(part => part);
            if (vehicleParts.length >= 2) {
              parsed['make'] = vehicleParts[0];
              parsed['model'] = vehicleParts[1];
              if (vehicleParts.length > 2) {
                parsed['series'] = vehicleParts[2];
              }
            }
            break;
          case 'manufactured':
            // Parse manufactured date - format: "06/2023"
            try {
              const [month, year] = fieldValue.split('/');
              parsed['mthyr'] = `${year}-${month.padStart(2, '0')}`;
            } catch (error) {
              parsed['mthyr'] = fieldValue;
            }
            break;
          case 'registration':
            parsed['rego'] = fieldValue;
            break;
          case 'vin':
            parsed['vin'] = fieldValue;
            break;
          case 'colour':
            // Could be used for additional info in notes
            if (parsed['notes']) {
              parsed['notes'] += ` | Colour: ${fieldValue}`;
            } else {
              parsed['notes'] = `Colour: ${fieldValue}`;
            }
            break;
          case 'paint':
            // Could be used for additional info in notes
            if (parsed['notes']) {
              parsed['notes'] += ` | Paint: ${fieldValue}`;
            } else {
              parsed['notes'] = `Paint: ${fieldValue}`;
            }
            break;
          default:
            // Handle other fields that might appear
            if (parsed['notes']) {
              parsed['notes'] += ` | ${fieldName.replace(/\b\w/g, l => l.toUpperCase())}: ${fieldValue}`;
            } else {
              parsed['notes'] = `${fieldName.replace(/\b\w/g, l => l.toUpperCase())}: ${fieldValue}`;
            }
            break;
        }
        // Skip normal processing for new format
        key = '';
        value = '';
      }
      // Pattern 1: "Reference28495#2" (no space)
      else if (trimmedLine.match(/^(Reference|Make|Model|Series|Trans|Body|Mth\/Yr|Veh Reg)(.+)$/i)) {
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
      notes: parsed['notes'] || '',
    });

    // Show parts section when data is populated (but don't auto-open accordion)
    if (Object.values(parsed).some(value => value)) {
      setShowPartsSection(true);
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
      notes: '',
    });
    setSelectedParts([]);
    setPartDetails({});
    setExtractedParts([]); // Reset image uploader
    setShowPartsSection(false); // Hide parts section
    setIsFormAccordionOpen(false); // Close form accordion
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
            list_price: null,
            note: ''
          }
        }));
        return [...prev, partName];
      }
    });
  };

  const updatePartDetails = (partName: string, field: keyof PartDetails, value: string | number) => {
    setPartDetails(prev => ({
      ...prev,
      [partName]: {
        ...prev[partName],
        [field]: value
      }
    }));
  };

  const togglePartSide = (partName: string) => {
    // Helper function to get opposite side part name
    const getOppositeSidePart = (name: string): string => {
      const partMappings: Record<string, string> = {
        'Left Headlamp': 'Right Headlamp',
        'Right Headlamp': 'Left Headlamp',
        'Left DayLight': 'Right DayLight',
        'Right DayLight': 'Left DayLight',
        'Left Blindspot Sensor': 'Right Blindspot Sensor',
        'Right Blindspot Sensor': 'Left Blindspot Sensor'
      };
      return partMappings[name] || name;
    };

    const oppositePartName = getOppositeSidePart(partName);
    
    // Get current part details
    const currentPartDetails = partDetails[partName];
    if (!currentPartDetails) return;

    // Check if opposite part already exists
    const oppositePartExists = selectedParts.includes(oppositePartName);
    const oppositePartDetails = partDetails[oppositePartName];

    setSelectedParts(prev => {
      let newSelectedParts = [...prev];
      
      if (oppositePartExists) {
        // Both parts exist - swap them
        // Remove both parts from selection
        newSelectedParts = newSelectedParts.filter(p => p !== partName && p !== oppositePartName);
        
        // Add them back with swapped names
        newSelectedParts.push(partName);
        newSelectedParts.push(oppositePartName);
      } else {
        // Only current part exists - just rename it
        newSelectedParts = newSelectedParts.map(p => p === partName ? oppositePartName : p);
      }
      
      return newSelectedParts;
    });

    setPartDetails(prev => {
      const newDetails = { ...prev };
      
      if (oppositePartExists && oppositePartDetails) {
        // Both parts exist - swap their details
        newDetails[partName] = {
          ...oppositePartDetails,
          name: partName
        };
        newDetails[oppositePartName] = {
          ...currentPartDetails,
          name: oppositePartName
        };
      } else {
        // Only current part exists - rename it
        delete newDetails[partName];
        newDetails[oppositePartName] = {
          ...currentPartDetails,
          name: oppositePartName
        };
      }
      
      return newDetails;
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
                onChange={(e) => {
                  setRawText(e.target.value);
                  // Show parts section if there's any content
                  if (e.target.value.trim()) {
                    setShowPartsSection(true);
                  }
                }}
                onPaste={(e) => {
                  const pastedText = e.clipboardData.getData('text');
                  setRawText(pastedText);
                  
                  // Use our new parser to extract data
                  const parsedData = parseQuoteData(pastedText);
                  
                  // Update form fields with parsed data
                  setFields(prevFields => ({
                    ...prevFields,
                    ...parsedData,
                    // Keep existing values if parsed data is empty for that field
                    quoteRef: parsedData.quoteRef || prevFields.quoteRef,
                    vin: parsedData.vin || prevFields.vin,
                    make: parsedData.make || prevFields.make,
                    model: parsedData.model || prevFields.model,
                    series: parsedData.series || prevFields.series,
                    auto: parsedData.auto || prevFields.auto,
                    body: parsedData.body || prevFields.body,
                    mthyr: parsedData.mthyr || prevFields.mthyr,
                    rego: parsedData.rego || prevFields.rego,
                    requiredBy: parsedData.requiredBy || prevFields.requiredBy,
                    customer: parsedData.customer || prevFields.customer,
                    address: parsedData.address || prevFields.address,
                    phone: parsedData.phone || prevFields.phone,
                    notes: parsedData.notes || prevFields.notes,
                  }));

                  // Show parts section when data is populated
                  if (Object.values(parsedData).some(value => value)) {
                    setShowPartsSection(true);
                  }
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
              <div className="flex items-center space-x-4">
                {fields.vin && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 font-medium">VIN:</span>
                    <span className="text-xs font-mono text-gray-700">{fields.vin}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(fields.vin);
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
                    <span className="text-xs text-gray-500 font-medium">Rego:</span>
                    <span className="text-xs font-mono text-gray-700">{fields.rego}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(fields.rego);
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
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-6 bg-gray-50">
            {/* Quote Reference */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quote Reference
              </label>
              <Input
                type="text"
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
            type="text"
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
            type="text"
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
                      type="text"
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
                      type="text"
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
                      type="text"
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
                      type="text"
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
                      type="text"
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
                      type="text"
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
                      type="text"
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
                      type="text"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Required By
                    </label>
                    <Input
                      type="text"
                      name="requiredBy"
                      value={fields.requiredBy}
                      onChange={handleChange}
                      className="w-full h-8 text-sm"
                      placeholder="Enter required date"
                    />
          </div>
                </div>
              </div>
            </AccordionContent>
        </AccordionItem>
        </Accordion>

      {/* Parts Section */}
      <div className="mt-6">
        <PartsSection
          selectedParts={selectedParts}
          onTogglePart={togglePart}
          partDetails={partDetails}
          onUpdatePartDetails={updatePartDetails}
          onTogglePartSide={togglePartSide}
          vehicleMake={fields.make}
          isVisible={showPartsSection}
        />
      </div>

      {/* Create Quote Button */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <Button
          onClick={handleSubmit}
          type="submit"
          size="sm"
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Quote...' : 'Create Quote'}
        </Button>
      </div>

      {/* Validation Popup */}
      {showValidationPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">Validation Error</h3>
                </div>
            <p className="text-gray-700 mb-6">{validationMessage}</p>
            <div className="flex justify-end">
              <Button
                onClick={() => setShowValidationPopup(false)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
