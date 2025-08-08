'use client';

import { useState } from 'react';
import supabase from '@/utils/supabase';

export default function SetupNormalizedPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  const createTables = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Creating normalized database tables...');
      
      // Create customers table
      const { error: customersError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS customers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            phone TEXT,
            address TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `
      });

      if (customersError) {
        console.error('Customers table creation error:', customersError);
        setError(`Customers table creation failed: ${customersError.message}`);
        return;
      }

      // Create vehicles table
      const { error: vehiclesError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS vehicles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            rego TEXT,
            make TEXT NOT NULL,
            model TEXT NOT NULL,
            series TEXT,
            year INTEGER,
            vin TEXT,
            color TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `
      });

      if (vehiclesError) {
        console.error('Vehicles table creation error:', vehiclesError);
        setError(`Vehicles table creation failed: ${vehiclesError.message}`);
        return;
      }

      // Create quotes table
      const { error: quotesError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS quotes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            customer_id UUID REFERENCES customers(id),
            vehicle_id UUID REFERENCES vehicles(id),
            status TEXT DEFAULT 'unpriced',
            notes TEXT,
            tax_invoice_number TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `
      });

      if (quotesError) {
        console.error('Quotes table creation error:', quotesError);
        setError(`Quotes table creation failed: ${quotesError.message}`);
        return;
      }

      // Create parts table
      const { error: partsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS parts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            vehicle_id UUID REFERENCES vehicles(id),
            part_name TEXT NOT NULL,
            part_number TEXT,
            price NUMERIC,
            note TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `
      });

      if (partsError) {
        console.error('Parts table creation error:', partsError);
        setError(`Parts table creation failed: ${partsError.message}`);
        return;
      }

      // Create quote_parts table
      const { error: quotePartsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS quote_parts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            quote_id UUID REFERENCES quotes(id),
            part_id UUID REFERENCES parts(id),
            final_price NUMERIC,
            note TEXT,
            status TEXT DEFAULT 'WaitingForPrice',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
        `
      });

      if (quotePartsError) {
        console.error('Quote parts table creation error:', quotePartsError);
        setError(`Quote parts table creation failed: ${quotePartsError.message}`);
        return;
      }

      setResults({
        customers: { created: true, error: null },
        vehicles: { created: true, error: null },
        quotes: { created: true, error: null },
        parts: { created: true, error: null },
        quote_parts: { created: true, error: null }
      });

      alert('All normalized tables created successfully!');
      
    } catch (error) {
      console.error('Error creating tables:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testTables = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const tables = ['customers', 'vehicles', 'quotes', 'parts', 'quote_parts'];
      const results: any = {};

      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .select('id')
          .limit(0);

        results[table] = {
          exists: !error,
          error: error?.message || null
        };
      }

      setResults(results);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Setup Normalized Database</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <div className="space-y-4 mb-8">
          <button
            onClick={createTables}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Creating Tables...' : 'Create Normalized Tables'}
          </button>
          
          <button
            onClick={testTables}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 ml-4"
          >
            {loading ? 'Testing...' : 'Test Tables'}
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
                    {result.created && <p><span className="font-medium text-green-600">Created:</span> ✅ Yes</p>}
                    {result.error && (
                      <p><span className="font-medium text-red-600">Error:</span> {result.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
          <strong>Instructions:</strong>
          <ol className="list-decimal list-inside mt-2 space-y-1">
            <li>First, click "Test Tables" to see which tables exist</li>
            <li>If tables don't exist, click "Create Normalized Tables"</li>
            <li>After creating tables, test them again</li>
            <li>Then go to <a href="/test-normalized" className="underline">/test-normalized</a> to create test data</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 