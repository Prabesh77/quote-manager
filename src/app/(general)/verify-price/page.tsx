'use client';

import React from 'react';
import QuoteTable from '@/components/ui/QuoteTable';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { useQuotesQuery } from '@/hooks/queries/useQuotesQuery';
import { usePartsQuery } from '@/hooks/queries/useQuotesQuery';

export default function VerifyPricePage() {
  // Get all quotes for verify price page (no pagination needed here)
  const { data: quotesData, isLoading: quotesLoading } = useQuotesQuery(1, 1000); // Get all quotes
  const { data: parts, isLoading: partsLoading } = usePartsQuery();
  
  // Filter quotes to only show quotes that need verification
  const quotesToVerify = quotesData?.quotes?.filter(quote => quote.status === 'priced') || [];

  // Placeholder functions for now - these will need to be implemented with the new API
  const updateQuote = async (id: string, fields: Record<string, any>) => {
    // TODO: Implement with new API
    return { error: new Error('Not implemented yet') };
  };

  const deleteQuote = async (id: string) => {
    // TODO: Implement with new API
    return { error: new Error('Not implemented yet') };
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
    <ProtectedRoute allowedRoles={['quality_controller', 'admin']}>
      <div className="py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Verify Price</h1>
        <QuoteTable
          quotes={quotesToVerify}
          parts={parts || []}
          onUpdateQuote={handleUpdateQuote}
          onDeleteQuote={deleteQuote}
          onUpdatePart={handleUpdatePart}
          onUpdateMultipleParts={handleUpdateMultipleParts}
          onMarkCompleted={markQuoteCompleted}
          onMarkAsOrdered={markQuoteAsOrdered}
          showCompleted={false}
          isLoading={quotesLoading || partsLoading}
        />
      </div>
    </ProtectedRoute>
  );
} 