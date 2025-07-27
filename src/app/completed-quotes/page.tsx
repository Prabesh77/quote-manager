'use client';

import { useQuotes } from '@/components/ui/useQuotes';
import QuoteTable from '@/components/ui/QuoteTable';
import Navigation from '@/components/ui/Navigation';

export default function CompletedQuotesPage() {
  const { 
    quotes, 
    parts, 
    updateQuote, 
    deleteQuote, 
    updatePart, 
    updateMultipleParts, 
    markQuoteCompleted,
    markQuoteAsOrderedWithParts
  } = useQuotes();

  const completedQuotes = quotes.filter(quote => quote.status === 'completed');

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

  const onMarkCompleted = async (id: string) => {
    const result = await markQuoteCompleted(id);
    return { error: result.error as Error | null };
  };

  const onMarkAsOrderedWithParts = async (id: string, taxInvoiceNumber: string, partIds: string[]) => {
    const result = await markQuoteAsOrderedWithParts(id, taxInvoiceNumber, partIds);
    return { error: result.error as Error | null };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Completed Quotes</h1>
          <p className="text-gray-600 mt-2">View and manage completed quotes</p>
        </div>
        
        <QuoteTable
          quotes={completedQuotes}
          parts={parts}
          onUpdateQuote={onUpdateQuote}
          onDeleteQuote={onDeleteQuote}
          onUpdatePart={onUpdatePart}
          onUpdateMultipleParts={onUpdateMultipleParts}
          onMarkCompleted={onMarkCompleted}
          onMarkAsOrderedWithParts={onMarkAsOrderedWithParts}
          showCompleted={true}
        />
      </div>
    </div>
  );
} 