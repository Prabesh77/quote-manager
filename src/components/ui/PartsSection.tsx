'use client';

import React from 'react';
import { X, Plus, ArrowLeftRight } from 'lucide-react';
import { getAvailablePartsForBrand } from '@/config/brandPartRules';

interface PartDetails {
  name: string;
  number: string;
  price: number | null;
  list_price: number | null;
  note: string;
}

interface PartsSectionProps {
  selectedParts: string[];
  onTogglePart: (partName: string) => void;
  partDetails: Record<string, PartDetails>;
  onUpdatePartDetails: (partName: string, field: keyof PartDetails, value: string | number) => void;
  onTogglePartSide: (partName: string) => void;
  vehicleMake: string;
  isVisible: boolean;
}

// Helper functions for left/right part handling
const hasLeftRightVariants = (partName: string): boolean => {
  const leftRightParts = [
    'Left Headlamp', 'Right Headlamp',
    'Left DayLight', 'Right DayLight', 
    'Left Rear Lamp', 'Right Rear Lamp',
    'Left Blindspot Sensor', 'Right Blindspot Sensor'
  ];
  return leftRightParts.includes(partName);
};

const getOppositeSidePart = (partName: string): string => {
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
  return partMappings[partName] || partName;
};

const getPartIcon = (partName: string): string => {
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
    'Left Rear Lamp': '/part-icons/taillamp.png',
    'Right Rear Lamp': '/part-icons/taillamp.png',
    'Auxiliary Radiator': '/part-icons/aux.png',
    'Camera': '/part-icons/camera.png',
    'Parking Sensor': '/part-icons/parking.png',
    'Left Blindspot Sensor': '/part-icons/blindspot.png',
    'Right Blindspot Sensor': '/part-icons/blindspot.png',
  };

  return iconMap[partName] || '/part-icons/car-parts.png';
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
  { name: 'Left Rear Lamp', icon: getPartIcon('Left Rear Lamp') },
  { name: 'Right Rear Lamp', icon: getPartIcon('Right Rear Lamp') },
  { name: 'Oil Cooler', icon: getPartIcon('Radiator') },
  { name: 'Auxiliary Radiator', icon: getPartIcon('Auxiliary Radiator') },
  { name: 'Camera', icon: getPartIcon('Camera') },
  { name: 'Parking Sensor', icon: getPartIcon('Parking Sensor') },
  { name: 'Left Blindspot Sensor', icon: getPartIcon('Left Blindspot Sensor') },
  { name: 'Right Blindspot Sensor', icon: getPartIcon('Right Blindspot Sensor') },
];

export default function PartsSection({
  selectedParts,
  onTogglePart,
  partDetails,
  onUpdatePartDetails,
  onTogglePartSide,
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
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-colors ${
                  isSelected
                    ? 'bg-red-600 border-red-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className={`w-6 h-6 p-0.5 rounded-full flex items-center justify-center shadow-sm border ${
                  isSelected 
                    ? 'bg-white border-white' 
                    : 'bg-white border-gray-200'
                }`}>
                  <img src={iconUrl} alt={part.name} className="object-contain" />
                </div>
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
                      <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200">
                        <img src={iconUrl} alt={partName} className="h-4 w-4 object-contain" />
                      </div>
                      <span className="font-medium text-gray-900">{partName}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {/* Toggle button for left/right parts */}
                      {hasLeftRightVariants(partName) && (
                        <button
                          type="button"
                          onClick={() => onTogglePartSide(partName)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                          title={`Toggle to ${getOppositeSidePart(partName)}`}
                        >
                          <ArrowLeftRight className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onTogglePart(partName)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Remove part"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 flex items-start justify-between space-x-2">
                    <div className="w-full">
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

                    {/* List Price field - always visible for selected parts */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        List Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={partDetails[partName]?.list_price || ''}
                        onChange={(e) => onUpdatePartDetails(partName, 'list_price', parseFloat(e.target.value) || 0)}
                        placeholder="Enter list price"
                        className="w-28 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
