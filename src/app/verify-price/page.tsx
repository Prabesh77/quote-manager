'use client';

import React from 'react';
import QuoteTable from '@/components/quotes/QuoteTable';
import { useQuotes } from '@/hooks/quotes/useQuotes';
import { Part } from '@/types/part';

export default function VerifyPricePage() {
  const {
    quotes,
    parts,
    updateQuote,
    deleteQuote,
    updatePart,
    updateMultipleParts,
    markQuoteCompleted,
    markQuoteAsOrdered,
    verifyQuotePrice,
  } = useQuotes();

  // Filter quotes to only show those waiting for verification
  const waitingVerificationQuotes = quotes.filter(quote => quote.status === 'waiting_verification');

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
        <h1 className="text-3xl font-bold text-gray-900">Verify Prices</h1>
        <p className="mt-2 text-gray-600">Review and approve quotes that are waiting for price verification</p>
      </div>

      <QuoteTable
        quotes={waitingVerificationQuotes}
        parts={parts}
        onUpdateQuote={updateQuote}
        onDeleteQuote={deleteQuote}
        onUpdatePart={handleUpdatePart}
        onUpdateMultipleParts={handleUpdateMultipleParts}
        onMarkCompleted={markQuoteCompleted}
        onMarkAsOrdered={markQuoteAsOrdered}
        onVerifyPrice={verifyQuotePrice}
        showVerifyAction={true}
        showCompleted={false}
      />
    </div>
  );
} 