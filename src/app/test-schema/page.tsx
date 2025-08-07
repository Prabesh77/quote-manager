'use client';

import { useState } from 'react';
import { checkDatabaseSchema } from '@/utils/checkDatabaseSchema';

export default function TestSchemaPage() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleCheckSchema = async () => {
    setLoading(true);
    setResults([]);
    
    // Capture console.log output
    const originalLog = console.log;
    const originalError = console.error;
    
    const logs: string[] = [];
    console.log = (...args) => {
      logs.push(args.join(' '));
      originalLog(...args);
    };
    console.error = (...args) => {
      logs.push(`ERROR: ${args.join(' ')}`);
      originalError(...args);
    };
    
    try {
      await checkDatabaseSchema();
      setResults(logs);
    } catch (error) {
      setResults([`Error: ${error}`]);
    } finally {
      setLoading(false);
      console.log = originalLog;
      console.error = originalError;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Database Schema Checker</h1>
      
      <button
        onClick={handleCheckSchema}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        {loading ? 'Checking...' : 'Check Database Schema'}
      </button>
      
      {results.length > 0 && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Results:</h2>
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
        <h2 className="text-lg font-semibold mb-2">What this does:</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Checks if parts and quotes tables exist</li>
          <li>Lists all columns in each table</li>
          <li>Tests both camelCase and snake_case column names</li>
          <li>Identifies which column naming convention is used</li>
        </ul>
      </div>
    </div>
  );
} 