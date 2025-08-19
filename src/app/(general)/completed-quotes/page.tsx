'use client';

import { useQuotesQuery, useDeleteQuoteMutation } from '@/hooks/queries/useQuotesQuery';
import { usePartsQuery } from '@/hooks/queries/useQuotesQuery';
import QuoteTable from '@/components/ui/QuoteTable';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { useState } from 'react';

export default function CompletedQuotesPage() {
  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Get quotes for completed quotes page with server-side pagination (1 per page)
  const { data: quotesData, isLoading: quotesLoading } = useQuotesQuery(currentPage, 1, { status: 'completed' });
  const { data: parts, isLoading: partsLoading } = usePartsQuery();
  
  // Use the actual delete quote mutation
  const deleteQuoteMutation = useDeleteQuoteMutation();

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
    // TODO: Implement with new API
    return { data: null, error: new Error('Not implemented yet') };
  };

  const updateMultipleParts = async (updates: Array<{ id: string; updates: any }>) => {
    // TODO: Implement with new API
    console.log('Update multiple parts:', updates);
  };

  const markQuoteCompleted = async (id: string) => {
    // TODO: Implement with new API
    return { error: new Error('Not implemented yet') };
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Completed Quotes</h1>
        <p className="text-gray-600 mb-6">View and manage completed quotes.</p>
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
          pageSize={1}
          onPageChange={setCurrentPage}
        />
      </div>
    </ProtectedRoute>
  );
} 