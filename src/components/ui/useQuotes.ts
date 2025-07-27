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
  status: 'active' | 'completed' | 'unpriced' | 'priced' | 'ordered'; // Updated status field
  taxInvoiceNumber?: string; // Tax invoice number for orders
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

  // Real-time subscriptions
  useEffect(() => {
    console.log('Setting up real-time subscriptions...');
    
    // Subscribe to quotes table changes
    const quotesSubscription = supabase
      .channel('quotes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotes'
        },
        (payload) => {
          console.log('Quotes real-time change:', payload);
          // Refresh both quotes and parts since status depends on parts data
          fetchQuotes();
          fetchParts();
        }
      )
      .subscribe((status) => {
        console.log('Quotes subscription status:', status);
      });

    // Subscribe to parts table changes
    const partsSubscription = supabase
      .channel('parts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parts'
        },
        (payload) => {
          console.log('Parts real-time change:', payload);
          // Refresh both quotes and parts since status depends on parts data
          fetchQuotes();
          fetchParts();
        }
      )
      .subscribe((status) => {
        console.log('Parts subscription status:', status);
      });

    // Initial data fetch
    fetchQuotes();
    fetchParts();
    testSupabaseConnection();

    // Cleanup subscriptions on unmount
    return () => {
      console.log('Cleaning up real-time subscriptions...');
      quotesSubscription.unsubscribe();
      partsSubscription.unsubscribe();
    };
  }, []);

  const addQuote = async (fields: Record<string, string>, partIds: string[]) => {
    const partRequested = partIds.join(',');
    
    const { data, error } = await supabase.from('quotes').insert({
      ...fields,
      partRequested,
      createdAt: new Date().toISOString(),
      status: 'unpriced', // Set initial status as unpriced
    }).select();
    
    if (!error) {
      fetchQuotes();
    }
    return { data, error };
  };

  const updateQuote = async (id: string, fields: Record<string, string | number | boolean>) => {
    try {
      const validatedFields = validateQuoteData(fields);
      
      const { error } = await supabase
        .from('quotes')
        .update(validatedFields)
        .eq('id', id);
      
      if (error) {
        console.error('Update quote error:', error);
        return { error };
      } else {
        fetchQuotes();
        return { error: null };
      }
    } catch (error) {
      console.error('Update quote error:', error);
      return { error };
    }
  };

  const addPart = async (partData: Omit<Part, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase.from('parts').insert({
      ...partData,
      createdAt: new Date().toISOString(),
    }).select();
    
    if (!error) {
      fetchParts();
    }
    return { data, error };
  };

  const updateQuoteStatus = async (quoteId: string) => {
    try {
      // Get the quote to find its parts
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('partRequested')
        .eq('id', quoteId)
        .single();

      if (quoteError) {
        console.error('Error fetching quote for status update:', quoteError);
        return;
      }

      // Get the parts for this quote
      const partIds = quote.partRequested?.split(',').map((id: string) => id.trim()) || [];
      const { data: parts, error: partsError } = await supabase
        .from('parts')
        .select('price')
        .in('id', partIds);

      if (partsError) {
        console.error('Error fetching parts for status update:', partsError);
        return;
      }

      // Calculate status based on parts
      let status = 'unpriced';
      if (parts && parts.length > 0) {
        const hasPricedParts = parts.some(part => part.price && part.price > 0);
        status = hasPricedParts ? 'priced' : 'unpriced';
      }

      // Update the quote status in the database
      const { error: updateError } = await supabase
        .from('quotes')
        .update({ status })
        .eq('id', quoteId);

      if (updateError) {
        console.error('Error updating quote status:', updateError);
      } else {
        console.log('Quote status updated to:', status);
        // Refresh quotes to update the UI immediately
        fetchQuotes();
      }
    } catch (error) {
      console.error('Error in updateQuoteStatus:', error);
    }
  };

  const updateQuoteStatusInState = (quoteId: string) => {
    console.log('updateQuoteStatusInState called for quoteId:', quoteId);
    
    // Find the quote in local state
    const quoteIndex = quotes.findIndex(q => q.id === quoteId);
    if (quoteIndex === -1) {
      console.log('Quote not found in local state');
      return;
    }

    // Get the quote's parts
    const quote = quotes[quoteIndex];
    console.log('Quote found:', quote);
    
    const partIds = quote.partRequested?.split(',').map((id: string) => id.trim()) || [];
    console.log('Part IDs for quote:', partIds);
    
    const quoteParts = parts.filter(part => partIds.includes(part.id));
    console.log('Quote parts found:', quoteParts);
    console.log('All parts available:', parts);

    // Calculate new status
    let newStatus: 'unpriced' | 'priced' | 'completed' = 'unpriced';
    if (quote.status === 'completed') {
      newStatus = 'completed';
    } else if (quoteParts.length > 0) {
      const hasPricedParts = quoteParts.some(part => part.price && part.price > 0);
      console.log('Has priced parts:', hasPricedParts);
      newStatus = hasPricedParts ? 'priced' : 'unpriced';
    }

    console.log('Calculated new status:', newStatus, 'Current status:', quote.status);

    // Update the quote in local state
    const updatedQuotes = [...quotes];
    updatedQuotes[quoteIndex] = { ...quote, status: newStatus };
    setQuotes(updatedQuotes);

    console.log('Updated quotes state');

    // Also update in database
    updateQuoteStatus(quoteId);
  };

  const updatePart = async (id: string, updates: Partial<Part>) => {
    console.log('updatePart called with id:', id, 'updates:', updates);
    
    const { data, error } = await supabase
      .from('parts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (!error) {
      console.log('Part updated successfully:', data);
      
      // Update parts immediately
      fetchParts();
      
      // Find which quote this part belongs to and update its status
      // Try different approaches to find quotes containing this part
      let quoteData = null;
      
      // First try: exact match
      const { data: exactMatches } = await supabase
        .from('quotes')
        .select('id, partRequested')
        .eq('partRequested', id);
      
      if (exactMatches && exactMatches.length > 0) {
        quoteData = exactMatches;
      } else {
        // Second try: contains the part ID
        const { data: containsMatches } = await supabase
          .from('quotes')
          .select('id, partRequested')
          .contains('partRequested', [id]);
        
        if (containsMatches && containsMatches.length > 0) {
          quoteData = containsMatches;
        } else {
          // Third try: like query
          const { data: likeMatches } = await supabase
            .from('quotes')
            .select('id, partRequested')
            .like('partRequested', `%${id}%`);
          
          quoteData = likeMatches;
        }
      }
      
      console.log('Found quotes containing this part:', quoteData);
      
      if (quoteData && quoteData.length > 0) {
        for (const quote of quoteData) {
          console.log('Updating status for quote:', quote.id);
          updateQuoteStatusInState(quote.id);
        }
      } else {
        console.log('No quotes found containing this part');
      }
    } else {
      console.error('Error updating part:', error);
    }
    return { data, error };
  };

  const markQuoteCompleted = async (id: string) => {
    const { error } = await supabase
      .from('quotes')
      .update({ status: 'completed' })
      .eq('id', id);
    
    if (error) {
      console.error('Mark completed error:', error);
    } else {
      fetchQuotes();
    }
    return { error };
  };

  const markQuoteAsOrdered = async (id: string, taxInvoiceNumber: string) => {
    const { error } = await supabase
      .from('quotes')
      .update({ 
        status: 'ordered',
        taxInvoiceNumber: taxInvoiceNumber
      })
      .eq('id', id);
    
    if (error) {
      console.error('Mark as ordered error:', error);
    } else {
      fetchQuotes();
    }
    return { error };
  };

  const markQuoteAsOrderedWithParts = async (id: string, taxInvoiceNumber: string, selectedPartIds: string[]) => {
    try {
      // First, get the current quote to find its parts
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', id)
        .single();
      
      if (quoteError) {
        console.error('Error fetching quote:', quoteError);
        return { error: quoteError };
      }
      
      // Get all parts for this quote
      const { data: allParts, error: partsError } = await supabase
        .from('parts')
        .select('*')
        .in('id', quoteData.partRequested.split(',').map((id: string) => id.trim()));
      
      if (partsError) {
        console.error('Error fetching parts:', partsError);
        return { error: partsError };
      }
      
      // Filter to only selected parts
      const selectedParts = allParts.filter(part => selectedPartIds.includes(part.id));
      
      // Create new part IDs string with only selected parts
      const newPartIds = selectedParts.map(part => part.id).join(',');
      
      // Update the quote with new parts list and order status
      const { error: updateError } = await supabase
        .from('quotes')
        .update({ 
          status: 'ordered',
          taxInvoiceNumber: taxInvoiceNumber,
          partRequested: newPartIds
        })
        .eq('id', id);
      
      if (updateError) {
        console.error('Mark as ordered error:', updateError);
        return { error: updateError };
      } else {
        fetchQuotes();
      }
      
      return { error: null };
    } catch (error) {
      console.error('Error in markQuoteAsOrderedWithParts:', error);
      return { error };
    }
  };

  const getActiveQuotes = () => {
    return quotes.filter(quote => quote.status !== 'completed' && quote.status !== 'ordered');
  };

  const getCompletedQuotes = () => {
    return quotes.filter(quote => quote.status === 'completed');
  };

  const updateMultipleParts = async (updates: Array<{ id: string; updates: Partial<Part> }>) => {
    console.log('updateMultipleParts called with updates:', updates);
    const results = [];
    const affectedQuoteIds = new Set<string>();
    
    for (const { id, updates: partUpdates } of updates) {
      console.log('Updating part:', id, 'with updates:', partUpdates);
      
      const { data, error } = await supabase
        .from('parts')
        .update(partUpdates)
        .eq('id', id)
        .select()
        .single();
      
      results.push({ id, data, error });
      
      // Find which quotes this part belongs to - use the same logic as updatePart
      let quoteData = null;
      
      // First try: exact match
      const { data: exactMatches } = await supabase
        .from('quotes')
        .select('id, partRequested')
        .eq('partRequested', id);
      
      if (exactMatches && exactMatches.length > 0) {
        quoteData = exactMatches;
      } else {
        // Second try: contains the part ID
        const { data: containsMatches } = await supabase
          .from('quotes')
          .select('id, partRequested')
          .contains('partRequested', [id]);
        
        if (containsMatches && containsMatches.length > 0) {
          quoteData = containsMatches;
        } else {
          // Third try: like query
          const { data: likeMatches } = await supabase
            .from('quotes')
            .select('id, partRequested')
            .like('partRequested', `%${id}%`);
          
          quoteData = likeMatches;
        }
      }
      
      console.log('Found quotes containing part', id, ':', quoteData);
      
      if (quoteData && quoteData.length > 0) {
        quoteData.forEach(quote => affectedQuoteIds.add(quote.id));
      }
    }
    
    if (!results.some(r => r.error)) {
      fetchParts();
      
      console.log('Updating status for affected quotes:', Array.from(affectedQuoteIds));
      
      // Update status for all affected quotes
      for (const quoteId of affectedQuoteIds) {
        updateQuoteStatusInState(quoteId);
      }
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
    markQuoteAsOrdered,
    markQuoteAsOrderedWithParts,
    getActiveQuotes,
    getCompletedQuotes,
  };
}; 