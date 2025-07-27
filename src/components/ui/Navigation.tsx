'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, DollarSign, CheckCircle, ShoppingCart, FileText } from 'lucide-react';
import { ConnectionStatus } from './ConnectionStatus';
import { useQuotes } from './useQuotes';

const Navigation = () => {
  const pathname = usePathname();
  const {
    connectionStatus,
  } = useQuotes();

  const navItems = [
    {
      name: 'Add Quote',
      href: '/new',
      icon: Plus,
      description: 'Create new quotes'
    },
    {
      name: 'Add Price',
      href: '/pricing',
      icon: DollarSign,
      description: 'Price pending quotes'
    },
    {
      name: 'Priced',
      href: '/priced',
      icon: FileText,
      description: 'Review priced quotes'
    },
    {
      name: 'Completed',
      href: '/completed-quotes',
      icon: CheckCircle,
      description: 'View completed quotes'
    },
    {
      name: 'Orders',
      href: '/orders',
      icon: ShoppingCart,
      description: 'Manage orders'
    }
  ];

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Q</span>
              </div>
              <span className="ml-3 text-xl font-semibold text-gray-900">Quote Manager</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href === '/new' && pathname === '/') ||
                (item.href === '/pricing' && pathname.startsWith('/pricing')) ||
                (item.href === '/priced' && pathname.startsWith('/priced')) ||
                (item.href === '/completed-quotes' && pathname.startsWith('/completed-quotes')) ||
                (item.href === '/orders' && pathname.startsWith('/orders'));
              
              const IconComponent = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer
                    ${isActive 
                      ? 'text-red-600 bg-red-50 border border-red-200' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center space-x-2">
                    <IconComponent className={`h-4 w-4 ${isActive ? 'text-red-600' : 'text-gray-500'}`} />
                    <span>{item.name}</span>
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side - could add user menu, notifications, etc. */}
          <div className="flex items-center">
            <div className="ml-4 flex items-center space-x-4">
              {/* Connection Status */}
              {/* <div className="text-xs text-gray-500">
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Connected
                </span>
              </div> */}
              <ConnectionStatus status={connectionStatus} />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 