'use client';

import React from 'react';
import QuoteTable from '@/components/ui/QuoteTable';
import { useQuotes } from '@/components/ui/useQuotes';

export default function PricingPage() {
  const {
    quotes,
    parts,
    updateQuote,
    deleteQuote,
    updatePart,
    updateMultipleParts,
    markQuoteCompleted,
    markQuoteAsOrderedWithParts,
  } = useQuotes();

  // Filter quotes to only show those waiting for price
  const unpricedQuotes = quotes.filter(quote => quote.status === 'unpriced');

  // Wrapper functions to match QuoteTableProps interface
  const onUpdateQuote = async (id: string, fields: Record<string, any>) => {
    const result = await updateQuote(id, fields);
    return { error: result.error as Error | null };
  };

  const onDeleteQuote = async (id: string) => {
    const result = await deleteQuote(id);
    return { error: result.error as Error | null };
  };

  const onUpdatePart = async (id: string, updates: any) => {
    return await updatePart(id, updates);
  };

  const onUpdateMultipleParts = async (updates: any) => {
    await updateMultipleParts(updates);
  };

  const onMarkAsOrderedWithParts = async (id: string, taxInvoiceNumber: string, partIds: string[]) => {
    const result = await markQuoteAsOrderedWithParts(id, taxInvoiceNumber, partIds);
    return { error: result.error as Error | null };
  };

  const onMarkCompleted = async (id: string) => {
    const result = await markQuoteCompleted(id);
    return { error: result.error };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="relative">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Price</h1>
          <p className="text-gray-600">Manage quotes that are waiting for pricing</p>
        </div>

        {/* Quote Table - Show only quotes that need pricing */}
        <QuoteTable
          quotes={unpricedQuotes}
          parts={parts}
          onUpdateQuote={onUpdateQuote}
          onDeleteQuote={onDeleteQuote}
          onUpdatePart={onUpdatePart}
          onUpdateMultipleParts={onUpdateMultipleParts}
          onMarkCompleted={onMarkCompleted}
          showCompleted={false}
          defaultFilter="unpriced"
        />
      </div>
    </div>
  );
} 