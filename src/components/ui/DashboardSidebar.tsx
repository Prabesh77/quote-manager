'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, TrendingUp, DollarSign, Users, Package, Activity } from 'lucide-react';

const DashboardSidebar = () => {
  const pathname = usePathname();

  const isDashboardActive = pathname === '/dashboard';

  return (
    <div className="fixed left-0 top-16 h-full z-50">
      {/* Dashboard Button */}
      <div className="relative">
        <Link
          href="/dashboard"
          className={`
            group relative flex items-center justify-center w-8 h-10 bg-gradient-to-b from-blue-600 to-purple-600 
            hover:from-blue-700 hover:to-purple-700 transition-all duration-300 ease-in-out
            ${isDashboardActive ? 'shadow-lg scale-105' : 'shadow-md'}
            transform hover:scale-110 rounded-r-lg
          `}
        >
          {/* Icon */}
          <div className="relative z-10">
            <BarChart3 className={`h-4 w-4 text-white transition-all duration-300 ${isDashboardActive ? 'scale-110' : ''}`} />
          </div>
          
          {/* Active Indicator */}
          {isDashboardActive && (
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-l-full"></div>
          )}
          
          {/* Hover Effect */}
          <div className="absolute inset-0 bg-white/10 rounded-r-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </Link>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute left-0 top-8 w-8 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50"></div>
      <div className="absolute left-0 bottom-8 w-8 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-50"></div>
    </div>
  );
};

export default DashboardSidebar; 