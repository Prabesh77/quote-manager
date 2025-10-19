'use client';

import { useQuotesQuery, useDeleteQuoteMutation, useUpdatePartInQuoteJsonMutation, useUpdatePartsComprehensiveBatchMutation, queryKeys } from '@/hooks/queries/useQuotesQuery';
import { useAllQuoteParts } from '@/hooks/useAllQuoteParts';
import QuoteTable from '@/components/ui/QuoteTable';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useDebouncedSearchWithPageReset } from '@/hooks/useDebouncedSearch';

export default function CompletedQuotesPage() {
  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('single-quote-mode');
      return saved && JSON.parse(saved) ? 1 : 10;
    }
    return 10;
  });
  const queryClient = useQueryClient();
  
  // Date filter state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Search state with debouncing and page reset
  const { searchTerm, debouncedSearchTerm, setSearchTerm } = useDebouncedSearchWithPageReset(
    () => setCurrentPage(1)
  );

  // Get quotes for completed quotes page with server-side pagination
  const { data: quotesData, isLoading: quotesLoading } = useQuotesQuery(currentPage, pageSize, { 
    status: 'completed',
    search: debouncedSearchTerm,
    startDate: startDate || undefined,
    endDate: endDate || undefined
  });
  
  // Fetch parts for all quotes
  const { data: parts, isLoading: partsLoading } = useAllQuoteParts(quotesData?.quotes || []);
  
  // Use the actual mutations
  const deleteQuoteMutation = useDeleteQuoteMutation();
  const updatePartMutation = useUpdatePartInQuoteJsonMutation();
  const updatePartsComprehensiveBatchMutation = useUpdatePartsComprehensiveBatchMutation();

  // Update quote function - handles status updates and other quote fields
  const updateQuote = async (id: string, fields: Record<string, any>) => {
    try {
      // Import supabase client
      const supabase = (await import('@/utils/supabase')).default;
      
      // Update the quote
      const { error } = await supabase
        .from('quotes')
        .update(fields)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating quote:', error);
        return { error: new Error(error.message) };
      }
      
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: queryKeys.quotesBase });
      
      return { error: null };
    } catch (error) {
      console.error('Error updating quote:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
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
      return { data: null, error: new Error('Quote not found for this part') };
    }

    try {
      const result = await updatePartMutation.mutateAsync({ quoteId: quote.id, partId: id, updates });
      return { data: result.data, error: null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  const updateMultipleParts = async (updates: Array<{ id: string; updates: any }>, quoteId?: string, changeStatus: boolean = true) => {
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
          await updatePartMutation.mutateAsync({ quoteId: quote.id, partId: id, updates: partUpdates, changeStatus });
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
    try {
      // Import supabase client
      const supabase = (await import('@/utils/supabase')).default;
      
      // Update the quote status to ordered and add tax invoice number
      const { error } = await supabase
        .from('quotes')
        .update({ 
          status: 'ordered',
          tax_invoice_number: taxInvoiceNumber 
        })
        .eq('id', id);
      
      if (error) {
        console.error('Error marking quote as ordered:', error);
        return { error: new Error(error.message) };
      }
      
      // Invalidate queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: queryKeys.quotesBase });
      
      console.log('✅ Quote marked as ordered successfully');
      return { error: null };
    } catch (error) {
      console.error('Error marking quote as ordered:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
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

  const handleUpdateMultipleParts = async (updates: Array<{ id: string; updates: any }>, quoteId?: string, changeStatus: boolean = true): Promise<void> => {
    try {
      // Find the quote that contains these parts
      let quote;
      if (quoteId) {
        quote = quotesData?.quotes?.find(q => q.id === quoteId);
      } else {
        // Fallback: Find the quote that contains these parts
        quote = quotesData?.quotes?.find(q => 
          q.parts_requested?.some((partItem: any) => 
            updates.some(update => update.id === partItem.part_id)
          )
        );
      }
      
      if (!quote) {
        console.error('Quote not found for these parts');
        return;
      }

      // Use the comprehensive batch mutation to update all parts in a single operation
      await updatePartsComprehensiveBatchMutation.mutateAsync({ 
        quoteId: quote.id, 
        updates, 
        changeStatus 
      });
    } catch (error) {
      console.error('Error updating multiple parts:', error);
    }
  };

  // Handle page size change from Single/Multiple toggle
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  return (
    <ProtectedRoute allowedRoles={['quote_creator', 'price_manager', 'quality_controller', 'admin']}>
      <div className="py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Completed Quotes</h1>
        
        {/* Date Filter */}
        <div className="mb-2 inline-block bg-white rounded-lg border border-gray-200 px-4 py-2">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="uppercase px-2 py-1 border border-gray-300 rounded-sm text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setCurrentPage(1);
                }}
                className="uppercase px-2 py-1 border border-gray-300 rounded-sm text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>
        
        <QuoteTable
          quotes={quotesData?.quotes || []}
          parts={parts || []}
          onUpdateQuote={handleUpdateQuote}
          onDeleteQuote={deleteQuote}
          onUpdatePart={handleUpdatePart}
          onUpdateMultipleParts={handleUpdateMultipleParts}
          onMarkCompleted={markQuoteCompleted}
          onMarkAsOrdered={markQuoteAsOrdered}
          showCompleted={true}
          defaultFilter="priced"
          isLoading={quotesLoading || partsLoading}
          showPagination={true}
          // Server pagination props
          currentPage={currentPage}
          totalPages={quotesData?.totalPages || 1}
          total={quotesData?.total || 0}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
          // Server-side search props
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          useServerSideSearch={true}
          // Page identification
          currentPageName="completed-quotes"
        />
      </div>
    </ProtectedRoute>
  );
} 