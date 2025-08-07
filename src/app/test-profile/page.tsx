'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useEffect, useState } from 'react';
import supabase from '@/utils/supabase';

export default function TestProfilePage() {
  const { user, loading } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const checkProfiles = async () => {
      try {
        // Check all user profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('*');

        if (profilesError) {
          setError(`Error fetching profiles: ${profilesError.message}`);
        } else {
          setProfileData(profiles);
        }
      } catch (err) {
        setError(`Error: ${err}`);
      }
    };

    checkProfiles();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Profile Test Page</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Current Auth User:</h2>
        <pre className="bg-gray-100 p-4 rounded">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">All User Profiles:</h2>
        {error ? (
          <div className="bg-red-100 p-4 rounded text-red-700">
            {error}
          </div>
        ) : (
          <pre className="bg-gray-100 p-4 rounded">
            {JSON.stringify(profileData, null, 2)}
          </pre>
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Auth Users:</h2>
        <p className="text-gray-600">
          Check Supabase Dashboard → Authentication → Users to see all auth users
        </p>
      </div>
    </div>
  );
} 