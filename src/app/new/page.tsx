'use client';

import { useQuotes } from '@/components/ui/useQuotes';
import QuoteTable from '@/components/ui/QuoteTable';
import { QuoteForm } from '@/components/ui/QuoteForm';

export default function NewQuotePage() {
  const { 
    quotes, 
    parts, 
    addQuote,
    addPart,
    updateQuote, 
    deleteQuote, 
    updatePart, 
    updateMultipleParts, 
    markQuoteCompleted,
    markQuoteAsOrderedWithParts
  } = useQuotes();

  const activeQuotes = quotes.filter(quote => quote.status !== 'completed' && quote.status !== 'ordered');

  // Wrapper functions to match QuoteTableProps interface
  const handleUpdateQuote = async (id: string, fields: Record<string, any>) => {
    const result = await updateQuote(id, fields);
    return { error: result.error as Error | null };
  };

  const handleDeleteQuote = async (id: string) => {
    const result = await deleteQuote(id);
    return { error: result.error as Error | null };
  };

  const handleUpdatePart = async (id: string, updates: any) => {
    return await updatePart(id, updates);
  };

  const handleUpdateMultipleParts = async (updates: any) => {
    await updateMultipleParts(updates);
  };

  const handleMarkCompleted = async (id: string) => {
    const result = await markQuoteCompleted(id);
    return { error: result.error as Error | null };
  };

  const handleMarkAsOrderedWithParts = async (id: string, taxInvoiceNumber: string, partIds: string[]) => {
    const result = await markQuoteAsOrderedWithParts(id, taxInvoiceNumber, partIds);
    return { error: result.error as Error | null };
  };

  const handleSubmit = async (fields: Record<string, string>, parts: any[]) => {
    try {
      // First, create all the parts in the database
      const partIds: string[] = [];
      
      for (const part of parts) {
        const { data: newPart, error } = await addPart({
          name: part.name,
          number: part.number,
          price: part.price,
          note: part.note
        });
        
        if (error) {
          console.error('Error adding part:', error);
          return;
        }
        
        if (newPart && newPart[0]) {
          partIds.push(newPart[0].id);
        }
      }
      
      // Then create the quote with the part IDs
      await addQuote(fields, partIds);
    } catch (error) {
      console.error('Error creating quote:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add Quote</h1>
          <p className="text-gray-600 mt-2">Create and manage new quotes</p>
        </div>
        
        <div className="mb-8">
          <QuoteForm onSubmit={handleSubmit} />
        </div>
        
        <QuoteTable
          quotes={activeQuotes}
          parts={parts}
          onUpdateQuote={handleUpdateQuote}
          onDeleteQuote={handleDeleteQuote}
          onUpdatePart={handleUpdatePart}
          onUpdateMultipleParts={handleUpdateMultipleParts}
          onMarkCompleted={handleMarkCompleted}
          onMarkAsOrderedWithParts={handleMarkAsOrderedWithParts}
        />
      </div>
    </div>
  );
}
