'use client';

import { useState } from 'react';
import supabase from '@/utils/supabase';

export default function TestNormalizedPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testTable = async (tableName: string) => {
    try {
      // First, just try to access the table without selecting data
      const { error } = await supabase
        .from(tableName)
        .select('id')
        .limit(0);

      if (error) {
        return {
          exists: false,
          error: error.message,
          count: 0
        };
      }

      // If no error, table exists, now try to count records
      const { data, error: countError } = await supabase
        .from(tableName)
        .select('id', { count: 'exact' });

      return {
        exists: true,
        error: countError?.message || null,
        count: data?.length || 0
      };
    } catch (error) {
      return {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0
      };
    }
  };

  const testAllTables = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const tables = ['customers', 'vehicles', 'quotes', 'parts', 'quote_parts'];
      const results: any = {};

      for (const table of tables) {
        console.log(`Testing table: ${table}`);
        results[table] = await testTable(table);
      }

      setResults(results);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
      console.error('Error testing tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTestData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Creating test customer...');
      // Create test customer
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: 'Test Customer',
          phone: '123-456-7890',
          address: '123 Test St'
        })
        .select()
        .single();

      if (customerError) {
        console.error('Customer creation error:', customerError);
        setError(`Customer creation failed: ${customerError.message}`);
        return;
      }

      console.log('Creating test vehicle...');
      // Create test vehicle
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .insert({
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          vin: 'TEST123456789'
        })
        .select()
        .single();

      if (vehicleError) {
        console.error('Vehicle creation error:', vehicleError);
        setError(`Vehicle creation failed: ${vehicleError.message}`);
        return;
      }

      console.log('Creating test quote...');
      // Create test quote
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          customer_id: customer.id,
          vehicle_id: vehicle.id,
          status: 'unpriced',
          notes: 'Test quote'
        })
        .select()
        .single();

      if (quoteError) {
        console.error('Quote creation error:', quoteError);
        setError(`Quote creation failed: ${quoteError.message}`);
        return;
      }

      console.log('Creating test part...');
      // Create test part
      const { data: part, error: partError } = await supabase
        .from('parts')
        .insert({
          vehicle_id: vehicle.id,
          part_name: 'Test Part',
          part_number: 'TP001',
          price: 100
        })
        .select()
        .single();

      if (partError) {
        console.error('Part creation error:', partError);
        setError(`Part creation failed: ${partError.message}`);
        return;
      }

      console.log('Creating test quote_part...');
      // Create test quote_part
      const { data: quotePart, error: quotePartError } = await supabase
        .from('quote_parts')
        .insert({
          quote_id: quote.id,
          part_id: part.id,
          final_price: 100,
          status: 'WaitingForPrice'
        })
        .select()
        .single();

      if (quotePartError) {
        console.error('Quote part creation error:', quotePartError);
        setError(`Quote part creation failed: ${quotePartError.message}`);
        return;
      }

      alert('Test data created successfully!');
      testAllTables();
    } catch (error) {
      console.error('Error creating test data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Test Normalized Database</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <div className="space-y-4 mb-8">
          <button
            onClick={testAllTables}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test All Tables'}
          </button>
          
          <button
            onClick={createTestData}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-4"
          >
            {loading ? 'Creating...' : 'Create Test Data'}
          </button>
        </div>

        {Object.keys(results).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Table Status</h2>
            <div className="space-y-4">
              {Object.entries(results).map(([tableName, result]: [string, any]) => (
                <div key={tableName} className="border rounded p-4">
                  <h3 className="font-medium text-lg">{tableName}</h3>
                  <div className="mt-2 space-y-1">
                    <p><span className="font-medium">Exists:</span> {result.exists ? '✅ Yes' : '❌ No'}</p>
                    <p><span className="font-medium">Records:</span> {result.count}</p>
                    {result.error && (
                      <p><span className="font-medium text-red-600">Error:</span> {result.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <strong>Note:</strong> If tables don't exist, you'll need to create them first. Check the console for detailed error messages.
        </div>
      </div>
    </div>
  );
} 