'use client';

import React from 'react';
import { X, Plus } from 'lucide-react';
import { getAvailablePartsForBrand } from '@/config/brandPartRules';

interface PartDetails {
  name: string;
  number: string;
  price: number | null;
  note: string;
}

interface PartsSectionProps {
  selectedParts: string[];
  onTogglePart: (partName: string) => void;
  partDetails: Record<string, PartDetails>;
  onUpdatePartDetails: (partName: string, field: keyof PartDetails, value: string | number) => void;
  vehicleMake: string;
  isVisible: boolean;
}

const getPartIcon = (partName: string): string | null => {
  const iconMap: Record<string, string> = {
    'Radiator': '/part-icons/radiator.png',
    'Left Headlamp': '/part-icons/headlight-left.png',
    'Right Headlamp': '/part-icons/headlight-right.png',
    'Condenser': '/part-icons/condenser.png',
    'Radar Sensor': '/part-icons/sensor.png',
    'Fan Assembly': '/part-icons/fa.png',
    'Intercooler': '/part-icons/intercooler.png',
    'Left DayLight': '/part-icons/lh.png',
    'Right DayLight': '/part-icons/rh.png',
    'Auxiliary Radiator': '/part-icons/aux.png',
    'Camera': '/part-icons/camera.png',
    'Parking Sensor': '/part-icons/parking.png',
    'Left Blindspot Sensor': '/part-icons/blindspot.png',
    'Right Blindspot Sensor': '/part-icons/blindspot.png',
    'Daytime Headlamps': '/part-icons/lh.png',
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
  { name: 'Left DayLight', icon: getPartIcon('Left DayLight') },
  { name: 'Right DayLight', icon: getPartIcon('Right DayLight') },
  { name: 'Oil Cooler', icon: getPartIcon('Radiator') },
  { name: 'Auxiliary Radiator', icon: getPartIcon('Auxiliary Radiator') },
  { name: 'Camera', icon: getPartIcon('Camera') },
  { name: 'Parking Sensor', icon: getPartIcon('Parking Sensor') },
  { name: 'Left Blindspot Sensor', icon: getPartIcon('Left Blindspot Sensor') },
  { name: 'Right Blindspot Sensor', icon: getPartIcon('Right Blindspot Sensor') },
  { name: 'Daytime Headlamps', icon: getPartIcon('Daytime Headlamps') },
];

export default function PartsSection({
  selectedParts,
  onTogglePart,
  partDetails,
  onUpdatePartDetails,
  vehicleMake,
  isVisible
}: PartsSectionProps) {
  if (!isVisible) {
    return null;
  }

  // Filter parts based on selected brand
  const allPartNames = PART_OPTIONS.map(part => part.name);
  const availablePartNames = vehicleMake 
    ? getAvailablePartsForBrand(vehicleMake, allPartNames)
    : allPartNames;
  
  const filteredParts = PART_OPTIONS.filter(part =>
    availablePartNames.includes(part.name)
  );

  // Get unavailable parts for info message
  const unavailableParts = vehicleMake 
    ? allPartNames.filter(name => !availablePartNames.includes(name))
    : [];

  return (
    <div className="space-y-4">
      {/* Parts Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Parts Required
        </label>
        <div className="flex flex-wrap gap-2 mb-4">
          {filteredParts.map((part) => {
            const iconUrl = part.icon;
            const isSelected = selectedParts.includes(part.name);

            return (
              <button
                key={part.name}
                type="button"
                onClick={() => onTogglePart(part.name)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                  isSelected
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {iconUrl && (
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center shadow-sm border ${
                    isSelected 
                      ? 'bg-white border-white' 
                      : 'bg-white border-gray-200'
                  }`}>
                    <img src={iconUrl} alt={part.name} className="h-3 w-3 object-contain" />
                  </div>
                )}
                <span className="text-sm font-medium">{part.name}</span>
              </button>
            );
          })}
        </div>

        {/* Info message for unavailable parts */}
        {vehicleMake && unavailableParts.length > 0 && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>Note:</strong> The following parts are not typically required for {vehicleMake}:
              <div className="mt-1 text-xs text-blue-600">
                {unavailableParts.join(', ')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Parts Details */}
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
                      onClick={() => onTogglePart(partName)}
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
                      <input
                        type="text"
                        value={partDetails[partName]?.number || ''}
                        onChange={(e) => onUpdatePartDetails(partName, 'number', e.target.value)}
                        placeholder="Enter part number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
  );
}
