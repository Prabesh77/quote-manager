'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'quote_creator' | 'price_manager' | 'quality_controller' | 'admin'>;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = ['admin'], // Default to admin only
  redirectTo 
}: ProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const router = useRouter();

  // Wait for both auth and profile to be fully loaded
  const isFullyLoaded = !authLoading && !profileLoading;

  // Debug logging
  console.log('🛡️ ProtectedRoute State:', {
    pathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
    user: !!user,
    profile: !!profile,
    profileRole: profile?.role,
    authLoading,
    profileLoading,
    isFullyLoaded,
    allowedRoles
  });

  useEffect(() => {
    // Only proceed when everything is loaded
    if (!isFullyLoaded) {
      console.log('⏳ Waiting for full load...');
      return;
    }

    console.log('✅ Fully loaded, checking permissions...');

    // If no user, redirect to login
    if (!user) {
      console.log('❌ No user - redirecting to login');
      router.push('/login');
      return;
    }

    // If user exists but no profile after loading is complete, 
    // this might indicate a real problem - but let's be more patient
    // Only redirect if we're certain there's no profile after multiple attempts
    if (!profile) {
      console.log('⚠️ User authenticated but no profile - showing loading instead of redirecting');
      // Don't redirect immediately - just show loading
      // The profile might still be loading or there might be a temporary issue
      return;
    }

    // Check role permissions
    if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
      const redirectPath = redirectTo || getDefaultRedirectPath(profile.role);
      console.log(`❌ Role mismatch - redirecting to: ${redirectPath}`);
      router.push(redirectPath);
      return;
    }

    console.log('✅ User authorized - rendering children');
  }, [user, profile, isFullyLoaded, allowedRoles, redirectTo, router]);

  // Helper function to determine where to redirect based on user role
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

  // Show loading until everything is fully loaded
  if (!isFullyLoaded) {
    return <SkeletonLoader />;
  }

  // Show loading if no user
  if (!user) {
    return <SkeletonLoader />;
  }

  // Show loading if profile is still loading or not available
  if (!profile) {
    return <SkeletonLoader />;
  }

  // Show loading if user doesn't have required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    return <SkeletonLoader />;
  }

  // User is authorized, render children
  return <>{children}</>;
}
