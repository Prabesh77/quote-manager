'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, TrendingUp, DollarSign, Users, Package, Activity, Truck } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';

const DashboardSidebar = () => {
  const pathname = usePathname();
  const { profile } = useUserProfile();

  const isDashboardActive = pathname === '/dashboard';
  const isDeliveryActive = pathname === '/delivery';
  const isUserManagementActive = pathname === '/user-management';

  // Only show User Management for admin users
  const showUserManagement = profile?.role === 'admin';

  return (
    <div className="fixed left-0 top-1/2 h-full z-50">
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
      
      {/* Delivery Button */}
      <div className="relative mt-2">
        <Link
          href="/delivery"
          className={`
            group relative flex items-center justify-center w-8 h-10 bg-gradient-to-b from-green-600 to-emerald-600 
            hover:from-green-700 hover:to-emerald-700 transition-all duration-300 ease-in-out
            ${isDeliveryActive ? 'shadow-lg scale-105' : 'shadow-md'}
            transform hover:scale-110 rounded-r-lg
          `}
        >
          {/* Icon */}
          <div className="relative z-10">
            <Truck className={`h-4 w-4 text-white transition-all duration-300 ${isDeliveryActive ? 'scale-110' : ''}`} />
          </div>
          
          {/* Active Indicator */}
          {isDeliveryActive && (
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-l-full"></div>
          )}
          
          {/* Hover Effect */}
          <div className="absolute inset-0 bg-white/10 rounded-r-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </Link>
      </div>

      {/* User Management Button - Only for admin users */}
      {showUserManagement && (
        <div className="relative mt-2">
          <Link
            href="/user-management"
            className={`
              group relative flex items-center justify-center w-8 h-10 bg-gradient-to-b from-red-600 to-pink-600 
              hover:from-red-700 hover:to-pink-700 transition-all duration-300 ease-in-out
              ${isUserManagementActive ? 'shadow-lg scale-105' : 'shadow-md'}
              transform hover:scale-110 rounded-r-lg
            `}
          >
            {/* Icon */}
            <div className="relative z-10">
              <Users className={`h-4 w-4 text-white transition-all duration-300 ${isUserManagementActive ? 'scale-110' : ''}`} />
            </div>
            
            {/* Active Indicator */}
            {isUserManagementActive && (
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-l-full"></div>
            )}
            
            {/* Hover Effect */}
            <div className="absolute inset-0 bg-white/10 rounded-r-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
        </div>
      )}
      
      {/* Decorative Elements */}
      <div className="absolute left-0 top-8 w-8 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50"></div>
      <div className="absolute left-0 bottom-8 w-8 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent opacity-50"></div>
    </div>
  );
};

export default DashboardSidebar; 