'use client';

import React from 'react';

interface SkeletonLoaderProps {
  count?: number;
  className?: string;
}

export const SkeletonLoader = ({ count = 3, className = '' }: SkeletonLoaderProps) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
        >
          {/* Quote Card Skeleton - matches AccordionItem structure */}
          <div className="border-b border-gray-100 relative">
            {/* Skeleton for the grid structure that matches AccordionTrigger */}
            <div className="grid grid-cols-6 gap-4 w-full px-3 py-4" style={{ gridTemplateColumns: '1fr 1fr 2fr 1fr 0.5fr 0.5fr' }}>
              
              {/* Quote Ref Column */}
              <div className="flex items-center space-x-2 w-[160px]">
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="space-y-1">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-3 bg-gray-100 rounded w-16 animate-pulse"></div>
                </div>
              </div>
              
              {/* VIN Column */}
              <div className="space-y-1">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-3 bg-gray-100 rounded w-20 animate-pulse"></div>
              </div>
              
              {/* Vehicle Info Column */}
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="space-y-1 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="h-3 bg-gray-100 rounded w-24 animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              {/* Status Column */}
              <div className="flex justify-center">
                <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
              </div>
              
              {/* Parts Count Column */}
              <div className="flex justify-center">
                <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
              </div>
              
              {/* Actions Column */}
              <div className="flex justify-end space-x-2">
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Table header skeleton that matches the existing header
export const TableHeaderSkeleton = () => (
  <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
    <div className="grid grid-cols-6 gap-4 px-6 py-4" style={{ gridTemplateColumns: '1fr 1fr 2fr 1fr 0.5fr 0.5fr' }}>
      <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
      <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
      <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
      <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
      <div className="h-5 bg-gray-200 rounded w-12 animate-pulse"></div>
      <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
    </div>
  </div>
);

// Simple skeleton for individual elements
export const Skeleton = ({ 
  className = '', 
  width, 
  height = '1rem' 
}: { 
  className?: string; 
  width?: string; 
  height?: string; 
}) => (
  <div 
    className={`bg-gray-200 rounded animate-pulse ${className}`}
    style={{ width, height }}
  />
); 