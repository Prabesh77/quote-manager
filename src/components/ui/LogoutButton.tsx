'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

interface LogoutButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'lg';
  className?: string;
}

export default function LogoutButton({ 
  variant = 'outline', 
  size = 'sm', 
  className = '' 
}: LogoutButtonProps) {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Button
      onClick={handleSignOut}
      variant={variant}
      size={size}
      className={`text-gray-600 hover:text-red-600 ${className}`}
    >
      <LogOut className="h-4 w-4 mr-1" />
      Sign Out
    </Button>
  );
} 