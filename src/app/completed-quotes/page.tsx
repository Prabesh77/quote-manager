'use client';

import { useQuotes } from '@/hooks/quotes/useQuotes';
import QuoteTable from '@/components/quotes/QuoteTable';
import { Part } from '@/types/part';

export default function CompletedQuotesPage() {
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

  // Filter to show completed quotes
  const completedQuotes = quotes.filter(quote => quote.status === 'completed');

  // Wrapper function to match QuoteTable's expected interface
  const handleUpdatePart = async (id: string, updates: Partial<Part>): Promise<{ data: Part; error: Error | null }> => {
    const result = await updatePart(id, updates);
    if (result.error) {
      return { data: null as any, error: result.error };
    }
    return { data: result.data || null as any, error: null };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Completed Quotes</h1>
        <p className="mt-2 text-gray-600">View and manage completed quotes</p>
      </div>

      <QuoteTable
        quotes={completedQuotes}
        parts={parts}
        onUpdateQuote={updateQuote}
        onDeleteQuote={deleteQuote}
        onUpdatePart={handleUpdatePart}
        onUpdateMultipleParts={updateMultipleParts}
        onMarkCompleted={markQuoteCompleted}
        onMarkAsOrdered={markQuoteAsOrdered}
        showCompleted={true}
      />
    </div>
  );
} 