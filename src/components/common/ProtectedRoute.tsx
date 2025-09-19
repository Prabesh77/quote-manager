'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { PageLoader } from '@/components/ui/PageLoader';

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

  useEffect(() => {
    // Only proceed when everything is loaded
    if (!isFullyLoaded) {
      return;
    }

    // If no user, redirect to login
    if (!user) {
      router.push('/login');
      return;
    }

    // If user exists but no profile after loading is complete, 
    // this might indicate a real problem - but let's be more patient
    // Only redirect if we're certain there's no profile after multiple attempts
    if (!profile) {
      // Don't redirect immediately - just show loading
      // The profile might still be loading or there might be a temporary issue
      return;
    }

    // Check role permissions
    if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
      const redirectPath = redirectTo || getDefaultRedirectPath(profile.role);
      router.push(redirectPath);
      return;
    }
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

  // Show loading until everything is fully loaded (initial app load)
  if (!isFullyLoaded) {
    return <PageLoader message="Loading..." subMessage="Please wait" />;
  }

  // Show loading if no user (redirecting to login)
  if (!user) {
    return <PageLoader message="Redirecting..." subMessage="Please wait" />;
  }

  // Show loading if profile is still loading or not available
  if (!profile) {
    return <SkeletonLoader />;
  }

  // Show loading if user doesn't have required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    return <PageLoader message="Redirecting..." subMessage="Please wait" />;
  }

  // User is authorized, render children
  return <>{children}</>;
}
