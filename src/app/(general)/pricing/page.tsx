'use client';

import { useQuotesQuery, useDeleteQuoteMutation, useUpdatePartInQuoteJsonMutation, queryKeys } from '@/hooks/queries/useQuotesQuery';
import { useAllQuoteParts } from '@/hooks/useAllQuoteParts';
import QuoteTable from "@/components/ui/QuoteTable";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PartWithVariants } from '@/types/part';

export default function PricingPage() {
  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  // Get quotes for pricing page with server-side pagination (10 per page)
  const { data: quotesData, isLoading: quotesLoading } = useQuotesQuery(currentPage, 10, { status: 'unpriced' });
  
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

  const updateMultipleParts = async (updates: Array<{ id: string; updates: any }>) => {
    // Find the quote that contains these parts
    const quote = quotesData?.quotes?.find(q => 
      q.parts_requested?.some((partItem: any) => 
        updates.some(update => update.id === partItem.part_id)
      )
    );
    
    if (!quote) {
      console.error('Quote not found for these parts');
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
        console.log('🎯 COMPLETED (Pricing Page): Tracking completion action for quote:', id);
        const { QuoteActionsService } = await import('@/services/quoteActions/quoteActionsService');
        await QuoteActionsService.trackQuoteAction(id, 'COMPLETED');
        console.log('✅ COMPLETED (Pricing Page): Successfully tracked completion action for quote:', id);
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
      return { data: result.data || null, error: result.error };
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
          pageSize={1}
          onPageChange={setCurrentPage}
        />
      </div>
    </ProtectedRoute>
  );
} 