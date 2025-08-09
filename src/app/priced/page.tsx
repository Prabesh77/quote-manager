'use client';

import React from 'react';
import QuoteTable from '@/components/ui/QuoteTable';
import { useQuotes } from '@/hooks/useQuotesWithQuery';
import { Part } from '@/components/ui/useQuotes';

export default function PricedPage() {
  const {
    quotes,
    parts,
    updateQuote,
    deleteQuote,
    updatePart,
    updateMultipleParts,
    markQuoteCompleted,
    markQuoteAsOrdered,
    isLoading,
    isRefetching,
  } = useQuotes();

  // Filter quotes to only show priced ones
  const pricedQuotes = quotes.filter(quote => quote.status === 'priced');

  // Wrapper function to match QuoteTable's expected interface for updateQuote
  const handleUpdateQuote = async (id: string, fields: Record<string, any>): Promise<{ error: Error | null }> => {
    const result = await updateQuote(id, fields);
    return { error: result.error ? new Error(String(result.error)) : null };
  };

  // Wrapper function to match QuoteTable's expected interface
  const handleUpdatePart = async (id: string, updates: Partial<Part>): Promise<{ data: Part; error: Error | null }> => {
    const result = await updatePart(id, updates);
    if (result.error) {
      return { data: null as any, error: result.error };
    }
    return { data: result.data || null as any, error: null };
  };

  // Wrapper function for updateMultipleParts to match expected interface
  const handleUpdateMultipleParts = async (updates: Array<{ id: string; updates: Partial<Part> }>): Promise<void> => {
    try {
      await updateMultipleParts(updates);
    } catch (error) {
      console.error('Error updating multiple parts:', error);
      // The function expects void return, so we just log errors
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Priced Quotes</h1>
        <p className="mt-2 text-gray-600">View and manage quotes that have been verified and priced</p>
      </div>

      <QuoteTable
        quotes={pricedQuotes}
        parts={parts}
        onUpdateQuote={handleUpdateQuote}
        onDeleteQuote={deleteQuote}
        onUpdatePart={handleUpdatePart}
        onUpdateMultipleParts={handleUpdateMultipleParts}
        onMarkCompleted={markQuoteCompleted}
        onMarkAsOrdered={markQuoteAsOrdered}
        isLoading={isLoading}
        isRefetching={isRefetching}
      />
    </div>
  );
} 