'use client';

import QuoteTable from "@/components/ui/QuoteTable";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { useQuotes } from '@/hooks/useQuotesWithQuery';

export default function DeliveryPage() {
  const { quotes, parts, updateQuote, deleteQuote, updatePart, updateMultipleParts, markQuoteCompleted, markQuoteAsOrdered } = useQuotes();

  // Filter quotes to only show delivery-related quotes
  const deliveryQuotes = quotes.filter(quote => quote.status === 'ordered');

  // Wrapper functions to match QuoteTable's expected interface
  const handleUpdateQuote = async (id: string, fields: Record<string, any>): Promise<{ error: Error | null }> => {
    const result = await updateQuote(id, fields);
    return { error: result.error ? new Error(String(result.error)) : null };
  };

  const handleUpdatePart = async (id: string, updates: any): Promise<{ data: any; error: Error | null }> => {
    const result = await updatePart(id, updates);
    if (result.error) {
      return { data: null, error: result.error };
    }
    return { data: result.data || null, error: null };
  };

  const handleUpdateMultipleParts = async (updates: Array<{ id: string; updates: any }>): Promise<void> => {
    try {
      await updateMultipleParts(updates);
    } catch (error) {
      console.error('Error updating multiple parts:', error);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'quality_controller']}>
      <div className="py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Delivery</h1>
        <QuoteTable
          quotes={deliveryQuotes}
          parts={parts}
          onUpdateQuote={handleUpdateQuote}
          onDeleteQuote={deleteQuote}
          onUpdatePart={handleUpdatePart}
          onUpdateMultipleParts={handleUpdateMultipleParts}
          onMarkCompleted={markQuoteCompleted}
          onMarkAsOrdered={markQuoteAsOrdered}
          showCompleted={false}
          isLoading={false}
        />
      </div>
    </ProtectedRoute>
  );
} 