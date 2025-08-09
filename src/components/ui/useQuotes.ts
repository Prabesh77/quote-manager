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
  requiredBy?: string; // Deadline field
  customer?: string; // Customer name
  address?: string; // Customer address
  phone?: string; // Customer phone
  status: 'active' | 'completed' | 'unpriced' | 'priced' | 'ordered' | 'delivered'; // Updated status field
  taxInvoiceNumber?: string; // Tax invoice number for orders
  [key: string]: any; // Allow string indexing
}

export const useQuotes = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [isLoading, setIsLoading] = useState(true); // Add loading state

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
      requiredBy: 'string',
      customer: 'string',
      address: 'string',
      phone: 'string',
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
    try {
      setIsLoading(true);
      // Get normalized quotes with customer and vehicle details
      const { data: normalizedQuotes, error: quotesError } = await supabase
        .from('quotes')
        .select(`
          *,
          customer:customers(*),
          vehicle:vehicles(*)
        `)
        .order('created_at', { ascending: false });

      if (quotesError) {
        console.error('Error fetching normalized quotes:', quotesError);
        setConnectionStatus('error');
        return;
      }

      // Get all quote parts with part details
      const { data: quoteParts, error: partsError } = await supabase
        .from('quote_parts')
        .select(`
          *,
          part:parts(*)
        `);

      if (partsError) {
        console.error('Error fetching quote parts:', partsError);
        setConnectionStatus('error');
        return;
      }

      console.log('Normalized quotes found:', normalizedQuotes?.length || 0);
      console.log('Quote parts found:', quoteParts?.length || 0);

      // Convert normalized quotes to legacy format for QuoteTable compatibility
      const legacyQuotes: Quote[] = (normalizedQuotes || []).map(normalizedQuote => {
        // Get parts for this quote
        const quotePartsForThisQuote = (quoteParts || []).filter(qp => qp.quote_id === normalizedQuote.id);
        const partIds = quotePartsForThisQuote.map(qp => qp.part_id).join(',');

        // Debug: Log the vehicle data to see what's available
        console.log('Vehicle data for quote', normalizedQuote.id, ':', normalizedQuote.vehicle);

        const legacyQuote = {
          id: normalizedQuote.id,
          vin: normalizedQuote.vehicle?.vin || '',
          partRequested: partIds,
          quoteRef: `Q${normalizedQuote.id.slice(0, 8)}`, // Generate quote ref from ID
          createdAt: normalizedQuote.created_at,
          make: normalizedQuote.vehicle?.make || '',
          model: normalizedQuote.vehicle?.model || '',
          series: normalizedQuote.vehicle?.series || '',
          auto: normalizedQuote.vehicle?.transmission === 'auto', // Map transmission to auto boolean
          body: normalizedQuote.vehicle?.body || '', // Map body field correctly
          mthyr: normalizedQuote.vehicle?.year?.toString() || '',
          rego: normalizedQuote.vehicle?.rego || '',
          requiredBy: normalizedQuote.required_by || undefined,
          customer: normalizedQuote.customer?.name || '',
          address: normalizedQuote.customer?.address || '',
          phone: normalizedQuote.customer?.phone || '',
          status: normalizedQuote.status as Quote['status'],
          taxInvoiceNumber: normalizedQuote.tax_invoice_number || undefined,
        };

        console.log('Converted quote:', legacyQuote.id, 'with parts:', partIds);
        console.log('Body value:', legacyQuote.body);
        return legacyQuote;
      });

      console.log('Final legacy quotes:', legacyQuotes.length);
      setQuotes(legacyQuotes);
      setConnectionStatus('connected');
      console.log('Loaded normalized quotes:', legacyQuotes.length);
    } catch (error) {
      console.error('Error fetching normalized quotes:', error);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchParts = async () => {
    try {
      setIsLoading(true);
      const { data: normalizedParts, error } = await supabase
        .from('parts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching normalized parts:', error);
        return;
      }

      // Convert normalized parts to legacy format for QuoteTable compatibility
      const legacyParts: Part[] = (normalizedParts || []).map(part => ({
        id: part.id,
        name: part.part_name,
        number: part.part_number || '',
        price: part.price,
        note: part.note || '',
        createdAt: part.created_at,
      }));

      setParts(legacyParts);
      console.log('Loaded normalized parts:', legacyParts.length);
    } catch (error) {
      console.error('Error fetching normalized parts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time subscriptions
  useEffect(() => {
    
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
          // Refresh both quotes and parts since status depends on parts data
          fetchQuotes();
          fetchParts();
        }
      )
      .subscribe((status) => {
        // console.log('Quotes subscription status:', status);
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
          // Refresh both quotes and parts since status depends on parts data
          fetchQuotes();
          fetchParts();
        }
      )
      .subscribe((status) => {
        // console.log('Parts subscription status:', status);
      });

    // Initial data fetch
    fetchQuotes();
    fetchParts();
    testSupabaseConnection();

    // Cleanup subscriptions on unmount
    return () => {
      quotesSubscription.unsubscribe();
      partsSubscription.unsubscribe();
    };
  }, []);

  const addQuote = async (fields: Record<string, string>, partIds: string[]) => {
    // This function is kept for compatibility but should not be used
    // New quotes should be created using the normalized structure
    console.warn('addQuote called - use normalized quote creation instead');
    return { data: null, error: new Error('Use normalized quote creation') };
  };

  const updateQuote = async (id: string, fields: Record<string, string | number | boolean>) => {
    try {
      // Separate fields for different tables
      const quoteFields: Record<string, any> = {};
      const vehicleUpdateFields: Record<string, any> = {};
      const customerUpdateFields: Record<string, any> = {};
      
      // Define which fields go to which table
      const quoteOnlyFields = ['status', 'notes', 'tax_invoice_number', 'required_by'];
      const vehicleFieldNames = ['make', 'model', 'series', 'vin', 'rego', 'year', 'color', 'notes'];
      const customerFieldNames = ['name', 'phone', 'address'];
      
      Object.entries(fields).forEach(([key, value]) => {
        if (quoteOnlyFields.includes(key)) {
          quoteFields[key] = value;
        } else if (vehicleFieldNames.includes(key)) {
          // Map legacy field names to normalized field names
          const fieldMap: Record<string, string> = {
            'auto': 'transmission', // Map auto to transmission field
            'body': 'notes', // Map body to notes field
            'mthyr': 'year' // Map mthyr to year field
          };
          const normalizedKey = fieldMap[key] || key;
          vehicleUpdateFields[normalizedKey] = value;
        } else if (customerFieldNames.includes(key)) {
          customerUpdateFields[key] = value;
        }
      });

      // Get the quote to find related vehicle and customer IDs
      const { data: quote, error: fetchError } = await supabase
        .from('quotes')
        .select('vehicle_id, customer_id')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching quote for update:', fetchError);
        return { error: fetchError };
      }

      // Update quotes table if there are quote fields
      if (Object.keys(quoteFields).length > 0) {
        const { error: quoteError } = await supabase
          .from('quotes')
          .update(quoteFields)
          .eq('id', id);
        
        if (quoteError) {
          console.error('Error updating quote:', quoteError);
          return { error: quoteError };
        }
      }

      // Update vehicles table if there are vehicle fields
      if (Object.keys(vehicleUpdateFields).length > 0 && quote.vehicle_id) {
        const { error: vehicleError } = await supabase
          .from('vehicles')
          .update(vehicleUpdateFields)
          .eq('id', quote.vehicle_id);
        
        if (vehicleError) {
          console.error('Error updating vehicle:', vehicleError);
          return { error: vehicleError };
        }
      }

      // Update customers table if there are customer fields
      if (Object.keys(customerUpdateFields).length > 0 && quote.customer_id) {
        const { error: customerError } = await supabase
          .from('customers')
          .update(customerUpdateFields)
          .eq('id', quote.customer_id);
        
        if (customerError) {
          console.error('Error updating customer:', customerError);
          return { error: customerError };
        }
      }

      fetchQuotes();
      return { error: null };
    } catch (error) {
      console.error('Update quote error:', error);
      return { error };
    }
  };

  const addPart = async (partData: Omit<Part, 'id' | 'createdAt'>) => {
    // Convert legacy part format to normalized format
    const normalizedPart = {
      part_name: partData.name,
      part_number: partData.number,
      price: partData.price,
      note: partData.note,
      created_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase.from('parts').insert(normalizedPart).select();
    
    if (!error) {
      fetchParts();
    }
    return { data, error };
  };

  const updateQuoteStatus = async (quoteId: string) => {
    try {
      // Get the parts for this quote using the normalized structure
      const { data: quoteParts, error: quotePartsError } = await supabase
        .from('quote_parts')
        .select('part_id')
        .eq('quote_id', quoteId);

      if (quotePartsError) {
        console.error('Error fetching quote parts for status update:', quotePartsError);
        return;
      }

      if (!quoteParts || quoteParts.length === 0) {
        // No parts found, set status to unpriced
        const { error: updateError } = await supabase
          .from('quotes')
          .update({ status: 'unpriced' })
          .eq('id', quoteId);

        if (updateError) {
          console.error('Error updating quote status:', updateError);
        } else {
          fetchQuotes();
        }
        return;
      }

      // Get the part IDs
      const partIds = quoteParts.map(qp => qp.part_id);
      
      // Get the parts with their prices
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
        // Refresh quotes to update the UI immediately
        fetchQuotes();
      }
    } catch (error) {
      console.error('Error in updateQuoteStatus:', error);
    }
  };

  const updateQuoteStatusInState = (quoteId: string) => {
    
    // Find the quote in local state
    const quoteIndex = quotes.findIndex(q => q.id === quoteId);
    if (quoteIndex === -1) {
      return;
    }

    // Get the quote's parts
    const quote = quotes[quoteIndex];
    
    const partIds = quote.partRequested?.split(',').map((id: string) => id.trim()) || [];
    
    const quoteParts = parts.filter(part => partIds.includes(part.id));

    // Calculate new status
    let newStatus: 'unpriced' | 'priced' | 'completed' = 'unpriced';
    if (quote.status === 'completed') {
      newStatus = 'completed';
    } else if (quoteParts.length > 0) {
      const hasPricedParts = quoteParts.some(part => part.price && part.price > 0);
      newStatus = hasPricedParts ? 'priced' : 'unpriced';
    }

    // Update the quote in local state
    const updatedQuotes = [...quotes];
    updatedQuotes[quoteIndex] = { ...quote, status: newStatus };
    setQuotes(updatedQuotes);
    // Also update in database
    updateQuoteStatus(quoteId);
  };

  const updatePart = async (id: string, updates: Partial<Part>) => {
    // Convert legacy part format to normalized format
    const normalizedUpdates: any = {};
    if (updates.name !== undefined) normalizedUpdates.part_name = updates.name;
    if (updates.number !== undefined) normalizedUpdates.part_number = updates.number;
    if (updates.price !== undefined) normalizedUpdates.price = updates.price;
    if (updates.note !== undefined) normalizedUpdates.note = updates.note;
    
    const { data, error } = await supabase
      .from('parts')
      .update(normalizedUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (!error) {
      // Update parts immediately
      fetchParts();
      
      // Find which quotes this part belongs to using the normalized structure
      const { data: quoteParts, error: quotePartsError } = await supabase
        .from('quote_parts')
        .select('quote_id')
        .eq('part_id', id);
      
      if (!quotePartsError && quoteParts && quoteParts.length > 0) {
        // Get unique quote IDs
        const quoteIds = [...new Set(quoteParts.map(qp => qp.quote_id))];
        
        // Update status for each quote that contains this part
        for (const quoteId of quoteIds) {
          await updateQuoteStatus(quoteId);
        }
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
        tax_invoice_number: taxInvoiceNumber
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
      // Get all parts for this quote using the normalized structure
      const { data: quoteParts, error: quotePartsError } = await supabase
        .from('quote_parts')
        .select('part_id')
        .eq('quote_id', id);
      
      if (quotePartsError) {
        console.error('Error fetching quote parts:', quotePartsError);
        return { error: quotePartsError };
      }
      
      if (!quoteParts || quoteParts.length === 0) {
        console.error('No parts found for quote');
        return { error: new Error('No parts found for quote') };
      }
      
      // Get all parts for this quote
      const partIds = quoteParts.map(qp => qp.part_id);
      const { data: allParts, error: partsError } = await supabase
        .from('parts')
        .select('*')
        .in('id', partIds);
      
      if (partsError) {
        console.error('Error fetching parts:', partsError);
        return { error: partsError };
      }
      
      // Filter to only selected parts
      const selectedParts = allParts.filter(part => selectedPartIds.includes(part.id));
      
      // Update the quote with order status
      const { error: updateError } = await supabase
        .from('quotes')
        .update({
          status: 'ordered',
          tax_invoice_number: taxInvoiceNumber
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

  const getQuotesContainingPart = (partId: string): Quote[] => {
    return quotes.filter(quote => {
      const quoteParts = parts.filter(part => part.id === quote.id);
      return quoteParts.length > 0;
    });
  };

  const getActiveQuotes = (): Quote[] => {
    return quotes.filter(quote => quote.status !== 'completed' && quote.status !== 'ordered');
  };

  const getCompletedQuotes = (): Quote[] => {
    return quotes.filter(quote => quote.status === 'completed' || quote.status === 'ordered');
  };

  const updateMultipleParts = async (updates: Array<{ id: string; updates: Partial<Part> }>) => {
    const results = [];
    const affectedQuoteIds = new Set<string>();
    
    for (const { id, updates: partUpdates } of updates) {
      // Convert legacy part format to normalized format
      const normalizedUpdates: any = {};
      if (partUpdates.name !== undefined) normalizedUpdates.part_name = partUpdates.name;
      if (partUpdates.number !== undefined) normalizedUpdates.part_number = partUpdates.number;
      if (partUpdates.price !== undefined) normalizedUpdates.price = partUpdates.price;
      if (partUpdates.note !== undefined) normalizedUpdates.note = partUpdates.note;
      
      const { data, error } = await supabase
        .from('parts')
        .update(normalizedUpdates)
        .eq('id', id)
        .select()
        .single();
      
      results.push({ id, data, error });
      
      // Find which quotes this part belongs to using the normalized structure
      const { data: quoteParts, error: quotePartsError } = await supabase
        .from('quote_parts')
        .select('quote_id')
        .eq('part_id', id);
      
      if (!quotePartsError && quoteParts && quoteParts.length > 0) {
        // Add all quote IDs that contain this part
        quoteParts.forEach(qp => affectedQuoteIds.add(qp.quote_id));
      }
    }
    
    if (!results.some(r => r.error)) {
      fetchParts();
            
      // Update status for all affected quotes
      for (const quoteId of affectedQuoteIds) {
        await updateQuoteStatus(quoteId);
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
    setConnectionStatus('checking');
    
    const { data: testData, error: testError } = await supabase
      .from('quotes')
      .select('count')
      .limit(1);
    
    if (testError) {
      setConnectionStatus('error');
    } else {
      setConnectionStatus('connected');
    }
  };


  const checkTableStructure = async () => {
    
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .limit(1);
    
    if (error) {
      alert(`Table structure check failed: ${error.message}`);
    } else if (data && data.length > 0) {
      alert(`Table has columns: ${Object.keys(data[0]).join(', ')}`);
    } else {
      alert('Table is empty - no records found');
    }
  };

  return {
    quotes,
    parts,
    connectionStatus,
    isLoading,
    addQuote,
    updateQuote,
    deleteQuote,
    addPart,
    updatePart,
    updateMultipleParts,
    deletePart,
    fetchQuotes,
    fetchParts,
    markQuoteCompleted,
    markQuoteAsOrdered,
    markQuoteAsOrderedWithParts,
    getActiveQuotes,
    getCompletedQuotes,
  };
}; 