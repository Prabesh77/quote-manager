'use client';

import { useQuotes } from '@/hooks/useQuotesWithQuery';
import QuoteTable from '@/components/ui/QuoteTable';
import { QuoteForm } from '@/components/ui/QuoteForm';
import { createNormalizedQuote } from '@/utils/normalizedQuoteCreation';
import { Part } from '@/components/ui/useQuotes';

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
    fetchParts,
    isLoading,
    isRefetching
  } = useQuotes();

  // Filter to only show quotes waiting for pricing
  const getQuoteParts = (partRequested: string): Part[] => {
    if (!partRequested) return [];
    const partIds = partRequested.split(',').filter(id => id.trim());
    return parts.filter(part => partIds.includes(part.id));
  };

  const getQuoteStatus = (quoteParts: Part[], quoteStatus?: string): string => {
    if (quoteStatus === 'completed' || quoteStatus === 'ordered' || quoteStatus === 'delivered') {
      return quoteStatus;
    }
    
    // If quote status is explicitly set to waiting_verification or priced, use that
    if (quoteStatus === 'waiting_verification' || quoteStatus === 'priced') {
      return quoteStatus;
    }
    
    if (quoteParts.length === 0) return 'unpriced';
    
    const allPartsPriced = quoteParts.every(part => part.price && part.price > 0);
    return allPartsPriced ? 'waiting_verification' : 'unpriced';
  };

  // Filter quotes to only show those waiting for pricing
  const unpricedQuotes = quotes.filter(quote => {
    const quoteParts = getQuoteParts(quote.partRequested);
    const status = getQuoteStatus(quoteParts, quote.status);
    return status === 'unpriced';
  });

  // Wrapper functions to match QuoteTableProps interface
  const handleUpdateQuote = async (id: string, fields: Record<string, any>): Promise<{ error: Error | null }> => {
    const result = await updateQuote(id, fields);
    return { error: result.error ? new Error(String(result.error)) : null };
  };

  const handleDeleteQuote = async (id: string) => {
    return await deleteQuote(id);
  };

  const handleUpdatePart = async (id: string, updates: Partial<Part>): Promise<{ data: Part; error: Error | null }> => {
    const result = await updatePart(id, updates);
    if (result.error) {
      return { data: null as any, error: result.error };
    }
    return { data: result.data || null as any, error: null };
  };

  const handleUpdateMultipleParts = async (updates: Array<{ id: string; updates: Partial<Part> }>): Promise<void> => {
    try {
      await updateMultipleParts(updates);
    } catch (error) {
      console.error('Error updating multiple parts:', error);
      // The function expects void return, so we just log errors
    }
  };

  const handleMarkCompleted = async (id: string) => {
    return await markQuoteCompleted(id);
  };

  const handleMarkAsOrdered = async (id: string, taxInvoiceNumber: string) => {
    return await markQuoteAsOrdered(id, taxInvoiceNumber);
  };

  const handleSubmit = async (data: any) => {
    try {
      console.log('Form submission data:', data);

      // Validate mthyr field
      const validatedMthyr = validateDateString(data.mthyr);
      
      const result = await createNormalizedQuote({
        customer: {
          name: data.customer || '',
          phone: data.phone || '',
          address: data.address || ''
        },
        vehicle: {
          vin: data.vin || '',
          make: data.make || '',
          model: data.model || '',
          series: data.series || '',
          year: validatedMthyr ? validatedMthyr.split('/')[1] : undefined,
          rego: data.rego || '',
          transmission: data.auto ? 'auto' : 'manual',
          body: data.body || '',
          color: data.color || '',
          notes: data.vehicleNotes || ''
        },
        parts: data.parts?.map((part: any) => ({
          name: part.partName || '',
          number: part.partNumber || '',
          price: part.price || null,
          note: part.note || ''
        })) || [],
        notes: data.notes || '',
        requiredBy: data.requiredBy || ''
      });

      if (result.error) {
        alert('Error creating quote: ' + result.error);
        return;
      }

      console.log('Quote created successfully:', result);
      
      // Refresh the quotes list
      await fetchQuotes();
      await fetchParts();
      
      // Removed success alert to reduce friction
      
    } catch (error) {
      console.error('Error creating quote:', error);
      alert('Error creating quote. Please try again.');
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
        
        {/* Quote Table - Only Unpriced Quotes */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quotes Waiting for Pricing</h2>
          <QuoteTable
            quotes={unpricedQuotes}
            parts={parts}
            onUpdateQuote={handleUpdateQuote}
            onDeleteQuote={handleDeleteQuote}
            onUpdatePart={handleUpdatePart}
            onUpdateMultipleParts={handleUpdateMultipleParts}
            onMarkCompleted={handleMarkCompleted}
            onMarkAsOrdered={handleMarkAsOrdered}
            showCompleted={false}
            isLoading={isLoading}
            isRefetching={isRefetching}
          />
        </div>
      </div>
    </div>
  );
}
