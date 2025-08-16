import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import supabase from '@/utils/supabase';

export interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  role: 'quote_creator' | 'price_manager' | 'quality_controller' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug logging
  console.log('👤 useUserProfile Debug:', {
    user: !!user,
    userId: user?.id,
    profile: !!profile,
    loading,
    error
  });

  useEffect(() => {
    if (!user) {
      console.log('👤 No user, clearing profile');
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        console.log('👤 Fetching profile for user:', user.id);
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('👤 Error fetching profile:', error);
          throw error;
        }

        console.log('👤 Profile fetched successfully:', data);
        setProfile(data);
      } catch (err) {
        console.error('👤 Error in fetchProfile:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch profile');
      } finally {
        console.log('👤 Setting loading to false');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const hasRole = (role: UserProfile['role']) => {
    return profile?.role === role;
  };

  const hasAnyRole = (roles: UserProfile['role'][]) => {
    return profile ? roles.includes(profile.role) : false;
  };

  const isAdmin = () => hasRole('admin');
  const isQuoteCreator = () => hasRole('quote_creator');
  const isPriceManager = () => hasRole('price_manager');
  const isQualityController = () => hasRole('quality_controller');

  return {
    profile,
    loading,
    error,
    hasRole,
    hasAnyRole,
    isAdmin,
    isQuoteCreator,
    isPriceManager,
    isQualityController,
  };
}
