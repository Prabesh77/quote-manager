'use client';

import { useState, useEffect } from 'react';
import { X, Save, Car } from 'lucide-react';
import { Quote } from '@/components/ui/useQuotes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface QuoteEditModalProps {
  quote: Quote | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (quoteId: string, updates: Record<string, any>) => Promise<void>;
}

export const QuoteEditModal: React.FC<QuoteEditModalProps> = ({
  quote,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    series: '',
    year: '',
    vin: '',
    rego: '',
    color: '',
    transmission: '',
    body: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when quote changes
  useEffect(() => {
    if (quote && isOpen) {
      setFormData({
        make: quote.make || '',
        model: quote.model || '',
        series: quote.series || '',
        year: quote.mthyr || '', // Year is stored in mthyr field
        vin: quote.vin || '',
        rego: quote.rego || '',
        color: quote.color || '',
        transmission: quote.auto ? 'auto' : quote.auto === false ? 'manual' : '', // Convert boolean to string
        body: quote.body || ''
      });
      setErrors({});
    }
  }, [quote, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.make.trim()) newErrors.make = 'Make is required';
    if (!formData.model.trim()) newErrors.model = 'Model is required';
    
    // Remove the 4-digit year validation since it can be formats like "08/2022", "7/2018", or "2023"
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!quote || !validateForm()) return;
    
    setIsLoading(true);
    try {
      await onSave(quote.id, {
        make: formData.make.trim(),
        model: formData.model.trim(),
        series: formData.series.trim(),
        mthyr: formData.year.trim() || '', // Map year back to mthyr field
        vin: formData.vin.trim(),
        rego: formData.rego.trim(),
        color: formData.color.trim(),
        auto: formData.transmission === 'auto', // Convert string back to boolean
        body: formData.body.trim()
      });
      onClose();
    } catch (error) {
      console.error('Error updating quote:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen || !quote) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 transform transition-all border border-gray-200">
        {/* Header */}
        <div className="flex items-center space-x-3 p-6 border-b border-gray-200">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Car className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Edit Vehicle Details</h3>
            <p className="text-sm text-gray-600 mt-1">Quote #{quote.quoteRef}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Make */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Make *
              </label>
              <Input
                value={formData.make}
                onChange={(e) => handleInputChange('make', e.target.value)}
                placeholder="e.g. Toyota"
                aria-invalid={errors.make ? 'true' : 'false'}
                className={errors.make ? 'border-destructive' : ''}
              />
              {errors.make && (
                <p className="text-sm text-red-600">{errors.make}</p>
              )}
            </div>

            {/* Model */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Model *
              </label>
              <Input
                value={formData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                placeholder="e.g. Camry"
                aria-invalid={errors.model ? 'true' : 'false'}
                className={errors.model ? 'border-destructive' : ''}
              />
              {errors.model && (
                <p className="text-sm text-red-600">{errors.model}</p>
              )}
            </div>

            {/* Series */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Series
              </label>
              <Input
                value={formData.series}
                onChange={(e) => handleInputChange('series', e.target.value)}
                placeholder="e.g. ASV50R"
              />
            </div>

            {/* Year */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Year
              </label>
              <Input
                type="text"
                value={formData.year}
                onChange={(e) => handleInputChange('year', e.target.value)}
                placeholder="e.g. 2023, 08/2022, 7/2018"
                aria-invalid={errors.year ? 'true' : 'false'}
                className={errors.year ? 'border-destructive' : ''}
              />
              {errors.year && (
                <p className="text-sm text-red-600">{errors.year}</p>
              )}
            </div>

            {/* Registration */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Registration
              </label>
              <Input
                value={formData.rego}
                onChange={(e) => handleInputChange('rego', e.target.value)}
                placeholder="e.g. ABC123"
              />
            </div>

            {/* VIN */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                VIN
              </label>
              <Input
                value={formData.vin}
                onChange={(e) => handleInputChange('vin', e.target.value)}
                placeholder="Enter VIN number"
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Color
              </label>
              <Input
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                placeholder="e.g. White"
              />
            </div>

            {/* Transmission */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Transmission Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="transmission"
                    value="auto"
                    checked={formData.transmission === 'auto'}
                    onChange={(e) => handleInputChange('transmission', e.target.value)}
                    className="mr-2 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Automatic</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="transmission"
                    value="manual"
                    checked={formData.transmission === 'manual'}
                    onChange={(e) => handleInputChange('transmission', e.target.value)}
                    className="mr-2 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700">Manual</span>
                </label>
              </div>
            </div>

            {/* Body Type */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Body Type
              </label>
              <Input
                value={formData.body}
                onChange={(e) => handleInputChange('body', e.target.value)}
                placeholder="e.g. Sedan"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}; 