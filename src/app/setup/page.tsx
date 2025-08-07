'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createTestUsers } from '@/utils/createTestUsers';
import { deleteAndRecreateUsers } from '@/utils/deleteAndRecreateUsers';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState('');
  const [showRecreateOption, setShowRecreateOption] = useState(false);

  const handleSetup = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await createTestUsers();
      setIsComplete(true);
    } catch (err) {
      setError('Error setting up test data. Please check your Supabase configuration.');
      console.error('Setup error:', err);
      setShowRecreateOption(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Setup Delivery App</h1>
          <p className="text-gray-600">Create test users and sample data</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {!isComplete ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Prerequisites:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Supabase project configured</li>
                  <li>• Database tables created</li>
                  <li>• Environment variables set</li>
                </ul>
              </div>

              <Button
                onClick={handleSetup}
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Setting up...</span>
                  </div>
                ) : (
                  'Create Test Data'
                )}
              </Button>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                  {showRecreateOption && (
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <p className="text-sm text-red-700 mb-2">
                        If you're getting "email not confirmed" errors, try recreating the users:
                      </p>
                      <Button
                        onClick={async () => {
                          setIsLoading(true);
                          setError('');
                          try {
                            await deleteAndRecreateUsers();
                            setIsComplete(true);
                          } catch (err) {
                            setError('Error recreating users. Please try again.');
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Recreate Users
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Setup Complete!</h3>
              <p className="text-gray-600 mb-4">Test users and data have been created successfully.</p>
              
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <h4 className="font-medium text-gray-900 mb-2">Login Credentials:</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Admin:</span> admin@delivery.com / admin123
                  </div>
                  <div>
                    <span className="font-medium">Driver:</span> driver@delivery.com / driver123
                  </div>
                </div>
              </div>

              <Button
                onClick={() => window.location.href = '/delivery/auth/login'}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                Go to Login
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 