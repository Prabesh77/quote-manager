'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, DollarSign, CheckCircle, ShoppingCart, FileText, BarChart3, Menu, X, TrendingUp } from 'lucide-react';
import { ConnectionStatus } from '@/components/common/ConnectionStatus';

const Navigation = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    },
    {
      name: 'User Stats',
      href: '/user-stats',
      icon: TrendingUp,
      description: 'View user performance'
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
                (item.href === '/orders' && pathname.startsWith('/orders')) ||
                (item.href === '/user-stats' && pathname.startsWith('/user-stats'));
              
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
                    <div className="absolute inset-0 bg-red-50 rounded-lg border border-red-200 -z-10"></div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right side - Connection Status and Mobile Menu */}
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="hidden md:block">
              <ConnectionStatus status="connected" />
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
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
                      flex items-center px-3 py-2 rounded-lg text-base font-medium transition-colors
                      ${isActive 
                        ? 'text-red-600 bg-red-50 border border-red-200' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                  >
                    <IconComponent className={`h-5 w-5 mr-3 ${isActive ? 'text-red-600' : 'text-gray-500'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation; 