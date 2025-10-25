'use client';

import React, { useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ImagePasteArea, ImagePasteAreaRef } from '@/components/ui/ImagePasteArea';
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
import CopyButton from './CopyButton';

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
    settlement: '0',
    notes: '',
    pcParts: '',
  });
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [partDetails, setPartDetails] = useState<Record<string, PartDetails>>({});
  const [extractedParts, setExtractedParts] = useState<ExtractedPartInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showValidationPopup, setShowValidationPopup] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [isFormAccordionOpen, setIsFormAccordionOpen] = useState(false);
  const [showPartsSection, setShowPartsSection] = useState(false);
  const [showDoubleQuoteAlert, setShowDoubleQuoteAlert] = useState(false);

  // Ref for ImagePasteArea to reset images when form is cleared
  const imagePasteAreaRef = useRef<ImagePasteAreaRef>(null);

  // Check if form has been changed from initial state
  const hasFormContent = () => {
    // Check if raw text has been added
    const hasTextContent = rawText.trim() !== '';
    
    // Check if any field has been changed from its initial value
    const hasChangedFields = fields.quoteRef !== '' ||
      fields.vin !== '' ||
      fields.make !== '' ||
      fields.model !== '' ||
      fields.series !== '' ||
      fields.auto !== 'true' ||
      fields.body !== '' ||
      fields.mthyr !== '' ||
      fields.rego !== '' ||
      fields.requiredBy !== '' ||
      fields.customer !== '' ||
      fields.address !== '' ||
      fields.phone !== '' ||
      fields.settlement !== '0' ||
      fields.notes !== '';
    
    // Check if images have been uploaded or parts extracted
    const hasImageContent = extractedParts.length > 0;
    
    return hasTextContent || hasChangedFields || hasImageContent;
  };

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

      // Determine the final part name to use
      let finalPartName = matchedPartName;

      // Apply auto-assignment rules for left/right parts
      if (leftRightParts.includes(matchedPartName) || isUnidentifiedLeftRightPart) {
        // Determine the base part type (without Left/Right)
        let partType: string;
        if (matchedPartName.includes('Headlamp') || matchedPartName === 'Headlight') {
          partType = 'Headlamp';
        } else if (matchedPartName.includes('DayLight') || matchedPartName === 'Daylight') {
          partType = 'DayLight';
        } else if (matchedPartName.includes('Blindspot')) {
          partType = 'Blindspot Sensor';
        } else {
          partType = matchedPartName;
        }
        
        const leftPartName = `Left ${partType}`;
        const rightPartName = `Right ${partType}`;
        
        // Check if context is weak/unclear (no explicit LH/RH markers)
        const hasWeakContext = !part.context || 
                               (part.context !== 'LH' && part.context !== 'RH' && 
                                part.context !== 'Left' && part.context !== 'Right' &&
                                part.context !== 'L' && part.context !== 'R');
        
        // Get current selected parts to check existing parts
        const currentSelectedParts = selectedParts;
        const leftExists = currentSelectedParts.includes(leftPartName);
        const rightExists = currentSelectedParts.includes(rightPartName);
        
        // Smart side detection based on existing parts
        if (isUnidentifiedLeftRightPart || (leftRightParts.includes(matchedPartName) && hasWeakContext)) {
          // Apply intelligent side detection
          if (leftExists && !rightExists) {
            // Left exists, right doesn't - assign as right
            finalPartName = rightPartName;
          } else if (!leftExists && rightExists) {
            // Right exists, left doesn't - assign as left
            finalPartName = leftPartName;
          } else if (!leftExists && !rightExists) {
            // Neither exists - respect AI detection if available, otherwise default to left
            if (leftRightParts.includes(matchedPartName)) {
              finalPartName = matchedPartName; // Use AI-detected side
            } else {
              finalPartName = leftPartName; // Default to left
            }
          } else {
            // Both exist - respect AI detection or default to the detected side
            finalPartName = leftRightParts.includes(matchedPartName) ? matchedPartName : leftPartName;
          }
        } else {
          // Strong context detected - respect AI's decision
          finalPartName = matchedPartName;
        }
        
        // Add to selected parts
        setSelectedParts(prev => {
          if (!prev.includes(finalPartName)) {
            return [...prev, finalPartName];
          }
          return prev;
        });
      } else {
        // Add to selected parts if not already present (non left/right parts)
        setSelectedParts(prev => {
          if (!prev.includes(finalPartName)) {
            return [...prev, finalPartName];
          }
          return prev;
        });
      }

      // Populate part details with confidence information
      const partNumber = part.partNumber !== 'Not found' ? cleanPartNumber(part.partNumber) : '';
      const extractedListPrice = part.list_price || null;
      
      setPartDetails(prev => ({
        ...prev,
        [finalPartName]: {
          name: finalPartName,
          number: partNumber,
          price: null,
          list_price: extractedListPrice,
          note: ''
        }
      }));
      
      // Only fetch list price if not already extracted from image
      if (!extractedListPrice && partNumber && partNumber.trim()) {
        (async () => {
          const { PartsListPriceService } = await import('@/services/partsListPriceService');
          const listPrice = await PartsListPriceService.fetchSellPrice(partNumber);
          if (listPrice !== null) {
            setPartDetails(prev => ({
              ...prev,
              [finalPartName]: {
                ...prev[finalPartName],
                list_price: listPrice
              }
            }));
          }
        })();
      }
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
      settlement: '0',
      notes: '',
      pcParts: '',
    });
    setSelectedParts([]);
    setPartDetails({});
    setExtractedParts([]); // Reset image uploader
    imagePasteAreaRef.current?.clearImages(); // Clear images from ImagePasteArea
    setShowPartsSection(false); // Hide parts section
    setIsFormAccordionOpen(false); // Close form accordion
    
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const updatePartDetails = (partName: string, field: keyof PartDetails, value: string | number | null) => {
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
        'Left Rear Lamp': 'Right Rear Lamp',
        'Right Rear Lamp': 'Left Rear Lamp',
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
    const { quoteRef, vin, make, model, series, auto, body, mthyr, rego, requiredBy, customer, address, phone, settlement, pcParts } = fields;
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
      // Convert part details to array and clean part numbers
      const partsArray = selectedParts.map(partName => {
        const part = partDetails[partName];
        return {
          ...part,
          number: cleanPartNumber(part.number) // Clean part number before submission
        };
      });

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
        settlement,
        pcParts,
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
                        
                  // Check if special characters were detected in quoteRef
                  if (parsedData.hasSpecialCharsInQuoteRef) {
                    // Show alert for potential double quote
                    setShowDoubleQuoteAlert(true);
                  }
                  
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
                    settlement: parsedData.settlement?.toString() || prevFields.settlement,
                    notes: parsedData.notes || prevFields.notes,
                    pcParts: parsedData.pcParts || prevFields.pcParts,
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
              ref={imagePasteAreaRef}
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
                    <span className="font-medium text-blue-600">{fields.customer}({fields.settlement ? fields.settlement : '0'}%)</span>
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Settlement (%)
                      </label>
                      <Input
                        type="number"
                        name="settlement"
                        value={fields.settlement}
                        onChange={handleChange}
                        className="w-full h-8 text-sm"
                        placeholder="0"
                        min="0"
                        max="100"
                        step="0.1"
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
          quoteRef={fields.quoteRef}
        />
      </div>

      {/* Create Quote Button */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
        <Button
          onClick={handleSubmit}
          type="submit"
          size="sm"
          disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white font-medium py-5 px-8 rounded-sm transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Quote...' : 'Create Quote'}
        </Button>
          
          {/* Clear Form Button - Only show when form has content */}
          {hasFormContent() && (
            <Button
              onClick={clearForm}
              type="button"
              size="sm"
              disabled={isLoading}
              className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium py-5 px-6 rounded-sm transition-colors duration-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
            >
              Clear Form
            </Button>
          )}
              </div>
            </div>

      {/* Validation Popup */}
      {showValidationPopup && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-200">
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

      {/* Double Quote Alert */}
      {showDoubleQuoteAlert && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl border-2 border-amber-400 animate-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <AlertCircle className="h-10 w-10 text-amber-600 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Double Quote Warning</h3>
              <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                Please make sure you <span className="font-semibold text-amber-600">check for double quote</span>
              </p>
              
              {/* Quote Reference Display with Copy */}
              {fields.quoteRef && (() => {
                // Extract the part before the first special character
                const beforeSpecialChars = fields.quoteRef.split(/[#\/.]/, 1)[0];
                
                return (
                  <div className="mb-6 w-full">
                    <label className="block text-xs font-medium text-gray-600 mb-2">Quote Ref</label>
                    <div className="flex items-center space-x-2 bg-gray-50 border border-gray-300 rounded-lg">
                      <span className="flex-1 text-lg font-mono font-semibold text-gray-900">{beforeSpecialChars}</span>
                      <CopyButton
                        text={beforeSpecialChars}
                        title="Copy quote reference"
                        size="lg"
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-all duration-200 cursor-pointer"
                        iconClassName="h-5 w-5"
                      />
                    </div>
                  </div>
                );
              })()}
              
              <div className="flex items-center space-x-3 w-full">
                <Button
                  onClick={() => setShowDoubleQuoteAlert(false)}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  OK, I'll Check
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 
