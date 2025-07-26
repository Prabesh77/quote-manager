'use client';

import { useState, useEffect } from 'react';
import supabase from '@/utils/supabase';

export interface Part {
  id: string;
  name: string;
  number: string;
  price: number | null;
  note: string;
  createdAt: string;
}

export interface Quote {
  id: string;
  vin: string;
  partRequested: string; // References parts table
  quoteRef: string;
  createdAt: string;
  make: string;
  model: string;
  series: string;
  auto: boolean;
  body: string;
  mthyr: string; // mth/yr field
  rego: string;
  status: 'active' | 'completed'; // New status field
  [key: string]: any; // Allow string indexing
}

export const useQuotes = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // Data validation function
  const validateQuoteData = (data: Record<string, any>) => {
    const validated: Record<string, any> = {};
    
    // Define expected field types
    const fieldTypes: Record<string, 'string' | 'number' | 'date' | 'boolean'> = {
      quoteRef: 'string',
      vin: 'string',
      make: 'string',
      model: 'string',
      series: 'string',
      auto: 'boolean',
      body: 'string',
      mthyr: 'string',
      rego: 'string',
      partRequested: 'string',
      createdAt: 'date'
    };
    
    Object.entries(data).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        return;
      }
      
      const expectedType = fieldTypes[key];
      if (expectedType === 'string') {
        validated[key] = String(value).trim();
      } else if (expectedType === 'number') {
        const num = Number(value);
        if (!isNaN(num)) {
          validated[key] = num;
        }
      } else if (expectedType === 'boolean') {
        validated[key] = Boolean(value);
      } else if (expectedType === 'date') {
        if (value instanceof Date) {
          validated[key] = value.toISOString();
        } else if (typeof value === 'string') {
          validated[key] = value;
        }
      } else {
        validated[key] = value;
      }
    });
    
    return validated;
  };

  const fetchQuotes = async () => {
    const { data, error } = await supabase.from('quotes').select('*').order('createdAt', { ascending: false });
    if (error) {
      console.error('Fetch quotes error:', error);
      setConnectionStatus('error');
    } else {
      console.log('Fetched quotes:', data);
      setQuotes(data || []);
      setConnectionStatus('connected');
    }
  };

  const fetchParts = async () => {
    console.log('Fetching parts from database...');
    const { data, error } = await supabase.from('parts').select('*').order('createdAt', { ascending: false });
    if (error) {
      console.error('Fetch parts error:', error);
    } else {
      console.log('Fetched parts from database:', data);
      console.log('Number of parts fetched:', data?.length || 0);
      setParts(data || []);
    }
  };

  const addQuote = async (fields: Record<string, string>, partsArray: string[] = []) => {
    console.log('Adding quote with parts:', partsArray);
    
    // First, create parts in the parts table
    const createdParts = [];
    
    for (const partName of partsArray) {
      if (partName.trim()) {
        console.log('Creating part:', partName.trim());
        const { data: partData, error: partError } = await supabase
          .from('parts')
          .insert({
            name: partName.trim(),
            number: '',
            price: null, // Use null instead of empty string for numeric field
            note: '',
          })
          .select()
          .single();
        
        if (partError) {
          console.error('Error creating part:', partError);
          return { error: partError };
        }
        
        console.log('Created part:', partData);
        createdParts.push(partData);
      }
    }

    // Create quote with reference to parts
    const partRequested = createdParts.map(part => part.id).join(',');
    console.log('Part requested string:', partRequested);
    console.log('Created parts:', createdParts);
    
    const { error } = await supabase.from('quotes').insert({
      ...fields,
      partRequested,
      createdAt: new Date().toISOString(),
      status: 'active', // Set default status
    });
    
    if (!error) {
      console.log('Quote created successfully');
      // Add a small delay to ensure parts are committed before fetching
      setTimeout(() => {
        fetchQuotes();
        fetchParts();
      }, 500);
    } else {
      console.error('Error creating quote:', error);
    }
    return { error };
  };

  const updateQuote = async (id: string, fields: Record<string, any>) => {
    console.log('Updating quote with ID:', id);
    console.log('Edit fields payload:', fields);
    
    const validatedFields = validateQuoteData(fields);
    console.log('Validated edit fields:', validatedFields);
    
    const { data, error } = await supabase
      .from('quotes')
      .update(validatedFields)
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Update error details:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
    } else {
      console.log('Update successful:', data);
      fetchQuotes();
    }
    return { error };
  };

  const addPart = async (part: Omit<Part, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase
      .from('parts')
      .insert({
        ...part,
        createdAt: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (!error) {
      fetchParts();
    }
    return { data, error };
  };

  const updatePart = async (id: string, updates: Partial<Part>) => {
    const { data, error } = await supabase
      .from('parts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (!error) {
      fetchParts();
    }
    return { data, error };
  };

  const markQuoteCompleted = async (id: string) => {
    const { error } = await supabase
      .from('quotes')
      .update({ status: 'completed' })
      .eq('id', id);
    
    if (!error) {
      fetchQuotes();
    }
    return { error };
  };

  const getActiveQuotes = () => {
    return quotes.filter(quote => quote.status !== 'completed');
  };

  const getCompletedQuotes = () => {
    return quotes.filter(quote => quote.status === 'completed');
  };

  const updateMultipleParts = async (updates: Array<{ id: string; updates: Partial<Part> }>) => {
    const results = [];
    
    for (const { id, updates: partUpdates } of updates) {
      const { data, error } = await supabase
        .from('parts')
        .update(partUpdates)
        .eq('id', id)
        .select()
        .single();
      
      results.push({ id, data, error });
    }
    
    if (!results.some(r => r.error)) {
      fetchParts();
    }
    
    return results;
  };

  const deletePart = async (id: string) => {
    const { error } = await supabase.from('parts').delete().eq('id', id);
    if (error) {
      console.error('Delete part error:', error.message);
    } else {
      fetchParts();
    }
    return { error };
  };

  const deleteQuote = async (id: string) => {
    const { error } = await supabase.from('quotes').delete().eq('id', id);
    if (error) {
      console.error('Delete error:', error.message);
    } else {
      fetchQuotes();
    }
    return { error };
  };

  // Test functions
  const testSupabaseConnection = async () => {
    console.log('Testing Supabase connection...');
    setConnectionStatus('checking');
    
    const { data: testData, error: testError } = await supabase
      .from('quotes')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('Connection test failed:', testError);
      setConnectionStatus('error');
    } else {
      console.log('Connection test successful');
      setConnectionStatus('connected');
    }
  };

  const checkTableStructure = async () => {
    console.log('Checking table structure...');
    
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Table structure check failed:', error);
      alert(`Table structure check failed: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log('Table structure:', Object.keys(data[0]));
      alert(`Table has columns: ${Object.keys(data[0]).join(', ')}`);
    } else {
      console.log('Table is empty');
      alert('Table is empty - no records found');
    }
  };

  const testUpdate = async () => {
    if (quotes.length === 0) {
      alert('No quotes available to test update');
      return;
    }
    
    const firstQuote = quotes[0];
    console.log('Testing update with quote:', firstQuote);
    
    const testUpdateData = {
      partRequested: 'test-part-id'
    };
    
    const { data, error } = await supabase
      .from('quotes')
      .update(testUpdateData)
      .eq('id', firstQuote.id)
      .select();
    
    if (error) {
      console.error('Test update failed:', error);
      alert(`Test update failed: ${error.message}`);
    } else {
      console.log('Test update successful:', data);
      alert('Test update successful');
      fetchQuotes();
    }
  };

  useEffect(() => {
    fetchQuotes();
    fetchParts();
    testSupabaseConnection();
  }, []);

  return {
    quotes,
    parts,
    connectionStatus,
    addQuote,
    updateQuote,
    addPart,
    updatePart,
    updateMultipleParts,
    deletePart,
    deleteQuote,
    testSupabaseConnection,
    checkTableStructure,
    testUpdate,
    markQuoteCompleted,
    getActiveQuotes,
    getCompletedQuotes,
  };
}; 