'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Wrench, 
  Lightbulb, 
  Droplets, 
  Zap, 
  Gauge, 
  Shield, 
  Settings,
  X,
  Plus
} from 'lucide-react';

const PART_OPTIONS = [
  { name: 'Radiator', icon: Droplets },
  { name: 'Left Headlamp', icon: Lightbulb },
  { name: 'Right Headlamp', icon: Lightbulb },
  { name: 'Condenser', icon: Zap },
  { name: 'Radar Sensor', icon: Settings },
  { name: 'Fan Assembly', icon: Droplets },
  { name: 'Intercooler', icon: Shield },
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
    auto: 'false',
    body: '',
    mthyr: '',
    rego: '',
  });

  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [partDetails, setPartDetails] = useState<Record<string, PartDetails>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handlePaste = () => {
    const lines = rawText.split('\n');
    const parsed: Record<string, string> = {};
    for (let line of lines) {
      const [key, ...rest] = line.split(':');
      if (!key || !rest.length) continue;
      parsed[key.trim().toLowerCase()] = rest.join(':').trim();
    }
    setFields({
      quoteRef: parsed['quote ref'] || '',
      vin: parsed['vin'] || '',
      make: parsed['make'] || '',
      model: parsed['model'] || '',
      series: parsed['series'] || '',
      auto: parsed['auto'] || 'false',
      body: parsed['body'] || '',
      mthyr: parsed['mth/yr'] || '',
      rego: parsed['rego'] || '',
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
      auto: 'false',
      body: '',
      mthyr: '',
      rego: '',
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
    const { quoteRef, vin, make, model, series, auto, body, mthyr, rego } = fields;
    if (!quoteRef) return;
    if (selectedParts.length === 0) {
      alert('Please select at least one part');
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
      }, partsArray);
      clearForm();
    } catch (error) {
      console.error('Error submitting quote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Create New Quote</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Paste Quote Details
        </label>
        <textarea
          rows={4}
          className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
          placeholder="Paste the full quote text here..."
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />
        <div className="flex gap-2 mt-2">
          <Button onClick={handlePaste} type="button" size="sm" className="cursor-pointer bg-red-600 hover:bg-red-700">
            Auto-Fill
          </Button>
        </div>
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
            Registration
          </label>
          <Input
            name="rego"
            value={fields.rego}
            onChange={handleChange}
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
            const IconComponent = part.icon;
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
                <IconComponent className="h-4 w-4" />
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
              const IconComponent = PART_OPTIONS.find(p => p.name === partName)?.icon || Wrench;
              
              return (
                <div key={partName} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <IconComponent className="h-4 w-4 text-red-600" />
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Part Number
                      </label>
                      <Input
                        value={part.number}
                        onChange={(e) => updatePartDetail(partName, 'number', e.target.value)}
                        placeholder="Enter part number"
                        className="w-full h-8 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Price
                      </label>
                      <Input
                        type="number"
                        value={part.price || ''}
                        onChange={(e) => updatePartDetail(partName, 'price', e.target.value ? Number(e.target.value) : null)}
                        placeholder="0.00"
                        className="w-full h-8 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Notes
                      </label>
                      <Input
                        value={part.note}
                        onChange={(e) => updatePartDetail(partName, 'note', e.target.value)}
                        placeholder="Additional notes"
                        className="w-full h-8 text-sm"
                      />
                    </div>
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
    </div>
  );
}; 