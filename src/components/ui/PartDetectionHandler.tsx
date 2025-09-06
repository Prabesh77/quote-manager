'use client';

import React, { useState } from 'react';
import { extractPartsWithAI } from '@/utils/geminiApi';
import SensorSelectionModal from './SensorSelectionModal';

interface PartDetectionHandlerProps {
  ocrText: string;
  onPartsDetected: (parts: Array<{ name: string; number: string; context?: string }>) => void;
  onError: (error: string) => void;
}

interface DetectedPart {
  partName: string;
  partNumber: string;
  context?: string;
}

const PartDetectionHandler: React.FC<PartDetectionHandlerProps> = ({
  ocrText,
  onPartsDetected,
  onError
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSensorModal, setShowSensorModal] = useState(false);
  const [pendingPart, setPendingPart] = useState<DetectedPart | null>(null);
  const [detectedParts, setDetectedParts] = useState<DetectedPart[]>([]);

  const processDetectedParts = async (aiParts: any[]) => {
    const processedParts: DetectedPart[] = [];
    const ambiguousSensors: DetectedPart[] = [];

    for (const part of aiParts) {
      const partName = part.partName;
      const partNumber = part.partNumber;
      const context = part.context;

      // Check if this is an ambiguous sensor that needs human selection
      if (partName === 'Parking Sensor' || partName === 'Left Blindspot Sensor' || partName === 'Right Blindspot Sensor') {
        // Check if we can determine the type from context
        if (partName === 'Left Blindspot Sensor' || partName === 'Right Blindspot Sensor') {
          // Already determined, add directly
          processedParts.push({ partName, partNumber, context });
        } else if (partName === 'Parking Sensor') {
          // Check context for corner indication
          const hasCorner = context?.toLowerCase().includes('corner') || 
                           partNumber.toLowerCase().includes('corner') ||
                           ocrText.toLowerCase().includes('corner');
          
          if (hasCorner) {
            // Determine left or right from context
            const isLeft = context?.toLowerCase().includes('left') || 
                          context?.toLowerCase().includes('lh') || 
                          context?.toLowerCase().includes('l ');
            const isRight = context?.toLowerCase().includes('right') || 
                           context?.toLowerCase().includes('rh') || 
                           context?.toLowerCase().includes('r ');

            if (isLeft) {
              processedParts.push({ 
                partName: 'Left Blindspot Sensor', 
                partNumber, 
                context 
              });
            } else if (isRight) {
              processedParts.push({ 
                partName: 'Right Blindspot Sensor', 
                partNumber, 
                context 
              });
            } else {
              // Ambiguous - needs human selection
              ambiguousSensors.push({ partName, partNumber, context });
            }
          } else {
            // Regular parking sensor
            processedParts.push({ partName, partNumber, context });
          }
        }
      } else {
        // Not a sensor, add directly
        processedParts.push({ partName, partNumber, context });
      }
    }

    // Add processed parts immediately
    if (processedParts.length > 0) {
      setDetectedParts(prev => [...prev, ...processedParts]);
    }

    // Handle ambiguous sensors
    if (ambiguousSensors.length > 0) {
      setPendingPart(ambiguousSensors[0]); // Handle first ambiguous sensor
      setShowSensorModal(true);
    } else {
      // No ambiguous sensors, finish processing
      finalizeParts(processedParts);
    }
  };

  const handleSensorSelection = (selectedPartName: string) => {
    if (pendingPart) {
      const updatedPart = {
        ...pendingPart,
        partName: selectedPartName
      };
      
      setDetectedParts(prev => [...prev, updatedPart]);
      
      // Check if there are more ambiguous sensors to handle
      // For now, we'll just finalize with what we have
      finalizeParts([updatedPart]);
    }
  };

  const finalizeParts = (parts: DetectedPart[]) => {
    const formattedParts = parts.map(part => ({
      name: part.partName,
      number: part.partNumber,
      context: part.context
    }));
    onPartsDetected(formattedParts);
    setDetectedParts([]);
    setPendingPart(null);
  };

  const detectParts = async () => {
    if (!ocrText.trim()) {
      onError('Please provide OCR text to detect parts');
      return;
    }

    setIsProcessing(true);
    setDetectedParts([]);

    try {
      const aiParts = await extractPartsWithAI(ocrText);
      await processDetectedParts(aiParts);
    } catch (error) {
      console.error('Error detecting parts:', error);
      onError('Failed to detect parts. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <button
          onClick={detectParts}
          disabled={isProcessing || !ocrText.trim()}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isProcessing || !ocrText.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isProcessing ? 'Detecting Parts...' : 'Detect Parts from OCR'}
        </button>

        {isProcessing && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span>Analyzing text and detecting parts...</span>
          </div>
        )}
      </div>

      <SensorSelectionModal
        isOpen={showSensorModal}
        onClose={() => setShowSensorModal(false)}
        onSelect={handleSensorSelection}
        detectedPart={pendingPart || { partName: '', partNumber: '', context: '' }}
      />
    </>
  );
};

export default PartDetectionHandler;
