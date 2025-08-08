'use client';

import { useState } from 'react';
import supabase from '@/utils/supabase';

export default function DebugTablesPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const checkTable = async (tableName: string) => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(5);

      return {
        exists: !error,
        error: error?.message || null,
        count: data?.length || 0,
        sample: data?.slice(0, 2) || []
      };
    } catch (error) {
      return {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        count: 0,
        sample: []
      };
    }
  };

  const checkAllTables = async () => {
    setLoading(true);
    const tables = ['quotes', 'parts', 'customers', 'vehicles', 'quote_parts'];
    const results: any = {};

    for (const table of tables) {
      console.log(`Checking table: ${table}`);
      results[table] = await checkTable(table);
    }

    setResults(results);
    setLoading(false);
  };

  const checkNormalizedQuotes = async () => {
    setLoading(true);
    
    try {
      // Check if normalized quotes exist
      const { data: normalizedQuotes, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          *,
          customer:customers(*),
          vehicle:vehicles(*)
        `)
        .order('created_at', { ascending: false });

      console.log('Normalized quotes query result:', { data: normalizedQuotes, error: quotesError });

      // Check quote parts
      const { data: quoteParts, error: partsError } = await supabase
        .from('quote_parts')
        .select(`
          *,
          part:parts(*)
        `);

      console.log('Quote parts query result:', { data: quoteParts, error: partsError });

      setResults({
        normalizedQuotes: {
          exists: !quotesError,
          error: quotesError?.message || null,
          count: normalizedQuotes?.length || 0,
          sample: normalizedQuotes?.slice(0, 2) || []
        },
        quoteParts: {
          exists: !partsError,
          error: partsError?.message || null,
          count: quoteParts?.length || 0,
          sample: quoteParts?.slice(0, 2) || []
        }
      });
    } catch (error) {
      console.error('Error checking normalized quotes:', error);
      setResults({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Database Tables</h1>
        
        <div className="space-y-4 mb-8">
          <button
            onClick={checkAllTables}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check All Tables'}
          </button>
          
          <button
            onClick={checkNormalizedQuotes}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 ml-4"
          >
            {loading ? 'Checking...' : 'Check Normalized Quotes'}
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
                    {result.sample && result.sample.length > 0 && (
                      <div>
                        <p><span className="font-medium">Sample Data:</span></p>
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                          {JSON.stringify(result.sample, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 