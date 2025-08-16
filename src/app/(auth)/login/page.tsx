'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Lock, User, Shield, Zap } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  const { signIn, user } = useAuth();
  const router = useRouter();
  const { profile } = useUserProfile();

  const getDefaultRedirectPath = (role: string) => {
    switch (role) {
      case 'quote_creator':
        return '/'; // Quote creators go to Add Quote page (home)
      case 'price_manager':
        return '/pricing'; // Price managers go to Add Price page
      case 'quality_controller':
        return '/verify-price'; // Quality controllers go to Verify Price page
      case 'admin':
        return '/dashboard'; // Admins go to Dashboard
      default:
        return '/'; // Fallback to home
    }
  };

  // Handle redirect after successful login and profile load
  useEffect(() => {
    if (shouldRedirect && user && profile) {
      const redirectPath = getDefaultRedirectPath(profile.role);
      router.push(redirectPath);
    }
  }, [shouldRedirect, user, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Use Supabase authentication
      const { error } = await signIn(username, password);
      
      if (error) {
        setError(error.message || 'Login failed. Please try again.');
      } else {
        // Set flag to redirect once profile is loaded
        setShouldRedirect(true);
      }
      
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0">
        {/* Moving gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-50 via-pink-50 to-red-50 animate-pulse opacity-60"></div>
        
        {/* Animated light rays */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-red-200/30 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-bl from-pink-200/30 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-tr from-red-100/40 to-transparent rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>
        
        {/* Subtle moving gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-100/20 via-transparent to-pink-100/20 animate-pulse delay-700"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo and Welcome Section */}
          <div className="text-center mb-8">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 mb-6 p-4">
              <Image 
                src="/logo/AAA.png" 
                alt="AAA Logo" 
                width={48} 
                height={48}
                className="object-contain"
              />
            </div>
            
            {/* Welcome Text */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
              <p className="text-gray-600">Sign in to your workspace</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Shield className="h-4 w-4 text-gray-400" />
                <span>Secure • Fast • Reliable</span>
              </div>
            </div>
          </div>

          {/* Login Form Card */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-sm border border-gray-200 p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-semibold text-gray-800">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <User className="h-5 w-5 text-red-500" />
                  </div>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-12 text-base border-gray-200 focus:border-red-500 focus:ring-red-500/20 transition-colors bg-white/90 backdrop-blur-sm hover:border-red-300"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-800">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                    <Lock className="h-5 w-5 text-red-500" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-12 h-12 text-base border-gray-200 focus:border-red-500 focus:ring-red-500/20 transition-colors bg-white/90 backdrop-blur-sm hover:border-red-300"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-red-500 hover:text-red-600 transition-colors z-10"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading || !username || !password}
                className="w-full h-12 bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed text-white font-medium text-base transition-colors shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Zap className="h-4 w-4" />
                    <span>Sign In</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Contact your administrator for login credentials
              </p>
            </div>
          </div>

          {/* Bottom Decorative Element */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center space-x-2 text-xs text-gray-400">
              <div className="w-1 h-1 bg-red-400 rounded-full animate-pulse"></div>
              <span>Enterprise-grade security</span>
              <div className="w-1 h-1 bg-red-400 rounded-full animate-pulse delay-500"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
