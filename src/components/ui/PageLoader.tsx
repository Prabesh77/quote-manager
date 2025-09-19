'use client';

import React from 'react';

interface PageLoaderProps {
  message?: string;
  subMessage?: string;
}

export const PageLoader = ({ 
  message = "Loading...", 
  subMessage = "Please wait" 
}: PageLoaderProps) => {
  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          {/* Spinning circle */}
          <div className="w-16 h-16 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
          {/* Inner pulse circle */}
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-red-400 rounded-full animate-ping mx-auto"></div>
        </div>
        <p className="text-gray-600 font-medium">{message}</p>
        <p className="text-sm text-gray-500 mt-1">{subMessage}</p>
      </div>
    </div>
  );
};
