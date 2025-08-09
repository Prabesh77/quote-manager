'use client';

import { useState, useEffect } from 'react';
import { 
  useQuotesQuery, 
  usePartsQuery, 
  useUpdateQuoteMutation, 
  useDeleteQuoteMutation, 
  useUpdatePartMutation,
  useAddPartMutation,
  useDeletePartMutation,
  useUpdateMultiplePartsMutation,
  useQuotePartsQuery,
  useUpdateQuotePartMutation
} from './queries/useQuotesQuery';
import { Quote, Part } from '@/components/ui/useQuotes';
import supabase from '@/utils/supabase';

type ConnectionStatus = 'checking' | 'connected' | 'error' | 'disconnected';

export const useQuotes = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');

  // Use TanStack Query hooks
  const quotesQuery = useQuotesQuery();
  const partsQuery = usePartsQuery();
  
  // Mutations
  const updateQuoteMutation = useUpdateQuoteMutation();
  const deleteQuoteMutation = useDeleteQuoteMutation();
  const updatePartMutation = useUpdatePartMutation();
  const addPartMutation = useAddPartMutation();
  const deletePartMutation = useDeletePartMutation();
  const updateMultiplePartsMutation = useUpdateMultiplePartsMutation();

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

  // Get data with fallbacks
  const quotes = quotesQuery.data || [];
  const parts = partsQuery.data || [];

  // Legacy interface functions
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
      const updatedParts = await updateMultiplePartsMutation.mutateAsync(updates);
      return { data: updatedParts, error: null };
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
      console.log('📦 Marking quote as ordered with selected parts:', { id, selectedPartIds });
      
      // If no parts selected, mark entire quote as ordered
      if (!selectedPartIds || selectedPartIds.length === 0) {
        return updateQuote(id, { status: 'ordered', tax_invoice_number: taxInvoiceNumber });
      }
      
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
      
      console.log('📦 Selected parts:', selectedQuoteParts.length, 'Unselected parts:', unselectedQuoteParts.length);
      
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
        
        console.log('✅ Removed', unselectedQuoteParts.length, 'unselected parts from quote');
      }
      
      // Mark the quote as ordered
      const result = await updateQuote(id, { status: 'ordered', tax_invoice_number: taxInvoiceNumber });
      
      if (!result.error) {
        console.log('✅ Quote marked as ordered with', selectedQuoteParts.length, 'parts');
      }
      
      return result;
      
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