'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import supabase from '@/utils/supabase';
import { createNormalizedQuote, getQuoteWithDetails } from '@/utils/normalizedQuoteCreation';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  rego?: string;
  make: string;
  model: string;
  series?: string;
  year?: number;
  vin?: string;
  color?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  customer_id: string;
  vehicle_id: string;
  status: 'unpriced' | 'priced' | 'completed' | 'ordered' | 'delivered';
  notes?: string;
  tax_invoice_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Part {
  id: string;
  vehicle_id?: string;
  part_name: string;
  part_number?: string;
  price?: number;
  note?: string;
  created_at: string;
  updated_at: string;
}

export interface QuotePart {
  id: string;
  quote_id: string;
  part_id: string;
  final_price?: number;
  note?: string;
  status: 'WaitingForPrice' | 'Priced' | 'Ordered';
  created_at: string;
  updated_at: string;
}

export interface QuoteWithDetails {
  quote: Quote;
  customer: Customer;
  vehicle: Vehicle;
  quote_parts: Array<{
    quote_part: QuotePart;
    part: Part;
  }>;
}

export const useNormalizedQuotes = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [quoteParts, setQuoteParts] = useState<QuotePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  // Fetch all quotes with customer and vehicle details
  const fetchQuotes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .select(`
          *,
          customer:customers(*),
          vehicle:vehicles(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch quotes error:', error);
        setConnectionStatus('error');
        return;
      }

      setQuotes(data || []);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error fetching quotes:', error);
      setConnectionStatus('error');
    }
  }, []);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) {
        console.error('Fetch customers error:', error);
        return;
      }

      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  }, []);

  // Fetch vehicles
  const fetchVehicles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch vehicles error:', error);
        return;
      }

      setVehicles(data || []);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
  }, []);

  // Fetch parts
  const fetchParts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .order('part_name');

      if (error) {
        console.error('Fetch parts error:', error);
        return;
      }

      setParts(data || []);
    } catch (error) {
      console.error('Error fetching parts:', error);
    }
  }, []);

  // Fetch quote parts
  const fetchQuoteParts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('quote_parts')
        .select(`
          *,
          part:parts(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch quote parts error:', error);
        return;
      }

      setQuoteParts(data || []);
    } catch (error) {
      console.error('Error fetching quote parts:', error);
    }
  }, []);

  // Create normalized quote
  const createQuote = useCallback(async (quoteData: any) => {
    try {
      const result = await createNormalizedQuote(quoteData);
      
      // Refresh all data after successful creation
      await Promise.all([
        fetchQuotes(),
        fetchCustomers(),
        fetchVehicles(),
        fetchParts(),
        fetchQuoteParts()
      ]);
      
      return result;
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error; // Re-throw for caller to handle
    }
  }, [fetchQuotes, fetchCustomers, fetchVehicles, fetchParts, fetchQuoteParts]);

  // Get quote with full details
  const getQuoteDetails = useCallback(async (quoteId: string) => {
    return await getQuoteWithDetails(quoteId);
  }, []);

  // Memoized computed values
  const activeQuotes = useMemo(() => 
    quotes.filter(quote => quote.status !== 'completed' && quote.status !== 'ordered'), 
    [quotes]
  );

  const completedQuotes = useMemo(() => 
    quotes.filter(quote => quote.status === 'completed'), 
    [quotes]
  );

  const unpricedQuotes = useMemo(() => 
    quotes.filter(quote => quote.status === 'unpriced'), 
    [quotes]
  );

  const pricedQuotes = useMemo(() => 
    quotes.filter(quote => quote.status === 'priced'), 
    [quotes]
  );

  const orderedQuotes = useMemo(() => 
    quotes.filter(quote => quote.status === 'ordered'), 
    [quotes]
  );

  const deliveredQuotes = useMemo(() => 
    quotes.filter(quote => quote.status === 'delivered'), 
    [quotes]
  );

  // Initialize data loading
  useEffect(() => {
    let mounted = true;

    const loadAllData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchQuotes(),
          fetchCustomers(),
          fetchVehicles(),
          fetchParts(),
          fetchQuoteParts()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAllData();

    return () => {
      mounted = false;
    };
  }, [fetchQuotes, fetchCustomers, fetchVehicles, fetchParts, fetchQuoteParts]);

  return {
    // Data
    quotes,
    customers,
    vehicles,
    parts,
    quoteParts,
    
    // Computed values
    activeQuotes,
    completedQuotes,
    unpricedQuotes,
    pricedQuotes,
    orderedQuotes,
    deliveredQuotes,
    
    // State
    loading,
    connectionStatus,
    
    // Functions
    createQuote,
    getQuoteDetails,
    fetchQuotes,
    fetchCustomers,
    fetchVehicles,
    fetchParts,
    fetchQuoteParts,
  };
}; 