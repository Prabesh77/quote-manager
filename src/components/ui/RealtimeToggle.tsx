'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface RealtimeToggleProps {
  className?: string;
}

export default function RealtimeToggle({ className = '' }: RealtimeToggleProps) {
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(true);

  // Load saved preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('realtime-enabled');
    if (saved !== null) {
      setIsRealtimeEnabled(JSON.parse(saved));
    }
  }, []);

  // Save preference to localStorage
  const handleToggle = (enabled: boolean) => {
    setIsRealtimeEnabled(enabled);
    localStorage.setItem('realtime-enabled', JSON.stringify(enabled));
    
    // Dispatch custom event to notify realtime system
    window.dispatchEvent(new CustomEvent('realtime-toggle', { 
      detail: { enabled } 
    }));
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => handleToggle(!isRealtimeEnabled)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
          ${isRealtimeEnabled 
            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
        `}
        title={isRealtimeEnabled ? 'Disable real-time updates' : 'Enable real-time updates'}
      >
        {isRealtimeEnabled ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span>{isRealtimeEnabled ? 'Realtime On' : 'Realtime Off'}</span>
      </button>
    </div>
  );
}
