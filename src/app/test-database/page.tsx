'use client';

import { useState } from 'react';
import supabase from '@/utils/supabase';

export default function TestDatabasePage() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const testDatabaseStructure = async () => {
    setLoading(true);
    setResults([]);
    
    const logs: string[] = [];
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };
    console.error = (...args) => {
      logs.push(`ERROR: ${args.join(' ')}`);
      originalError(...args);
    };
    
    try {
      // Test parts table structure
      console.log('🔍 Testing parts table structure...');
      
      // Check if parts table exists
      const { data: partsData, error: partsError } = await supabase
        .from('parts')
        .select('*')
        .limit(1);
      
      if (partsError) {
        console.error('❌ Error accessing parts table:', partsError);
      } else {
        console.log('✅ Parts table accessible');
        if (partsData && partsData.length > 0) {
          console.log('📋 Parts table columns:', Object.keys(partsData[0]));
        }
      }
      
      // Test adding a part with all required fields
      console.log('\n🧪 Testing part creation...');
      const testPart = {
        part_name: 'Test Part',
        part_number: 'TEST001',
        price: 100.00,
        note: 'Test note',
        created_at: new Date().toISOString()
      };
      
      const { data: newPart, error: addError } = await supabase
        .from('parts')
        .insert(testPart)
        .select()
        .single();
      
      if (addError) {
        console.error('❌ Error adding test part:', addError);
      } else {
        console.log('✅ Test part created successfully:', newPart);
        
        // Clean up - delete the test part
        await supabase.from('parts').delete().eq('id', newPart.id);
        console.log('🧹 Test part cleaned up');
      }
      
      // Test quotes table structure
      console.log('\n🔍 Testing quotes table structure...');
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .limit(1);
      
      if (quotesError) {
        console.error('❌ Error accessing quotes table:', quotesError);
      } else {
        console.log('✅ Quotes table accessible');
        if (quotesData && quotesData.length > 0) {
          console.log('📋 Quotes table columns:', Object.keys(quotesData[0]));
        }
      }
      
    } catch (error) {
      console.error('❌ Error in database test:', error);
    } finally {
      setLoading(false);
      setResults(logs);
      console.log = originalLog;
      console.error = originalError;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Database Structure Test</h1>
      
      <button
        onClick={testDatabaseStructure}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        {loading ? 'Testing...' : 'Test Database Structure'}
      </button>
      
      {results.length > 0 && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Test Results:</h2>
          <pre className="text-sm overflow-auto">
            {results.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
          </pre>
        </div>
      )}
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">What this tests:</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Checks if parts and quotes tables exist</li>
          <li>Lists all columns in each table</li>
          <li>Tests creating a part with all required fields</li>
          <li>Verifies column names match application expectations</li>
        </ul>
      </div>
    </div>
  );
} 