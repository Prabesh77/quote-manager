'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, DollarSign, CheckCircle, ShoppingCart, FileText, BarChart3, Menu, X } from 'lucide-react';
import { ConnectionStatus } from '@/components/common';
import { useQuotes } from '@/hooks/quotes/useQuotes';

const Navigation = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-12 h-8 rounded-lg flex items-center justify-center">
                {/* <span className="text-white font-bold text-sm">Q</span> */}
                <img src="/logo/AAA.png" alt="Logo" className=" w-full h-full object-fit-contain" />
              </div>
              <span className="hidden md:block ml-3 text-xl font-semibold text-gray-900"></span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <div className="hidden md:flex items-center space-x-1">
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
                    <span className='text-sm'>{item.name}</span>
                  </div>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side - Connection Status & Mobile Menu Button */}
          <div className="flex items-center">
            <div className="ml-4 flex items-center space-x-4">
              <ConnectionStatus status={connectionStatus} />
              
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={closeMobileMenu}
          />
          
          {/* Drawer */}
          <div className={`fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-out md:hidden ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="flex-1 p-6">
                <div className="space-y-2">
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
                        onClick={closeMobileMenu}
                        className={`
                          flex items-center space-x-3 p-4 rounded-lg transition-all duration-200 cursor-pointer
                          ${isActive 
                            ? 'text-red-600 bg-red-50 border border-red-200' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }
                        `}
                      >
                        <IconComponent className={`h-5 w-5 ${isActive ? 'text-red-600' : 'text-gray-500'}`} />
                        <div className="flex flex-col">
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-gray-500">{item.description}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Connected</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navigation; 