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
  Settings 
} from 'lucide-react';

const PART_OPTIONS = [
  { name: 'Radiator', icon: Droplets },
  { name: 'Left Headlamp', icon: Lightbulb },
  { name: 'RightHeadlamp', icon: Lightbulb },
  { name: 'Condenser', icon: Zap },
  { name: 'Radar Sensor', icon: Settings },
  { name: 'Fan Assembly', icon: Droplets },
  { name: 'Intercooler', icon: Shield },
];

interface QuoteFormProps {
  onSubmit: (fields: Record<string, string>, parts: string[]) => void;
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { quoteRef, vin, make, model, series, auto, body, mthyr, rego } = fields;
    if (!quoteRef) return;
    
    setIsLoading(true);
    try {
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
      }, selectedParts);
      clearForm();
    } catch (error) {
      console.error('Error submitting quote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePart = (partName: string) => {
    setSelectedParts(prev => 
      prev.includes(partName) 
        ? prev.filter(p => p !== partName)
        : [...prev, partName]
    );
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

      <div className="md:col-span-2 lg:col-span-3 mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Parts Required
        </label>
        <div className="flex flex-wrap gap-2">
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
      </div>

      {/* Create Quote Button - Moved below form */}
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