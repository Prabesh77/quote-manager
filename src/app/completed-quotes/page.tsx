'use client';

import React from 'react';
import QuoteTable from '@/components/ui/QuoteTable';
import { useQuotes } from '@/hooks/useQuotesWithQuery';
import { Part } from '@/components/ui/useQuotes';

export default function CompletedQuotesPage() {
  const {
    quotes,
    parts,
    updateQuote,
    deleteQuote,
    updatePart,
    updateMultipleParts,
    markQuoteAsOrdered,
    markQuoteAsOrderedWithParts,
    isLoading,
  } = useQuotes();

  // Filter quotes to only show completed ones
  const completedQuotes = quotes.filter(quote => quote.status === 'completed');

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

  // Wrapper function to match QuoteTable's expected interface for markQuoteAsOrdered
  const handleMarkAsOrdered = async (id: string, taxInvoiceNumber: string): Promise<{ error: Error | null }> => {
    const result = await markQuoteAsOrdered(id, taxInvoiceNumber);
    return { error: result.error ? new Error(String(result.error)) : null };
  };

  // Wrapper function to match QuoteTable's expected interface for markQuoteAsOrderedWithParts
  const handleMarkAsOrderedWithParts = async (id: string, taxInvoiceNumber: string, partIds: string[]): Promise<{ error: Error | null }> => {
    const result = await markQuoteAsOrderedWithParts(id, taxInvoiceNumber, partIds);
    return { error: result.error ? new Error(String(result.error)) : null };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Completed Quotes</h1>
        <p className="mt-2 text-gray-600">View and manage quotes that have been completed and are ready for ordering</p>
      </div>

      <QuoteTable
        quotes={completedQuotes}
        parts={parts}
        onUpdateQuote={handleUpdateQuote}
        onDeleteQuote={deleteQuote}
        onUpdatePart={handleUpdatePart}
        onUpdateMultipleParts={handleUpdateMultipleParts}
        onMarkAsOrdered={handleMarkAsOrdered}
        onMarkAsOrderedWithParts={handleMarkAsOrderedWithParts}
        showCompleted={true}
        isLoading={isLoading}
      />
    </div>
  );
} 