'use client';

import { useQuotesQuery, useDeleteQuoteMutation, useUpdatePartInQuoteJsonMutation, queryKeys } from '@/hooks/queries/useQuotesQuery';
import { useAllQuoteParts } from '@/hooks/useAllQuoteParts';
import QuoteTable from "@/components/ui/QuoteTable";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDebouncedSearchWithPageReset } from '@/hooks/useDebouncedSearch';

export default function PricingPage() {
  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  
  // Search state with debouncing and page reset
  const { searchTerm, debouncedSearchTerm, setSearchTerm } = useDebouncedSearchWithPageReset(
    () => setCurrentPage(1)
  );

  // Get quotes for pricing page with server-side pagination (10 per page)
  const { data: quotesData, isLoading: quotesLoading } = useQuotesQuery(currentPage, 10, { 
    status: 'unpriced',
    search: debouncedSearchTerm 
  });
  
  // Fetch parts for all quotes
  const { data: parts, isLoading: partsLoading } = useAllQuoteParts(quotesData?.quotes || []);
  

  
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
    // Find the quote that contains this part
    const quote = quotesData?.quotes?.find(q => 
      q.parts_requested?.some((partItem: any) => partItem.part_id === id)
    );
    
    if (!quote) {
      return { data: {} as any, error: new Error('Quote not found for this part') };
    }


    try {
      const result = await updatePartMutation.mutateAsync({ quoteId: quote.id, partId: id, updates });
      return { data: result.data, error: null };
    } catch (error) {
      return { data: {} as any, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  const updateMultipleParts = async (updates: Array<{ id: string; updates: any }>, quoteId?: string) => {
    let quote;
    
    if (quoteId) {
      // If quoteId is provided, use it directly (more reliable)
      quote = quotesData?.quotes?.find(q => q.id === quoteId);
    } else {
      // Fallback: Find the quote that contains these parts
      quote = quotesData?.quotes?.find(q => 
        q.parts_requested?.some((partItem: any) => 
          updates.some(update => update.id === partItem.part_id)
        )
      );

      // If no quote found with parts_requested, try to find by checking if we're editing parts
      // This handles the case where parts_requested might be empty but we're still editing
      if (!quote && quotesData?.quotes?.length === 1) {
        // If there's only one quote on the pricing page, it's likely the one we're editing
        quote = quotesData.quotes[0];
      }
    }
    
    if (!quote) {
      console.error('❌ Quote not found for these parts');
      console.error('❌ Part IDs being searched:', updates.map(u => u.id));
      console.error('❌ Available quotes and their parts:', quotesData?.quotes?.map(q => ({
        quoteId: q.id,
        parts: q.parts_requested?.map((p: any) => p.part_id) || []
      })));
      return;
    }

    try {
      // Update each part individually using the mutation
      for (const { id, updates: partUpdates } of updates) {
        try {
          await updatePartMutation.mutateAsync({ quoteId: quote.id, partId: id, updates: partUpdates });
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
        const { QuoteActionsService } = await import('@/services/quoteActions/quoteActionsService');
        await QuoteActionsService.trackQuoteAction(id, 'COMPLETED');
      } catch (trackingError) {
        console.warn('Failed to track quote completion:', trackingError);
        // Don't fail the operation if tracking fails
      }
      
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: queryKeys.quotesBase });
      
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
      return { data: result.data || null, error: result.error };
    }
    return { data: result.data || null, error: null };
  };

  const handleUpdateMultipleParts = async (updates: Array<{ id: string; updates: any }>, quoteId?: string): Promise<void> => {
    try {
      await updateMultipleParts(updates, quoteId);
    } catch (error) {
      console.error('❌ Pricing Page - Error in handleUpdateMultipleParts wrapper:', error);
      throw error; // Re-throw to maintain error handling
    }
  };

  return (
    <ProtectedRoute allowedRoles={['price_manager', 'quality_controller', 'admin']}>
      <div className="py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Quote Pricing</h1>
        <p className="text-gray-600 mb-6">Price pending quotes that need initial pricing.</p>

        {(() => { 
          
          return null; 
        })()}
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
          defaultFilter="unpriced"
          isLoading={quotesLoading || partsLoading}
          showPagination={true}
          // Server pagination props
          currentPage={currentPage}
          totalPages={quotesData?.totalPages || 1}
          total={quotesData?.total || 0}
          pageSize={10}
          onPageChange={setCurrentPage}
          // Server-side search props
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          useServerSideSearch={true}
        />
      </div>
    </ProtectedRoute>
  );
} 