'use client';

import React from 'react';

interface VehicleDetailsProps {
  quote: {
    make?: string;
    model?: string;
    mthyr?: string;
    series?: string;
    body?: string;
    auto?: boolean;
  };
  editingQuote?: string | null;
  editData?: Record<string, any>;
  onQuoteEditChange?: (field: string, value: any) => void;
  isCompact?: boolean;
}

export const getVehicleLogo = (make: string) => {
  const logos: Record<string, string> = {
    'toyota': '/car-logos/toyota.png',
    'honda': '/car-logos/honda.png',
    'ford': '/car-logos/ford.png',
    'bmw': '/car-logos/bmw.png',
    'mercedes': '/car-logos/mercedes.png',
    'audi': '/car-logos/audi.png',
    'volkswagen': '/car-logos/volkswagen.png',
    'nissan': '/car-logos/nissan.png',
    'hyundai': '/car-logos/hyundai.png',
    'kia': '/car-logos/kia.png',
    'chevrolet': '/car-logos/chevrolet.png',
    'mazda': '/car-logos/mazda.png',
    'lexus': '/car-logos/lexus.png',
    'volvo': '/car-logos/volvo.png',
    'subaru': '/car-logos/subaru.png',
    'land rover': '/car-logos/landrover.png',
    'jaguar': '/car-logos/jaguar.png',
    'mini': '/car-logos/mini.png',
    'peugeot': '/car-logos/peugeot.png',
    'renault': '/car-logos/renault.png',
    'skoda': '/car-logos/skoda.png',
    'alfa romeo': '/car-logos/alfaromeo.png',
    'infiniti': '/car-logos/infiniti.png',
    'jeep': '/car-logos/jeep.png',
    'mg': '/car-logos/mg.png',
    'mitsubishi': '/car-logos/mitsubisi.png',
  };
  return logos[make?.toLowerCase() || ''] || '/car-logos/toyota.png'; // Default to Toyota if make not found
};

export const VehicleDetails: React.FC<VehicleDetailsProps> = ({ 
  quote, 
  editingQuote, 
  editData, 
  onQuoteEditChange,
  isCompact = false 
}) => {
  const isEditing = editingQuote !== null && editingQuote !== undefined;

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-lg">
          <img 
            src={getVehicleLogo(editData?.make || quote.make)} 
            alt={editData?.make || quote.make} 
            className="h-8 w-8 object-contain" 
          />
        </span>
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <div className="flex flex-col space-y-1 flex-1">
              <label className="text-xs text-gray-500 font-medium">Make</label>
              <input
                type="text"
                value={editData?.make || quote.make || ''}
                onChange={(e) => onQuoteEditChange?.('make', e.target.value)}
                className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
                placeholder="Make"
              />
            </div>
            <div className="flex flex-col space-y-1 flex-1">
              <label className="text-xs text-gray-500 font-medium">Model</label>
              <input
                type="text"
                value={editData?.model || quote.model || ''}
                onChange={(e) => onQuoteEditChange?.('model', e.target.value)}
                className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
                placeholder="Model"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex flex-col space-y-1 flex-1">
              <label className="text-xs text-gray-500 font-medium">Year</label>
              <input
                type="text"
                value={editData?.mthyr || quote.mthyr || ''}
                onChange={(e) => onQuoteEditChange?.('mthyr', e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
                placeholder="e.g. 9/2017"
              />
            </div>
            <div className="flex flex-col space-y-1 flex-1">
              <label className="text-xs text-gray-500 font-medium">Series</label>
              <input
                type="text"
                value={editData?.series || quote.series || ''}
                onChange={(e) => onQuoteEditChange?.('series', e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
                placeholder="Series"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex flex-col space-y-1 flex-1">
              <label className="text-xs text-gray-500 font-medium">Body</label>
              <input
                type="text"
                value={editData?.body || quote.body || ''}
                onChange={(e) => onQuoteEditChange?.('body', e.target.value)}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
                placeholder="e.g. 5 Door Hatchback"
              />
            </div>
            <div className="flex flex-col space-y-1 flex-1">
              <label className="text-xs text-gray-500 font-medium">Transmission</label>
              <select
                value={editData?.auto !== undefined ? editData.auto.toString() : quote.auto?.toString()}
                onChange={(e) => onQuoteEditChange?.('auto', e.target.value === 'true')}
                className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="true">Auto</option>
                <option value="false">Manual</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isCompact) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-lg">
          <img 
            src={getVehicleLogo(quote.make || '')} 
            alt={quote.make} 
            className="h-8 w-8 object-contain" 
          />
        </span>
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900">{quote.make} - {quote.model}</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <span>{quote.mthyr || '-'}</span>
            {quote.series && (
              <>
                <span>•</span>
                <span>{quote.series}</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <span>{quote.body || '-'}</span>
            {quote.auto !== undefined && (
              <>
                <span>•</span>
                <span>{quote.auto ? 'Auto' : 'Manual'}</span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-lg">
        <img 
          src={getVehicleLogo(quote.make || '')} 
          alt={quote.make} 
          className="h-8 w-8 object-contain" 
        />
      </span>
      <div className="flex flex-col space-y-1">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-900">{quote.make} • {quote.model}</span>
        </div>
        <div className="flex items-center space-x-1 text-xs text-gray-600">
          <span>{quote.mthyr || '-'}</span>
          {quote.series && (
            <>
              <span>•</span>
              <span>{quote.series}</span>
            </>
          )}
        </div>
        <div className="flex items-center space-x-1 text-xs text-gray-600">
          <span>{quote.body || '-'}</span>
          {quote.auto !== undefined && (
            <>
              <span>•</span>
              <span>{quote.auto ? 'Auto' : 'Manual'}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
