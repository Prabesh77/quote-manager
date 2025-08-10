'use client';

import React, { useState, useRef } from 'react';
import { Image as ImageIcon, X, Loader2, Focus, Clipboard } from 'lucide-react';
import { processImageForParts } from '@/utils/googleVisionApi';

interface ExtractedPartInfo {
  partName: string;
  partNumber: string;
  confidence: number;
  rawText: string;
}

interface ProcessedImage {
  id: string;
  file: File;
  preview: string;
  status: 'processing' | 'completed' | 'error';
  extractedParts: ExtractedPartInfo[];
  error?: string;
}

interface ImagePasteAreaProps {
  onPartsExtracted: (parts: ExtractedPartInfo[]) => void;
  onPartRemoved?: (removedPart: ExtractedPartInfo) => void;
}

export const ImagePasteArea = ({ onPartsExtracted, onPartRemoved }: ImagePasteAreaProps) => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const pasteAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processImage = async (file: File) => {
    const imageId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const preview = URL.createObjectURL(file);
    
    const newImage: ProcessedImage = {
      id: imageId,
      file,
      preview,
      status: 'processing',
      extractedParts: [],
    };

    setImages(prev => [...prev, newImage]);

    try {
      const base64 = await convertFileToBase64(file);
      const extractedParts = await processImageForParts(base64);
      
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, status: 'completed', extractedParts }
          : img
      ));

      // Notify parent component with all extracted parts
      onPartsExtracted(extractedParts);
      
    } catch (error) {
      console.error('Error processing image:', error);
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { 
              ...img, 
              status: 'error', 
              error: error instanceof Error ? error.message : 'Processing failed'
            }
          : img
      ));
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          processImage(file);
        }
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(processImage);
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        processImage(file);
      }
    });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setIsReady(true);
  };

  const handleBlur = () => {
    // Keep focused state for a short time to allow pasting
    setTimeout(() => {
      setIsFocused(false);
      setIsReady(false);
    }, 100);
  };

  const handleAreaClick = (e: React.MouseEvent) => {
    // Only focus the area, don't trigger file input
    e.preventDefault();
    if (pasteAreaRef.current) {
      pasteAreaRef.current.focus();
      setIsFocused(true);
      setIsReady(true);
    }
  };

  const handleFileButtonClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent area click handler
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const allExtractedParts = images.reduce((acc, img) => [...acc, ...img.extractedParts], [] as ExtractedPartInfo[]);

  const removeExtractedPart = (index: number) => {
    // Find which image contains this part and remove it
    let partIndex = 0;
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      if (partIndex + image.extractedParts.length > index) {
        // This image contains the part we want to remove
        const localIndex = index - partIndex;
        const newImages = [...images];
        const removedPart = newImages[i].extractedParts[localIndex];
        newImages[i] = {
          ...newImages[i],
          extractedParts: newImages[i].extractedParts.filter((_, j) => j !== localIndex)
        };
        setImages(newImages);
        
        // Update the parent component
        const allParts = newImages.reduce((acc, img) => [...acc, ...img.extractedParts], [] as ExtractedPartInfo[]);
        onPartsExtracted(allParts);
        onPartRemoved?.(removedPart);
        break;
      }
      partIndex += image.extractedParts.length;
    }
  };

  return (
    <div className="space-y-4">
      {/* Paste Area */}
      <div
        ref={pasteAreaRef}
        className={`
          h-32
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 outline-none
          ${isDragOver 
            ? 'border-red-500 bg-red-50 shadow-lg' 
            : isFocused || isReady
            ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200'
            : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'
          }
        `}
        onPaste={handlePaste}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onClick={handleAreaClick}
        tabIndex={0}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
        />
        
        {/* Focus Indicator */}
        {(isFocused || isReady) && (
          <div className="absolute top-2 left-2">
            <div className="flex items-center space-x-1 px-2 py-1 bg-blue-500 text-white rounded text-xs font-medium">
              <Focus className="h-3 w-3" />
              <span>Ready to Paste!</span>
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <div className="flex justify-center">
            {isFocused || isReady ? (
              <Clipboard className="h-8 w-8 text-blue-500 animate-pulse" />
            ) : (
              <ImageIcon className="h-8 w-8 text-gray-400" />
            )}
          </div>
          
          <div className="text-sm text-gray-600">
            {isFocused || isReady ? (
              <>
                <span className="font-medium text-blue-600">Ready for pasting!</span>
              </>
            ) : (
              <>
                <span className="font-medium">Click to focus, then paste screenshots</span>
              </>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            {isFocused || isReady ? (
              <span>🖼️ Paste multiple images one by one</span>
            ) : (
              <span>Supports: JPG, PNG, GIF (max 7 images)</span>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard Shortcut Hint */}
      {!isFocused && !isReady && images.length === 0 && (
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg text-xs text-gray-600">
            <span>💡 Tip:</span>
            <span>Click the area above to focus, then use <kbd className="px-1 py-0.5 bg-white rounded border">Ctrl+V</kbd> to paste</span>
          </div>
        </div>
      )}

{images.some(img => img.status === 'processing') && (
            <div className="flex items-center space-x-1 text-blue-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Processing...</span>
            </div>
          )}

      {/* Image Previews and Extracted Parts - Simplified Single Box Layout */}
      {allExtractedParts.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-green-800">
              Extracted Parts ({allExtractedParts.length})
            </h4>
            <div className="text-xs text-gray-500">
              Click ✕ to remove
            </div>
          </div>
          
          {/* 2-column grid for better space efficiency */}
          <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
            {allExtractedParts.map((part, index) => (
              <div key={index} className="relative bg-green-50 border border-green-200 rounded-lg p-3 hover:border-green-300 transition-colors">
                {/* Close button */}
                <button
                  onClick={() => removeExtractedPart(index)}
                  className="absolute top-2 right-2 w-5 h-5 text-green-400 hover:text-red-500 hover:bg-red-50 rounded-full flex items-center justify-center transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
                
                {/* Part details */}
                <div className="pr-6"> {/* Add right padding to avoid overlap with close button */}
                  <div className="font-medium text-green-800 text-sm mb-1 truncate">
                    {part.partName}
                  </div>
                  {part.partNumber !== 'Not found' && (
                    <div className="text-green-600 text-xs bg-white px-2 py-1 rounded border border-green-200 truncate">
                      #{part.partNumber}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 