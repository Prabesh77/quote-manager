import { useQuery } from '@tanstack/react-query';
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

const fetchUserProfile = async (userId: string): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export function useUserProfile() {
  const { user } = useAuth();

  const {
    data: profile,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => fetchUserProfile(user!.id),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - profile data doesn't change often
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
    retry: 2,
    retryDelay: 1000,
  });

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
    error: error ? (error instanceof Error ? error.message : 'Failed to fetch profile') : null,
    hasRole,
    hasAnyRole,
    isAdmin,
    isQuoteCreator,
    isPriceManager,
    isQualityController,
  };
}
