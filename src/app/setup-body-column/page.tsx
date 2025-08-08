'use client';

import { useState } from 'react';
import supabase from '@/utils/supabase';
import { Button } from '@/components/ui/button';

export default function SetupBodyColumnPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const addBodyColumn = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      // Add body column to vehicles table
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql_query: `
          ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS body TEXT;
          CREATE INDEX IF NOT EXISTS idx_vehicles_body ON vehicles(body);
        `
      });

      if (alterError) {
        setMessage(`Error adding body column: ${alterError.message}`);
        return;
      }

      // Verify the column was added
      const { data: columns, error: checkError } = await supabase
        .from('vehicles')
        .select('*')
        .limit(0);

      if (checkError) {
        setMessage(`Error checking table structure: ${checkError.message}`);
        return;
      }

      setMessage('✅ Body column successfully added to vehicles table!');
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkTableStructure = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .limit(1);

      if (error) {
        setMessage(`Error checking table: ${error.message}`);
        return;
      }

      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        setMessage(`✅ Vehicles table columns: ${columns.join(', ')}`);
      } else {
        setMessage('✅ Vehicles table exists but is empty');
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Setup Body Column</h1>
          
          <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Database Setup</h2>
              <p className="text-gray-600 mb-4">
                This will add the <code className="bg-gray-100 px-2 py-1 rounded">body</code> column to the vehicles table 
                to store the body type of vehicles.
              </p>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={checkTableStructure}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                {isLoading ? 'Checking...' : 'Check Current Table Structure'}
              </Button>

              <Button 
                onClick={addBodyColumn}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Adding Body Column...' : 'Add Body Column to Vehicles Table'}
              </Button>
            </div>

            {message && (
              <div className={`p-4 rounded-md ${
                message.includes('✅') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 