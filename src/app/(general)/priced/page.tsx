'use client';

import React from 'react';
import { useQuotes } from '@/hooks/useQuotesWithQuery';
import QuoteTable from '@/components/ui/QuoteTable';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';

export default function PricedPage() {
  const { quotes, parts, updateQuote, deleteQuote, updatePart, updateMultipleParts, markQuoteCompleted, markQuoteAsOrdered } = useQuotes();

  // Filter quotes to only show priced quotes
  const pricedQuotes = quotes.filter(quote => quote.status === 'priced');

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
    <ProtectedRoute allowedRoles={['quote_creator', 'price_manager', 'admin']}>
      <div className="py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Priced Quotes</h1>
        <QuoteTable
          quotes={pricedQuotes}
          parts={parts}
          onUpdateQuote={handleUpdateQuote}
          onDeleteQuote={deleteQuote}
          onUpdatePart={handleUpdatePart}
          onUpdateMultipleParts={handleUpdateMultipleParts}
          onMarkCompleted={markQuoteCompleted}
          onMarkAsOrdered={markQuoteAsOrdered}
          showCompleted={false}
          defaultFilter="priced"
          isLoading={false}
        />
      </div>
    </ProtectedRoute>
  );
} 