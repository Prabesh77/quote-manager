'use client';

import { useQuotesQuery, useDeleteQuoteMutation, useQuotePartsFromJson, useUpdatePartInQuoteJsonMutation, queryKeys } from '@/hooks/queries/useQuotesQuery';
import QuoteTable from '@/components/ui/QuoteTable';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export default function OrdersPage() {
  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // Get quotes for orders page with server-side pagination (10 per page)
  const { data: quotesData, isLoading: quotesLoading } = useQuotesQuery(currentPage, 10, { status: 'ordered' });
  
  // Get the current quote ID for fetching only related parts
  const currentQuoteId = quotesData?.quotes?.[0]?.id;
  
  // Fetch only parts related to the current quote from parts_requested JSON column
  const { data: parts, isLoading: partsLoading } = useQuotePartsFromJson(currentQuoteId || '');
  
  // Use the actual mutations
  const deleteQuoteMutation = useDeleteQuoteMutation();
  const updatePartMutation = useUpdatePartInQuoteJsonMutation();

  // Placeholder functions for now - these will need to be implemented with the new API
  const updateQuote = async (id: string, fields: Record<string, any>) => {
    // TODO: Implement with new API
    return { error: new Error('Not implemented yet') };
  };

  const deleteQuote = async (id: string) => {
    try {
      await deleteQuoteMutation.mutateAsync(id);
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  const updatePart = async (id: string, updates: any) => {
    if (!currentQuoteId) {
      return { data: null, error: new Error('No quote selected') };
    }

    try {
      const result = await updatePartMutation.mutateAsync({ quoteId: currentQuoteId, partId: id, updates });
      return { data: result.data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  const updateMultipleParts = async (updates: Array<{ id: string; updates: any }>) => {
    if (!currentQuoteId) {
      console.error('No quote selected for multiple parts update');
      return;
    }

    try {
      // Update each part individually using the mutation
      for (const { id, updates: partUpdates } of updates) {
        try {
          await updatePartMutation.mutateAsync({ quoteId: currentQuoteId, partId: id, updates: partUpdates });
        } catch (error) {
          console.error(`❌ Error updating part ${id}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Error in updateMultipleParts:', error);
    }
  };

  const markQuoteCompleted = async (id: string) => {
    try {
      // Import supabase client
      const supabase = (await import('@/utils/supabase')).default;
      
      // Update the quote status to completed
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'completed' })
        .eq('id', id);
      
      if (error) {
        console.error('Error marking quote as completed:', error);
        return { error: new Error(error.message) };
      }
      
      // Track quote completion action
      try {
        console.log('🎯 COMPLETED (Orders Page): Tracking completion action for quote:', id);
        const { QuoteActionsService } = await import('@/services/quoteActions/quoteActionsService');
        await QuoteActionsService.trackQuoteAction(id, 'COMPLETED');
        console.log('✅ COMPLETED (Orders Page): Successfully tracked completion action for quote:', id);
      } catch (trackingError) {
        console.warn('Failed to track quote completion:', trackingError);
        // Don't fail the operation if tracking fails
      }
      
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: queryKeys.quotesBase });
      
      console.log('✅ Quote marked as completed successfully');
      return { error: null };
    } catch (error) {
      console.error('Error marking quote as completed:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  const markQuoteAsOrdered = async (id: string, taxInvoiceNumber: string) => {
    // TODO: Implement with new API
    return { error: new Error('Not implemented yet') };
  };

  // Wrapper functions to match QuoteTable's expected interface
  const handleUpdateQuote = async (id: string, fields: Record<string, any>): Promise<{ error: Error | null }> => {
    const result = await updateQuote(id, fields);
    return { error: result.error ? new Error(String(result.error)) : null };
  };

  const handleUpdatePart = async (id: string, updates: any): Promise<{ data: any; error: Error | null }> => {
    const result = await updatePart(id, updates);
    if (result.error) {
      return { data: null, error: result.error };
    }
    return { data: result.data || null, error: null };
  };

  const handleUpdateMultipleParts = async (updates: Array<{ id: string; updates: any }>): Promise<void> => {
    try {
      await updateMultipleParts(updates);
    } catch (error) {
      console.error('Error updating multiple parts:', error);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['quote_creator', 'price_manager', 'quality_controller', 'admin']}>
      <div className="py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Ordered Quotes</h1>
        <p className="text-gray-600 mb-6">View and manage ordered quotes.</p>
        <QuoteTable
          quotes={quotesData?.quotes || []}
          parts={parts || []}
          onUpdateQuote={handleUpdateQuote}
          onDeleteQuote={deleteQuote}
          onUpdatePart={handleUpdatePart}
          onUpdateMultipleParts={handleUpdateMultipleParts}
          onMarkCompleted={markQuoteCompleted}
          onMarkAsOrdered={markQuoteAsOrdered}
          showCompleted={false}
          defaultFilter="priced"
          isLoading={quotesLoading || partsLoading}
          showPagination={true}
          // Server pagination props
          currentPage={currentPage}
          totalPages={quotesData?.totalPages || 1}
          total={quotesData?.total || 0}
          pageSize={1}
          onPageChange={setCurrentPage}
        />
      </div>
    </ProtectedRoute>
  );
} 