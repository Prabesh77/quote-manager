'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  partRequested: string;
  quoteRef: string;
  createdAt: string;
  make: string;
  model: string;
  series: string;
  auto: boolean;
  body: string;
  mthyr: string;
  rego: string;
  requiredBy?: string;
  customer?: string;
  address?: string;
  phone?: string;
  status: 'active' | 'completed' | 'unpriced' | 'priced' | 'ordered' | 'delivered';
  taxInvoiceNumber?: string;
  pc_parts?: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  invalidate(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const useOptimizedQuotes = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  
  const cache = useMemo(() => new DataCache(), []);

  // Optimized fetch with caching
  const fetchQuotes = useCallback(async (forceRefresh = false) => {
    const cacheKey = 'quotes';
    const cached = cache.get<Quote[]>(cacheKey);
    
    if (!forceRefresh && cached) {
      setQuotes(cached);
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      
      const quotesData = data || [];
      cache.set(cacheKey, quotesData);
      setQuotes(quotesData);
      setConnectionStatus('connected');
      return quotesData;
    } catch (error) {
      console.error('Fetch quotes error:', error);
      setConnectionStatus('error');
      return [];
    }
  }, [cache]);

  const fetchParts = useCallback(async (forceRefresh = false) => {
    const cacheKey = 'parts';
    const cached = cache.get<Part[]>(cacheKey);
    
    if (!forceRefresh && cached) {
      setParts(cached);
      return cached;
    }

    try {
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      
      const partsData = data || [];
      cache.set(cacheKey, partsData);
      setParts(partsData);
      return partsData;
    } catch (error) {
      console.error('Fetch parts error:', error);
      return [];
    }
  }, [cache]);

  // Initial load (realtime is now handled by RealtimeProvider)
  useEffect(() => {
    let mounted = true;

    // Initial load
    Promise.all([fetchQuotes(), fetchParts()]).finally(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [fetchQuotes, fetchParts]);

  // Optimized quote operations
  const addQuote = useCallback(async (fields: Record<string, string>, partIds: string[]) => {
    const partRequested = partIds.join(',');
    
    try {
      const { data, error } = await supabase
        .from('quotes')
        .insert({
          ...fields,
          partRequested,
          createdAt: new Date().toISOString(),
          status: 'unpriced',
        })
        .select()
        .single();

      if (error) throw error;
      
      // Optimistic update
      setQuotes(prev => [data, ...prev]);
      cache.invalidate('quotes');
      
      return { data, error: null };
    } catch (error) {
      console.error('Add quote error:', error);
      return { data: null, error };
    }
  }, [cache]);

  const updateQuote = useCallback(async (id: string, fields: Record<string, any>) => {
    try {
      const { data, error } = await supabase
        .from('quotes')
        .update(fields)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      // Optimistic update
      setQuotes(prev => prev.map(q => q.id === id ? data : q));
      cache.invalidate('quotes');
      
      return { data, error: null };
    } catch (error) {
      console.error('Update quote error:', error);
      return { data: null, error };
    }
  }, [cache]);

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

  return {
    quotes,
    parts,
    activeQuotes,
    completedQuotes,
    unpricedQuotes,
    pricedQuotes,
    loading,
    connectionStatus,
    addQuote,
    updateQuote,
    fetchQuotes,
    fetchParts,
    cache
  };
}; 