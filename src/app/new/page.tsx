'use client';

import { useQuotes } from '@/components/ui/useQuotes';
import QuoteTable from '@/components/ui/QuoteTable';
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
    addQuote,
    addPart,
    updateQuote,
    deleteQuote,
    updatePart,
    updateMultipleParts,
    markQuoteCompleted,
    markQuoteAsOrderedWithParts,
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
      console.log('Form fields received:', fields);
      
      // Parse year from mthyr field
      const parsedYear = fields.mthyr ? validateDateString(fields.mthyr) : undefined;
      console.log('Original mthyr:', fields.mthyr, 'Parsed year:', parsedYear);
      
      // Transform form data to normalized structure
      const normalizedQuoteData = {
        customer: {
          name: fields.customer || '',
          phone: fields.phone || undefined,
          address: fields.address || undefined,
        },
        vehicle: {
          rego: fields.rego || undefined,
          make: fields.make || '',
          model: fields.model || '',
          series: fields.series || undefined,
          year: parsedYear,
          vin: fields.vin || undefined,
          color: undefined, // Not in current form
          body: fields.body || undefined, // Added body field
          notes: undefined, // Not in current form
        },
        parts: parts.map(part => ({
          name: part.name,
          number: part.number,
          price: part.price,
          note: part.note,
        })),
        notes: fields.notes || undefined,
        requiredBy: fields.requiredBy || undefined,
      };
      
      console.log('Normalized quote data:', normalizedQuoteData);

      // Create quote using normalized structure
      const result = await createNormalizedQuote(normalizedQuoteData);
      
      if (result.error) {
        console.error('Error creating normalized quote:', result.error);
        return;
      }

      console.log('Successfully created normalized quote:', result.quote?.id);
      
      // Refresh the quotes list to show the new quote
      fetchQuotes();
      fetchParts();
      
    } catch (error) {
      console.error('Error creating quote:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-2 py-8">
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
