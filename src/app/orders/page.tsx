'use client';

import React from 'react';
import QuoteTable from '@/components/ui/QuoteTable';
import { useQuotes } from '@/components/ui/useQuotes';

export default function OrdersPage() {
  const {
    quotes,
    parts,
    updateQuote,
    deleteQuote,
    updatePart,
    updateMultipleParts,
    markQuoteCompleted,
    markQuoteAsOrdered,
    markQuoteAsOrderedWithParts,
  } = useQuotes();

  // Filter quotes to only show those that have been ordered
  const orderedQuotes = quotes.filter(quote => quote.status === 'ordered');

  // Wrapper functions to match QuoteTable interface
  const onUpdateQuote = async (id: string, fields: Record<string, any>) => {
    const result = await updateQuote(id, fields);
    return { error: result.error };
  };

  const onDeleteQuote = async (id: string) => {
    const result = await deleteQuote(id);
    return { error: result.error };
  };

  const onUpdatePart = async (id: string, updates: any) => {
    const result = await updatePart(id, updates);
    return { data: result.data, error: result.error };
  };

  const onUpdateMultipleParts = async (updates: Array<{ id: string; updates: any }>) => {
    await updateMultipleParts(updates);
  };

  const onMarkCompleted = async (id: string) => {
    const result = await markQuoteCompleted(id);
    return { error: result.error };
  };

  const onMarkAsOrdered = async (id: string, taxInvoiceNumber: string) => {
    const result = await markQuoteAsOrdered(id, taxInvoiceNumber);
    return { error: result.error };
  };

  const onMarkAsOrderedWithParts = async (id: string, taxInvoiceNumber: string, partIds: string[]) => {
    const result = await markQuoteAsOrderedWithParts(id, taxInvoiceNumber, partIds);
    return { error: result.error };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="relative">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders</h1>
          <p className="text-gray-600">Manage customer orders and fulfillment</p>
        </div>

        {/* Orders Table - Show only quotes that have been ordered */}
        <QuoteTable
          quotes={orderedQuotes}
          parts={parts}
          onUpdateQuote={onUpdateQuote}
          onDeleteQuote={onDeleteQuote}
          onUpdatePart={onUpdatePart}
          onUpdateMultipleParts={onUpdateMultipleParts}
          onMarkCompleted={onMarkCompleted}
          onMarkAsOrdered={onMarkAsOrdered}
          onMarkAsOrderedWithParts={onMarkAsOrderedWithParts}
          showCompleted={false}
        />
      </div>
    </div>
  );
} 