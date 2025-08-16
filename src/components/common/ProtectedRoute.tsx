'use client';

import { useEffect } from 'react';
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

  // Combined loading state
  const isLoading = authLoading || profileLoading;

  // Debug logging
  console.log('🔒 ProtectedRoute Debug:', {
    user: !!user,
    userId: user?.id,
    profile: !!profile,
    profileRole: profile?.role,
    authLoading,
    profileLoading,
    isLoading,
    allowedRoles,
    hasAccess: profile ? allowedRoles.includes(profile.role) : false,
    currentPathname: typeof window !== 'undefined' ? window.location.pathname : 'unknown'
  });

  useEffect(() => {
    if (isLoading) {
      console.log('⏳ Still loading (auth or profile)...');
      return; // Still loading, wait
    }

    if (!user) {
      console.log('❌ No user, redirecting to login');
      router.push('/login');
      return;
    }

    if (!profile) {
      console.log('❌ No profile, redirecting to home');
      router.push('/');
      return;
    }

    // Check if user has required role
    if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
      console.log(`❌ User role ${profile.role} not allowed. Allowed roles:`, allowedRoles);
      // Unauthorized, redirect to appropriate page based on role
      const redirectPath = redirectTo || getDefaultRedirectPath(profile.role);
      console.log(`🔄 Redirecting to: ${redirectPath}`);
      router.push(redirectPath);
      return;
    }

    console.log('✅ User authorized, rendering children');
  }, [user, profile, isLoading, allowedRoles, redirectTo, router]);

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

  // Show loading while checking auth
  if (isLoading) {
    console.log('⏳ Showing loading skeleton...');
    return <SkeletonLoader />;
  }

  // Show loading while redirecting
  if (!user || !profile || (allowedRoles.length > 0 && !allowedRoles.includes(profile.role))) {
    console.log('⏳ Showing loading skeleton during redirect...');
    return <SkeletonLoader />;
  }

  // User is authorized, render children
  console.log('✅ Rendering protected content');
  return <>{children}</>;
}
