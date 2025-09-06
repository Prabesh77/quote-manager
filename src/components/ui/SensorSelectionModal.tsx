'use client';

import React from 'react';
import { X, Camera, Radio, AlertCircle } from 'lucide-react';

interface SensorSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedPart: string) => void;
  detectedPart: {
    partName: string;
    partNumber: string;
    context?: string;
  };
}

const SensorSelectionModal: React.FC<SensorSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  detectedPart
}) => {
  if (!isOpen) return null;

  const sensorOptions = [
    { 
      name: 'Parking Sensor', 
      icon: <Radio className="h-6 w-6" />,
      description: 'General parking assistance sensor'
    },
    { 
      name: 'Left Blindspot Sensor', 
      icon: <Radio className="h-6 w-6" />,
      description: 'Left side blindspot monitoring sensor'
    },
    { 
      name: 'Right Blindspot Sensor', 
      icon: <Radio className="h-6 w-6" />,
      description: 'Right side blindspot monitoring sensor'
    }
  ];

  const handleSelect = (partName: string) => {
    onSelect(partName);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-amber-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Sensor Type Selection</h3>
                <p className="text-sm text-gray-500">Please specify the type of sensor detected</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Detected Part Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Detected Part</h4>
              <div className="space-y-1">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Part Number:</span> {detectedPart.partNumber}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Context:</span> {detectedPart.context || 'No context available'}
                </p>
              </div>
            </div>

            {/* Selection Options */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 mb-3">Select Sensor Type:</h4>
              {sensorOptions.map((option) => (
                <button
                  key={option.name}
                  onClick={() => handleSelect(option.name)}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-blue-600">
                      {option.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{option.name}</div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Cancel Button */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SensorSelectionModal;
