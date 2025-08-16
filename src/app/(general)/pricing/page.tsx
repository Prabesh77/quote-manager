'use client';

import React from 'react';
import QuoteTable from '@/components/ui/QuoteTable';
import { useQuotes } from '@/hooks/useQuotesWithQuery';
import { Part } from '@/components/ui/useQuotes';

export default function PricingPage() {
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
  } = useQuotes();

  // Filter quotes to only show unpriced quotes (quotes that need initial pricing)
  const unpricedQuotes = quotes.filter(quote => {
    // Use the database status directly - much simpler and more reliable
    return quote.status === 'unpriced';
  });

  // Wrapper function to match QuoteTable's expected interface for updateQuote
  const handleUpdateQuote = async (id: string, fields: Record<string, any>): Promise<{ error: Error | null }> => {
    const result = await updateQuote(id, fields);
    return { error: result.error ? new Error(String(result.error)) : null };
  };

  // Wrapper function to match QuoteTable's expected interface
  const handleUpdatePart = async (id: string, updates: Partial<Part>): Promise<{ data: Part; error: Error | null }> => {
    const result = await updatePart(id, updates);
    if (result.error) {
      return { data: {} as Part, error: result.error };
    }
    return { data: result.data || {} as Part, error: null };
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading quotes...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Add Pricing</h1>
        <div className="text-sm text-gray-600">
          {unpricedQuotes.length} quote{unpricedQuotes.length !== 1 ? 's' : ''} awaiting pricing
        </div>
      </div>
      
      <QuoteTable
        quotes={unpricedQuotes}
        parts={parts}
        onUpdateQuote={handleUpdateQuote}
        onDeleteQuote={deleteQuote}
        onUpdatePart={handleUpdatePart}
        onUpdateMultipleParts={handleUpdateMultipleParts}
        onMarkCompleted={markQuoteCompleted}
        onMarkAsOrdered={markQuoteAsOrdered}
        showCompleted={false}
      />
    </div>
  );
} 