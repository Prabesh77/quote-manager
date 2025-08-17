'use client';

import React from 'react';
import QuoteTable from '@/components/ui/QuoteTable';
import { useQuotesQuery } from '@/hooks/queries/useQuotesQuery';
import { usePartsQuery } from '@/hooks/queries/useQuotesQuery';
import { Part } from '@/components/ui/useQuotes';
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

export default function CompletedQuotesPage() {
  // Get all quotes for completed quotes page (no pagination needed here)
  const { data: quotesData, isLoading: quotesLoading } = useQuotesQuery(1, 1000); // Get all quotes
  const { data: parts, isLoading: partsLoading } = usePartsQuery();
  
  // Filter quotes to only show completed ones
  const completedQuotes = quotesData?.quotes?.filter(quote => quote.status === 'completed') || [];

  // Placeholder functions for now - these will need to be implemented with the new API
  const updateQuote = async (id: string, fields: Record<string, any>) => {
    // TODO: Implement with new API
    return { error: new Error('Not implemented yet') };
  };

  const deleteQuote = async (id: string) => {
    // TODO: Implement with new API
    return { error: new Error('Not implemented yet') };
  };

  const updatePart = async (id: string, updates: Partial<Part>) => {
    // TODO: Implement with new API
    return { data: null as any, error: new Error('Not implemented yet') };
  };

  const updateMultipleParts = async (updates: Array<{ id: string; updates: Partial<Part> }>) => {
    // TODO: Implement with new API
    console.log('Update multiple parts:', updates);
  };

  const markQuoteAsOrdered = async (id: string, taxInvoiceNumber: string) => {
    // TODO: Implement with new API
    return { error: new Error('Not implemented yet') };
  };

  const markQuoteAsOrderedWithParts = async (id: string, taxInvoiceNumber: string, partIds: string[]) => {
    // TODO: Implement with new API
    return { error: new Error('Not implemented yet') };
  };

  // Wrapper function to match QuoteTable's expected interface for updateQuote
  const handleUpdateQuote = async (id: string, fields: Record<string, any>): Promise<{ error: Error | null }> => {
    const result = await updateQuote(id, fields);
    return { error: result.error };
  };

  // Wrapper function to match QuoteTable's expected interface
  const handleUpdatePart = async (id: string, updates: Partial<Part>): Promise<{ data: Part; error: Error | null }> => {
    const result = await updatePart(id, updates);
    return result;
  };

  // Wrapper function for updateMultipleParts to match expected interface
  const handleUpdateMultipleParts = async (updates: Array<{ id: string; updates: Partial<Part> }>): Promise<void> => {
    await updateMultipleParts(updates);
  };

  // Wrapper function to match QuoteTable's expected interface for markQuoteAsOrdered
  const handleMarkAsOrdered = async (id: string, taxInvoiceNumber: string): Promise<{ error: Error | null }> => {
    const result = await markQuoteAsOrdered(id, taxInvoiceNumber);
    return { error: result.error };
  };

  // Wrapper function to match QuoteTable's expected interface for markQuoteAsOrderedWithParts
  const handleMarkAsOrderedWithParts = async (id: string, taxInvoiceNumber: string, partIds: string[]): Promise<{ error: Error | null }> => {
    const result = await markQuoteAsOrderedWithParts(id, taxInvoiceNumber, partIds);
    return { error: result.error };
  };

  return (
    <ProtectedRoute allowedRoles={['price_manager', 'quality_controller', 'admin']}>
      <div className="py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Completed Quotes</h1>
        <QuoteTable
          quotes={completedQuotes}
          parts={parts || []}
          onUpdateQuote={handleUpdateQuote}
          onDeleteQuote={deleteQuote}
          onUpdatePart={handleUpdatePart}
          onUpdateMultipleParts={handleUpdateMultipleParts}
          onMarkAsOrdered={handleMarkAsOrdered}
          onMarkAsOrderedWithParts={handleMarkAsOrderedWithParts}
          showCompleted={true}
          isLoading={quotesLoading || partsLoading}
        />
      </div>
    </ProtectedRoute>
  );
} 