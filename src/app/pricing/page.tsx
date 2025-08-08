'use client';

import React from 'react';
import QuoteTable from '@/components/quotes/QuoteTable';
import { useQuotes } from '@/hooks/quotes/useQuotes';
import { Part } from '@/types/part';

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
  } = useQuotes();

  // Filter to only show unpriced quotes
  const getQuoteParts = (partRequested: string): Part[] => {
    if (!partRequested) return [];
    const partIds = partRequested.split(',').filter(id => id.trim());
    return parts.filter(part => partIds.includes(part.id));
  };

  const getQuoteStatus = (quoteParts: Part[], quoteStatus?: string): string => {
    if (quoteStatus === 'completed' || quoteStatus === 'ordered' || quoteStatus === 'delivered') {
      return quoteStatus;
    }
    
    // If quote status is explicitly set to waiting_verification or priced, use that
    if (quoteStatus === 'waiting_verification' || quoteStatus === 'priced') {
      return quoteStatus;
    }
    
    if (quoteParts.length === 0) return 'unpriced';
    
    const allPartsPriced = quoteParts.every(part => part.price && part.price > 0);
    return allPartsPriced ? 'waiting_verification' : 'unpriced';
  };

  // Filter quotes to only show unpriced ones
  const unpricedQuotes = quotes.filter(quote => {
    const quoteParts = getQuoteParts(quote.partRequested);
    const status = getQuoteStatus(quoteParts, quote.status);
    return status === 'unpriced';
  });

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
        <h1 className="text-3xl font-bold text-gray-900">Pricing Dashboard</h1>
        <p className="mt-2 text-gray-600">Add prices to quotes that are waiting for pricing</p>
      </div>

      <QuoteTable
        quotes={unpricedQuotes}
        parts={parts}
        onUpdateQuote={updateQuote}
        onDeleteQuote={deleteQuote}
        onUpdatePart={handleUpdatePart}
        onUpdateMultipleParts={handleUpdateMultipleParts}
        onMarkCompleted={markQuoteCompleted}
        onMarkAsOrdered={markQuoteAsOrdered}
      />
    </div>
  );
} 