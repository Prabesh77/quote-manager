'use client';

import { useState, useEffect, useCallback } from 'react';
import { Quote, QuoteUpdateData } from '@/types/quote';
import { Part } from '@/types/part';
import { ConnectionStatus } from '@/types/common';
import { QuoteService } from '@/services/quotes/quoteService';
import { PartService } from '@/services/parts/partService';
import supabase from '@/utils/supabase';

export const useQuotes = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch quotes with error handling
  const fetchQuotes = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await QuoteService.fetchQuotes();
      
      if (result.error) {
        console.error('Error fetching quotes:', result.error);
        setConnectionStatus('error');
        return;
      }

      setQuotes(result.data || []);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error fetching quotes:', error);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch parts with error handling
  const fetchParts = useCallback(async () => {
    try {
      const result = await PartService.fetchParts();
      
      if (result.error) {
        console.error('Error fetching parts:', result.error);
        return;
      }

      setParts(result.data || []);
    } catch (error) {
      console.error('Error fetching parts:', error);
    }
  }, []);

  // Update quote
  const updateQuote = useCallback(async (id: string, fields: QuoteUpdateData) => {
    try {
      const result = await QuoteService.updateQuote(id, fields);
      
      if (result.error) {
        console.error('Error updating quote:', result.error);
        return { error: result.error instanceof Error ? result.error : new Error(result.error) };
      }

      // Refresh quotes after update
      await fetchQuotes();
      return { error: null };
    } catch (error) {
      console.error('Error updating quote:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }, [fetchQuotes]);

  // Delete quote
  const deleteQuote = useCallback(async (id: string) => {
    try {
      const result = await QuoteService.deleteQuote(id);
      
      if (result.error) {
        console.error('Error deleting quote:', result.error);
        return { error: result.error instanceof Error ? result.error : new Error(result.error) };
      }

      // Refresh quotes after deletion
      await fetchQuotes();
      return { error: null };
    } catch (error) {
      console.error('Error deleting quote:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }, [fetchQuotes]);

  // Mark quote as completed
  const markQuoteCompleted = useCallback(async (id: string) => {
    try {
      const result = await QuoteService.markQuoteCompleted(id);
      
      if (result.error) {
        console.error('Error marking quote as completed:', result.error);
        return { error: result.error instanceof Error ? result.error : new Error(result.error) };
      }

      // Refresh quotes after update
      await fetchQuotes();
      return { error: null };
    } catch (error) {
      console.error('Error marking quote as completed:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }, [fetchQuotes]);

  // Mark quote as ordered
  const markQuoteAsOrdered = useCallback(async (id: string, taxInvoiceNumber: string) => {
    try {
      const result = await QuoteService.markQuoteAsOrdered(id, taxInvoiceNumber);
      
      if (result.error) {
        console.error('Error marking quote as ordered:', result.error);
        return { error: result.error instanceof Error ? result.error : new Error(result.error) };
      }

      // Refresh quotes after update
      await fetchQuotes();
      return { error: null };
    } catch (error) {
      console.error('Error marking quote as ordered:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }, [fetchQuotes]);

  // Verify quote price (boss approval)
  const verifyQuotePrice = useCallback(async (id: string) => {
    try {
      const result = await QuoteService.verifyQuotePrice(id);
      
      if (result.error) {
        console.error('Error verifying quote price:', result.error);
        return { error: result.error instanceof Error ? result.error : new Error(result.error) };
      }

      // Refresh quotes after update
      await fetchQuotes();
      return { error: null };
    } catch (error) {
      console.error('Error verifying quote price:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }, [fetchQuotes]);

  // Update part
  const updatePart = useCallback(async (id: string, updates: Partial<Part>) => {
    try {
      const result = await PartService.updatePart(id, updates);
      
      if (result.error) {
        console.error('Error updating part:', result.error);
        return { data: null, error: result.error instanceof Error ? result.error : new Error(result.error) };
      }

      // Refresh parts after update
      await fetchParts();
      return { data: result.data, error: null };
    } catch (error) {
      console.error('Error updating part:', error);
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }, [fetchParts]);

  // Update multiple parts
  const updateMultipleParts = useCallback(async (updates: Array<{ id: string; updates: Partial<Part> }>) => {
    try {
      const result = await PartService.updateMultipleParts(updates);
      
      if (result.error) {
        console.error('Error updating multiple parts:', result.error);
        return { error: result.error instanceof Error ? result.error : new Error(result.error) };
      }

      // Refresh parts after update
      await fetchParts();
    } catch (error) {
      console.error('Error updating multiple parts:', error);
      throw error instanceof Error ? error : new Error('Unknown error');
    }
  }, [fetchParts]);

  // Initial data fetch (realtime is now handled by RealtimeProvider)
  useEffect(() => {
    fetchQuotes();
    fetchParts();
  }, [fetchQuotes, fetchParts]);

  return {
    quotes,
    parts,
    connectionStatus,
    isLoading,
    updateQuote,
    deleteQuote,
    markQuoteCompleted,
    markQuoteAsOrdered,
    verifyQuotePrice,
    updatePart,
    updateMultipleParts,
    fetchQuotes,
    fetchParts,
  };
}; 