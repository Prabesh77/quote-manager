'use client';

import { useState, useEffect } from 'react';
import { 
  useQuotesQuery, 
  usePartsQuery, 
  useCreateQuoteMutation,
  useUpdateQuoteMutation, 
  useDeleteQuoteMutation, 
  useUpdatePartMutation,
  useAddPartMutation,
  useDeletePartMutation,

  useQuotePartsQuery,
  useUpdateQuotePartMutation
} from './queries/useQuotesQuery';
import { Quote, Part, QuotePartItem } from '@/components/ui/useQuotes';
import supabase from '@/utils/supabase';

type ConnectionStatus = 'checking' | 'connected' | 'error' | 'disconnected';

export const useQuotes = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');

  // Use TanStack Query hooks
  const quotesQuery = useQuotesQuery();
  const partsQuery = usePartsQuery();
  
  // Mutations
  const createQuoteMutation = useCreateQuoteMutation();
  const updateQuoteMutation = useUpdateQuoteMutation();
  const deleteQuoteMutation = useDeleteQuoteMutation();
  const updatePartMutation = useUpdatePartMutation();
  const addPartMutation = useAddPartMutation();
  const deletePartMutation = useDeletePartMutation();


  // Update connection status based on query states
  useEffect(() => {
    if (quotesQuery.error || partsQuery.error) {
      setConnectionStatus('error');
    } else if (quotesQuery.isSuccess && partsQuery.isSuccess) {
      setConnectionStatus('connected');
    } else if (quotesQuery.isLoading || partsQuery.isLoading) {
      setConnectionStatus('checking');
    }
  }, [quotesQuery.isSuccess, quotesQuery.isLoading, quotesQuery.error, partsQuery.isSuccess, partsQuery.isLoading, partsQuery.error]);

  // Determine loading state - show skeleton only on initial load when no data exists
  const isLoading = (quotesQuery.isLoading && !quotesQuery.data) || (partsQuery.isLoading && !partsQuery.data);

  // Get data with fallbacks - ensure we always return arrays
  const quotes = quotesQuery.data || [];
  const parts = partsQuery.data || [];

  // Legacy interface functions
  const createQuote = async (quoteData: any) => {
    try {
      const result = await createQuoteMutation.mutateAsync(quoteData);
      return { data: result, error: null };
    } catch (error) {
      console.error('❌ createQuote failed:', error);
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  const updateQuote = async (id: string, fields: Record<string, any>) => {
    try {
      await updateQuoteMutation.mutateAsync({ id, fields });
      return { error: null };
    } catch (error) {
      console.error('❌ updateQuote failed for quote:', id, 'error:', error);
      return { error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  const deleteQuote = async (id: string) => {
    try {
      await deleteQuoteMutation.mutateAsync(id);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  const updatePart = async (id: string, updates: Partial<Part>) => {
    try {
      const updatedPart = await updatePartMutation.mutateAsync({ id, updates });
      return { data: updatedPart, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  const addPart = async (partData: any) => {
    try {
      const newPart = await addPartMutation.mutateAsync(partData);
      return { data: newPart, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  const updateMultipleParts = async (updates: Array<{ id: string; updates: Partial<Part> }>) => {
    try {
      // Process updates sequentially to avoid race conditions
      const results = [];
      for (const { id, updates: partUpdates } of updates) {
        const result = await updatePartMutation.mutateAsync({ id, updates: partUpdates });
        results.push(result);
      }
      return { data: results, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  const deletePart = async (id: string) => {
    try {
      await deletePartMutation.mutateAsync(id);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  const markQuoteCompleted = async (id: string) => {
    return updateQuote(id, { status: 'completed' });
  };

  const markQuoteAsOrdered = async (id: string, taxInvoiceNumber: string) => {
    return updateQuote(id, { status: 'ordered', tax_invoice_number: taxInvoiceNumber });
  };

  const markQuoteAsOrderedWithParts = async (id: string, taxInvoiceNumber: string, selectedPartIds: string[]) => {
    try {
      
      // If no parts selected, mark entire quote as ordered
      if (!selectedPartIds || selectedPartIds.length === 0) {
        return updateQuote(id, { status: 'ordered', tax_invoice_number: taxInvoiceNumber });
      }
      
      // Get the quote to check which structure it uses
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('parts_requested')
        .eq('id', id)
        .single();
      
      if (quoteError) {
        console.error('❌ Error fetching quote:', quoteError);
        return { error: quoteError };
      }
      
      if (quote?.parts_requested && Array.isArray(quote.parts_requested)) {
        
        const currentParts = quote.parts_requested as QuotePartItem[];
        const selectedParts = currentParts.filter((p: QuotePartItem) => selectedPartIds.includes(p.part_id));
        
        if (selectedParts.length === 0) {
          console.error('❌ No selected parts found in quote');
          return { error: new Error('No selected parts found in quote') };
        }
        
        
        // Update the quote with only selected parts and mark as ordered using TanStack Query
        const result = await updateQuote(id, {
          parts_requested: selectedParts,
          status: 'ordered',
          tax_invoice_number: taxInvoiceNumber
        });
        
        if (result.error) {
          console.error('❌ Error updating quote with selected parts:', result.error);
          return { error: result.error };
        }
        
        return { error: null };
        
      } else {
        
        // Get all quote_parts for this quote
        const { data: allQuoteParts, error: fetchError } = await supabase
          .from('quote_parts')
          .select('*')
          .eq('quote_id', id);
        
        if (fetchError) {
          console.error('❌ Error fetching quote parts:', fetchError);
          return { error: fetchError };
        }
        
        if (!allQuoteParts || allQuoteParts.length === 0) {
          console.error('❌ No parts found for quote');
          return { error: new Error('No parts found for quote') };
        }
        
        // Separate selected and unselected parts
        const selectedQuoteParts = allQuoteParts.filter((qp: any) => selectedPartIds.includes(qp.part_id));
        const unselectedQuoteParts = allQuoteParts.filter((qp: any) => !selectedPartIds.includes(qp.part_id));
        
        
        // Remove unselected parts from the quote
        if (unselectedQuoteParts.length > 0) {
          const unselectedQuotePartIds = unselectedQuoteParts.map((qp: any) => qp.id);
          const { error: deleteError } = await supabase
            .from('quote_parts')
            .delete()
            .in('id', unselectedQuotePartIds);
          
          if (deleteError) {
            console.error('❌ Error removing unselected parts:', deleteError);
            return { error: deleteError };
          }
          
        }
        
        // Mark the quote as ordered
        const result = await updateQuote(id, { status: 'ordered', tax_invoice_number: taxInvoiceNumber });
        
        return result;
      }
      
    } catch (error) {
      console.error('❌ Error in markQuoteAsOrderedWithParts:', error);
      return { error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  const fetchQuotes = async () => {
    // With TanStack Query, this is handled automatically
    // Just trigger a refetch if needed
    await quotesQuery.refetch();
  };

  const fetchParts = async () => {
    // With TanStack Query, this is handled automatically
    // Just trigger a refetch if needed
    await partsQuery.refetch();
  };

  return {
    quotes,
    parts,
    connectionStatus,
    isLoading,
    createQuote,
    updateQuote,
    deleteQuote,
    updatePart,
    updateMultipleParts,
    addPart,
    deletePart,
    fetchQuotes,
    fetchParts,
    markQuoteCompleted,
    markQuoteAsOrdered,
    markQuoteAsOrderedWithParts,
    // Additional TanStack Query specific properties for advanced usage
    quotesQuery,
    partsQuery,
    isRefetching: quotesQuery.isFetching || partsQuery.isFetching,
    error: quotesQuery.error || partsQuery.error,
  };
}; 