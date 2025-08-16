'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, DollarSign, CheckCircle, ShoppingCart, FileText, BarChart3, Menu, X, Eye, User, LogOut, ChevronDown, Users } from 'lucide-react';
import { ConnectionStatus } from '@/components/common';
import { useQuotes } from '@/hooks/quotes/useQuotes';
import { useAuth } from '@/components/providers/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';

const Navigation = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { connectionStatus } = useQuotes();
  const { user, signOut } = useAuth();
  const { profile, loading } = useUserProfile();
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Handle click outside profile dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsProfileDropdownOpen(false);
      }
    };

    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isProfileDropdownOpen]);

  // Define all possible navigation items with their required roles
  const allNavItems = [
    {
      name: 'Add Quote',
      href: '/new',
      icon: Plus,
      description: 'Create new quotes',
      requiredRoles: ['quote_creator', 'admin']
    },
    {
      name: 'Add Price',
      href: '/pricing',
      icon: DollarSign,
      description: 'Price pending quotes',
      requiredRoles: ['price_manager', 'admin']
    },
    {
      name: 'Verify Price',
      href: '/verify-price',
      icon: Eye,
      description: 'Verify price for boss approval',
      requiredRoles: ['quality_controller', 'admin']
    },
    {
      name: 'Priced',
      href: '/priced',
      icon: FileText,
      description: 'Review priced quotes',
      requiredRoles: ['quote_creator', 'price_manager', 'admin']
    },
    {
      name: 'Completed',
      href: '/completed-quotes',
      icon: CheckCircle,
      description: 'View completed quotes',
      requiredRoles: ['price_manager', 'quality_controller', 'admin']
    },
    {
      name: 'Orders',
      href: '/orders',
      icon: ShoppingCart,
      description: 'Manage orders',
      requiredRoles: ['quality_controller', 'admin']
    }
  ];

  // Filter navigation items based on user role
  const navItems = profile ? allNavItems.filter(item => 
    item.requiredRoles.includes(profile.role)
  ) : [];

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    setIsProfileDropdownOpen(false); // Close dropdown before logout
    setIsLoggingOut(true); // Start loading
    try {
      await signOut();
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggingOut(false); // Reset loading state on error
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'quote_creator': return 'Quote Creator';
      case 'price_manager': return 'Price Manager';
      case 'quality_controller': return 'Quality Controller';
      case 'admin': return 'Administrator';
      default: return role;
    }
  };

  return (
    <>
      {/* Full-page Logout Loader */}
      {isLoggingOut && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              {/* Spinning circle */}
              <div className="w-16 h-16 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4"></div>
              {/* Inner pulse circle */}
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-red-400 rounded-full animate-ping mx-auto"></div>
            </div>
            <p className="text-gray-600 font-medium">Signing out...</p>
            <p className="text-sm text-gray-500 mt-1">Please wait</p>
          </div>
        </div>
      )}
      
      <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-12 h-8 rounded-lg flex items-center justify-center">
                <img src="/logo/AAA.png" alt="Logo" className="w-full h-full object-fit-contain" />
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
                  href={item.href === '/new' ? '/' : item.href} // Redirect /new to / for home page
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
                </Link>
              );
            })}
          </div>

          {/* Right side - User Profile, Connection Status & Mobile Menu Button */}
          <div className="flex items-center">
            <div className="ml-4 flex items-center space-x-4">
              <ConnectionStatus status={connectionStatus} />
              
              {/* User Profile Dropdown */}
              {user && (
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-red-600" />
                    </div>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {profile?.username || user.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        {profile ? getRoleDisplayName(profile.role) : 'Loading...'}
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>

                  {/* Profile Dropdown */}
                  {isProfileDropdownOpen && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      />
                      
                      {/* Dropdown Content */}
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <div className="text-sm font-medium text-gray-900">
                            {profile?.full_name || profile?.username || user.email}
                          </div>
                          <div className="text-xs text-gray-500">
                            {profile ? getRoleDisplayName(profile.role) : 'Loading...'}
                          </div>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              
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
              {/* Header with User Info */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                  <button
                    onClick={closeMobileMenu}
                    className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                {/* User Profile Info */}
                {user && (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {profile?.username || user.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        {profile ? getRoleDisplayName(profile.role) : 'Loading...'}
                      </div>
                    </div>
                  </div>
                )}
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
                        href={item.href === '/new' ? '/' : item.href} // Redirect /new to / for home page
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

              {/* Footer with Logout */}
              <div className="p-6 border-t border-gray-200">
                {user && (
                  <button
                    onClick={() => {
                      handleLogout();
                      closeMobileMenu();
                    }}
                    className="w-full flex items-center justify-center space-x-2 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
    </>
  );
};

export default Navigation;