'use client';

import React, { useState, useEffect } from 'react';

interface QuoteDeadlineIndicatorProps {
  requiredBy?: string;
  customer?: string;
  className?: string;
}

export const QuoteDeadlineIndicator = ({ requiredBy, customer, className = '' }: QuoteDeadlineIndicatorProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  if (!requiredBy) return null;

  try {
    let deadline: Date;
    let diffMins: number;

    // Check if it's an ISO timestamp (contains 'T' and 'Z' or timezone)
    if (requiredBy.includes('T')) {
      // ISO timestamp format
      deadline = new Date(requiredBy);
      const diffMs = deadline.getTime() - currentTime.getTime();
      diffMins = Math.floor(diffMs / (1000 * 60));
    } else {
      // Legacy format (date and time as string) - Australian dd/mm/yyyy format
      const [datePart, timePart] = requiredBy.split(' ');
      const [day, month, year] = datePart.split('/');
      const timeStr = timePart.toLowerCase();
      
      let hours = 0;
      let minutes = 0;
      
      if (timeStr.includes('pm')) {
        const time = timeStr.replace('pm', '');
        if (time.includes(':')) {
          const [h, m] = time.split(':');
          const hour = parseInt(h);
          // 12 PM should be 12, not 24
          hours = hour === 12 ? 12 : hour + 12;
          minutes = parseInt(m || '0');
        } else {
          // Handle format like "1200pm"
          const timeNum = parseInt(time);
          const hour = Math.floor(timeNum / 100);
          // 12 PM should be 12, not 24
          hours = hour === 12 ? 12 : hour + 12;
          minutes = timeNum % 100;
        }
      } else if (timeStr.includes('am')) {
        const time = timeStr.replace('am', '');
        if (time.includes(':')) {
          const [h, m] = time.split(':');
          hours = parseInt(h);
          minutes = parseInt(m || '0');
        } else {
          // Handle format like "1200am"
          const timeNum = parseInt(time);
          hours = Math.floor(timeNum / 100);
          minutes = timeNum % 100;
        }
      }
      
      deadline = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hours, minutes);
      const diffMs = deadline.getTime() - currentTime.getTime();
      diffMins = Math.floor(diffMs / (1000 * 60));
    }
    
    let color = 'bg-green-500';
    let animation = '';
    let gradientAnimation = '';
    
    if (diffMins < 0) {
      color = 'bg-red-500';
      animation = 'animate-pulse';
      gradientAnimation = 'animate-gradient-border-red';
    } else if (diffMins < 15) {
      color = 'bg-red-500';
      animation = 'animate-pulse';
      gradientAnimation = 'animate-gradient-border-red';
    } else if (diffMins < 30) {
      color = 'bg-yellow-500';
      animation = 'animate-pulse';
      gradientAnimation = 'animate-gradient-border-yellow';
    } else if (diffMins < 60) {
      color = 'bg-yellow-500';
      animation = 'animate-pulse';
      gradientAnimation = 'animate-gradient-border-yellow';
    } else {
      color = 'bg-green-500';
      animation = '';
      gradientAnimation = '';
    }
    
    let timeDisplay = '';
    if (diffMins < 0) {
      const absMins = Math.abs(diffMins);
      if (absMins < 60) {
        timeDisplay = `-${absMins}m`;
      } else if (absMins < 1440) {
        const hours = Math.floor(absMins / 60);
        const mins = absMins % 60;
        timeDisplay = `-${hours}h ${mins}m`;
      } else if (absMins < 10080) {
        const days = Math.floor(absMins / 1440);
        const remainingMins = absMins % 1440;
        const hours = Math.floor(remainingMins / 60);
        const mins = remainingMins % 60;
        timeDisplay = `-${days}d ${hours}h ${mins}m`;
      } else {
        const weeks = Math.floor(absMins / 10080);
        const remainingMins = absMins % 10080;
        const days = Math.floor(remainingMins / 1440);
        const hours = Math.floor((remainingMins % 1440) / 60);
        const mins = remainingMins % 60;
        timeDisplay = `-${weeks}wk ${days}d ${hours}h ${mins}m`;
      }
    } else if (diffMins < 60) {
      timeDisplay = `${diffMins}m`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      timeDisplay = `${hours}h ${mins}m`;
    } else if (diffMins < 10080) {
      const days = Math.floor(diffMins / 1440);
      const remainingMins = diffMins % 1440;
      const hours = Math.floor(remainingMins / 60);
      const mins = remainingMins % 60;
      timeDisplay = `${days}d ${hours}h ${mins}m`;
    } else {
      const weeks = Math.floor(diffMins / 10080);
      const remainingMins = diffMins % 10080;
      const days = Math.floor(remainingMins / 1440);
      const hours = Math.floor((remainingMins % 1440) / 60);
      const mins = remainingMins % 60;
      timeDisplay = `${weeks}wk ${days}d ${hours}h ${mins}m`;
    }

    return (
      <>
        {/* Desktop: Full left border and indicator */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${color} ${animation} hidden sm:block`}></div>
        <div className="absolute left-0 top-[11px] transform -translate-y-1/2 z-10 flex items-center space-x-2 hidden sm:flex">
          <div className={`px-2 py-[2px] text-[12px] font-semibold text-white shadow-sm ${color} ${gradientAnimation} rounded border-2 border-transparent bg-clip-padding`}>
            {timeDisplay}
          </div>
          {customer && (
            <div className="px-2 py-[2px] text-[10px] text-orange-600 font-medium rounded shadow-sm border border-orange-200">
              {customer}
            </div>
          )}
        </div>
        
        {/* Mobile: Small rectangle indicator at top-left */}
        <div className={`absolute top-0 left-0 w-6 h-6 ${color} ${animation} block sm:hidden z-50`}></div>
        <div className="absolute top-0 left-0 z-50 block sm:hidden">
          <div className={`px-1 py-[1px] text-[8px] font-semibold text-white ${color} ${gradientAnimation} rounded-sm shadow-sm border-2 border-transparent bg-clip-padding`}>
            {timeDisplay}
          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error('Error parsing deadline:', error, 'requiredBy:', requiredBy);
    return null;
  }
}; 