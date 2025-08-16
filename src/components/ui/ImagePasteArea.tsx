'use client';

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Image as ImageIcon, X, Loader2, Focus, Clipboard, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { processImageForParts } from '@/utils/googleVisionApi';


interface ExtractedPartInfo {
  partName: string;
  partNumber: string;
  confidence: number;
  rawText: string;
  context?: string;
  isSupersession?: boolean;
  manufacturer?: string;
}

interface ProcessedImage {
  id: string;
  file: File;
  preview: string;
  status: 'processing' | 'completed' | 'error';
  extractedParts: ExtractedPartInfo[];
  error?: string;
  processingTime?: number;
  confidence?: number;
}

interface ImagePasteAreaProps {
  onPartsExtracted: (parts: ExtractedPartInfo[]) => void;
  onPartRemoved?: (removedPart: ExtractedPartInfo) => void;
  onClearAll?: () => void;
}

export const ImagePasteArea = ({ onPartsExtracted, onPartRemoved, onClearAll }: ImagePasteAreaProps) => {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [processingQueue, setProcessingQueue] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const pasteAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoized processing queue for performance
  const processingQueueMemo = useMemo(() => processingQueue, [processingQueue]);

  // Optimized file to base64 conversion
  const convertFileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);



  // Optimized image processing with queue management
  const processImage = useCallback(async (file: File) => {
    const imageId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const preview = URL.createObjectURL(file);
    const startTime = performance.now();
    
    const newImage: ProcessedImage = {
      id: imageId,
      file,
      preview,
      status: 'processing',
      extractedParts: [],
    };

    setImages(prev => [...prev, newImage]);
    setProcessingQueue(prev => [...prev, imageId]);

    try {
      // Process image with Google Vision API
      const base64 = await convertFileToBase64(file);
      
      const extractedParts = await processImageForParts(base64);
      
      // Convert the Google Vision API results directly to our format
      const smartExtractedParts = extractedParts.map(part => ({
        partName: part.partName,
        partNumber: part.partNumber,
        confidence: part.confidence,
        rawText: part.rawText,
        context: undefined,
        isSupersession: false,
        manufacturer: undefined
      }));
      
      const processingTime = performance.now() - startTime;
      
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { 
              ...img, 
              status: 'completed', 
              extractedParts: smartExtractedParts,
              processingTime,
              confidence: smartExtractedParts.length > 0 ? smartExtractedParts.reduce((sum, p) => sum + p.confidence, 0) / smartExtractedParts.length : 0
            }
          : img
      ));

      // Notify parent component with all extracted parts
      onPartsExtracted(smartExtractedParts);
      
      // Remove from processing queue
      setProcessingQueue(prev => prev.filter(id => id !== imageId));
      
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
      
      // Remove from processing queue
      setProcessingQueue(prev => prev.filter(id => id !== imageId));
    }
  }, [convertFileToBase64, onPartsExtracted]);

  // Batch processing for multiple images
  const processBatchImages = useCallback(async (files: File[]) => {
    setIsProcessing(true);
    
    // Process images in parallel with concurrency limit
    const concurrencyLimit = 3; // Process max 3 images simultaneously
    const chunks = [];
    
    for (let i = 0; i < files.length; i += concurrencyLimit) {
      chunks.push(files.slice(i, i + concurrencyLimit));
    }
    
    for (const chunk of chunks) {
      await Promise.all(chunk.map(processImage));
      // Small delay between chunks to prevent overwhelming the API
      if (chunks.indexOf(chunk) < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    setIsProcessing(false);
  }, [processImage]);

  // Optimized event handlers
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const imageFiles: File[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }
    
    if (imageFiles.length > 0) {
      if (imageFiles.length === 1) {
        processImage(imageFiles[0]);
      } else {
        processBatchImages(imageFiles);
      }
    }
  }, [processImage, processBatchImages]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      if (files.length === 1) {
        processImage(files[0]);
      } else {
        processBatchImages(files);
      }
    }
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processImage, processBatchImages]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      if (files.length === 1) {
        processImage(files[0]);
      } else {
        processBatchImages(files);
      }
    }
  }, [processImage, processBatchImages]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setIsReady(true);
  }, []);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      setIsFocused(false);
      setIsReady(false);
    }, 100);
  }, []);

  const handleAreaClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (pasteAreaRef.current) {
      pasteAreaRef.current.focus();
      setIsFocused(true);
      setIsReady(true);
    }
  }, []);

  const handleFileButtonClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Memoized extracted parts for performance
  const allExtractedParts = useMemo(() => 
    images.reduce((acc, img) => [...acc, ...img.extractedParts], [] as ExtractedPartInfo[]), 
    [images]
  );

  // Optimized part removal
  const removeExtractedPart = useCallback((index: number) => {
    let partIndex = 0;
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      if (partIndex + image.extractedParts.length > index) {
        const localIndex = index - partIndex;
        const newImages = [...images];
        const removedPart = newImages[i].extractedParts[localIndex];
        
        newImages[i] = {
          ...newImages[i],
          extractedParts: newImages[i].extractedParts.filter((_, j) => j !== localIndex)
        };
        
        setImages(newImages);
        
        // Update parent component
        const allParts = newImages.reduce((acc, img) => [...acc, ...img.extractedParts], [] as ExtractedPartInfo[]);
        onPartsExtracted(allParts);
        onPartRemoved?.(removedPart);
        break;
      }
      partIndex += image.extractedParts.length;
    }
  }, [images, onPartsExtracted, onPartRemoved]);

  // Performance metrics
  const performanceMetrics = useMemo(() => {
    const totalImages = images.length;
    const completedImages = images.filter(img => img.status === 'completed').length;
    const errorImages = images.filter(img => img.status === 'error').length;
    const avgConfidence = allExtractedParts.length > 0 
      ? allExtractedParts.reduce((sum, p) => sum + p.confidence, 0) / allExtractedParts.length 
      : 0;
    const avgProcessingTime = images
      .filter(img => img.processingTime)
      .reduce((sum, img) => sum + (img.processingTime || 0), 0) / completedImages;

    return { totalImages, completedImages, errorImages, avgConfidence, avgProcessingTime };
  }, [images, allExtractedParts]);

  return (
    <div className="space-y-4">
    

      {/* Compact Paste Area */}
      <div
        ref={pasteAreaRef}
        className={`
          h-32
          relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200 outline-none
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
        
        {/* Compact Focus Indicator */}
        {(isFocused || isReady) && (
          <div className="absolute top-1 left-1">
            <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-blue-500 text-white rounded text-xs font-medium">
              <Focus className="h-2.5 w-2.5" />
              <span>Ready!</span>
            </div>
          </div>
        )}

        {/* Compact Processing Queue Indicator */}
        {processingQueueMemo.length > 0 && (
          <div className="absolute top-1 right-1">
            <div className="flex items-center space-x-1 px-1.5 py-0.5 bg-orange-500 text-white rounded text-xs font-medium">
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
              <span>{processingQueueMemo.length}</span>
            </div>
          </div>
        )}
        
        <div className="space-y-1">
          <div className="flex justify-center">
            {isFocused || isReady ? (
              <Clipboard className="h-6 w-6 text-blue-500 animate-pulse" />
            ) : (
              <ImageIcon className="h-6 w-6 text-gray-400" />
            )}
          </div>
          
          <div className="text-xs text-gray-600">
            {isFocused || isReady ? (
              <span className="font-medium text-blue-600">Ready to paste!</span>
            ) : (
              <span className="font-medium">Click to focus, then paste screenshots</span>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            {isFocused || isReady ? (
              <span>🖼️ Multiple parts per image (up to 10)</span>
            ) : (
              <span>JPG, PNG, GIF - extracts up to 10 parts per image</span>
            )}
          </div>
        </div>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <div className="flex items-center space-x-2 text-orange-600">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Processing batch images...</span>
        </div>
      )}

      {/* Compact Extracted Parts Preview */}
      {allExtractedParts.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-green-800">
              Extracted Parts ({allExtractedParts.length})
            </h4>
            <button
              onClick={() => {
                setImages([]);
                onPartsExtracted([]);
                onClearAll?.();
              }}
              className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded border border-red-200 transition-colors"
              title="Clear all parts and selections"
            >
              Clear All
            </button>
          </div>
          
          {/* 4-grid layout with specific text sizes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-80 overflow-y-auto">
            {allExtractedParts.map((part, index) => (
              <div key={index} className="relative bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 hover:border-green-400 hover:shadow-md transition-all duration-200 group">
                {/* Elegant close button */}
                <button
                  onClick={() => removeExtractedPart(index)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-300 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm z-10"
                  title="Remove this part"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                
                {/* Part details with specific text sizes */}
                <div className="space-y-2 text-left">
                  {/* Part Name - 10px */}
                  <div className="text-[10px] text-gray-600 font-medium leading-tight">
                    {part.partName}
                  </div>
                  
                  {/* Part Number - 12px semibold (plain text) */}
                  {part.partNumber && part.partNumber !== 'Not found' && (
                    <div className="text-[12px] font-semibold text-green-700 break-all">
                      {part.partNumber}
                    </div>
                  )}
                  
                  {/* Context - elegant badge */}
                  {part.context && (
                    <div className="text-[10px] text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                      {part.context}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Compact summary */}
          <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-md p-1.5 border border-gray-200">
            <div className="flex items-center justify-between">
              <span>📊 {allExtractedParts.length} parts</span>
              <span>🖼️ {images.filter(img => img.status === 'completed').length} image(s)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 