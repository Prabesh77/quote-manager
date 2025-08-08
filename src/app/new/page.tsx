'use client';

import { useQuotes } from '@/hooks/quotes/useQuotes';
import QuoteTable from '@/components/quotes/QuoteTable';
import { QuoteForm } from '@/components/ui/QuoteForm';
import { createNormalizedQuote } from '@/utils/normalizedQuoteCreation';
import { syncNormalizedToLegacy, syncNormalizedPartsToLegacy } from '@/utils/syncNormalizedToLegacy';

// Function to validate and clean date string
const validateDateString = (dateString: string): string | undefined => {
  if (!dateString || dateString.trim() === '') {
    return undefined;
  }
  
  const trimmed = dateString.trim();
  
  // Handle format like "9/2017" or "09/2017"
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 2) {
      const month = parseInt(parts[0]);
      const year = parseInt(parts[1]);
      if (!isNaN(month) && !isNaN(year) && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
        return trimmed; // Return original string like "9/2017"
      }
    }
  }
  
  // Handle format like "2017" (just year)
  const yearOnly = parseInt(trimmed);
  if (!isNaN(yearOnly) && yearOnly >= 1900 && yearOnly <= 2100) {
    return yearOnly.toString();
  }
  
  // Handle format like "9-2017" or "09-2017"
  if (trimmed.includes('-')) {
    const parts = trimmed.split('-');
    if (parts.length === 2) {
      const month = parseInt(parts[0]);
      const year = parseInt(parts[1]);
      if (!isNaN(month) && !isNaN(year) && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
        return `${month}/${year}`; // Convert to slash format
      }
    }
  }
  
  console.warn('Could not validate date string:', dateString);
  return undefined;
};

export default function NewQuotePage() {
  const {
    quotes,
    parts,
    updateQuote,
    deleteQuote,
    updatePart,
    updateMultipleParts,
    markQuoteCompleted,
    markQuoteAsOrdered,
    fetchQuotes,
    fetchParts
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
    try {
      const result = await updatePart(id, updates);
      
      if (result.error) {
        console.error('Error updating part:', result.error);
        return { data: null as any, error: result.error };
      }

      return { data: result.data || null as any, error: null };
    } catch (error) {
      console.error('Error in handleUpdatePart:', error);
      return { data: null as any, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  const handleUpdateMultipleParts = async (updates: any) => {
    await updateMultipleParts(updates);
  };

  const handleMarkCompleted = async (id: string) => {
    const result = await markQuoteCompleted(id);
    return { error: result.error as Error | null };
  };

  const handleMarkAsOrdered = async (id: string, taxInvoiceNumber: string) => {
    const result = await markQuoteAsOrdered(id, taxInvoiceNumber);
    return { error: result.error as Error | null };
  };

  const handleSubmit = async (fields: Record<string, string>, parts: any[]) => {
    try {
      console.log('Form fields received:', fields);
      console.log('Parts received:', parts);

      // Validate and clean the mthyr field
      const validatedMthyr = validateDateString(fields.mthyr);

      const normalizedQuoteData = {
        customer: {
          name: fields.customer || '',
          phone: fields.phone || '',
          address: fields.address || '',
        },
        vehicle: {
          make: fields.make || '',
          model: fields.model || '',
          series: fields.series || '',
          year: validatedMthyr ? validatedMthyr.split('/')[1] : undefined, // Keep as string
          vin: fields.vin || undefined,
          color: undefined, // Not in current form
          transmission: fields.auto === 'true' ? 'auto' : 'manual', // Map auto field to transmission
          body: fields.body || undefined, // Added body field
          notes: undefined, // Not in current form
        },
        parts: parts.map(part => ({
          name: part.name,
          number: part.number || '',
          price: part.price || null,
          note: part.note || '',
        })),
        requiredBy: fields.requiredBy || undefined,
      };

      console.log('Normalized quote data:', normalizedQuoteData);

      const result = await createNormalizedQuote(normalizedQuoteData);
      
      if (result.error) {
        console.error('Error creating quote:', result.error);
        alert('Error creating quote: ' + result.error);
        return;
      }

      console.log('Quote created successfully:', result);
      
      // Refresh data after creating quote
      await fetchQuotes();
      await fetchParts();
      
      // Reset form (this will be handled by the QuoteForm component)
      
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      alert('Error creating quote: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-8">
        {/* Quote Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Create New Quote</h2>
          <QuoteForm onSubmit={handleSubmit} />
        </div>
        
        {/* Quote Table */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Active Quotes</h2>
          <QuoteTable
            quotes={activeQuotes}
            parts={parts}
            onUpdateQuote={handleUpdateQuote}
            onDeleteQuote={handleDeleteQuote}
            onUpdatePart={handleUpdatePart}
            onUpdateMultipleParts={handleUpdateMultipleParts}
            onMarkCompleted={handleMarkCompleted}
            onMarkAsOrdered={handleMarkAsOrdered}
            showCompleted={false}
            defaultFilter="all"
          />
        </div>
      </div>
    </div>
  );
}
