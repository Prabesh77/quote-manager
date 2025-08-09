'use client';

import { useQuotes } from '@/hooks/useQuotesWithQuery';
import QuoteTable from '@/components/ui/QuoteTable';
import { QuoteForm } from '@/components/ui/QuoteForm';
import { createNormalizedQuote } from '@/utils/normalizedQuoteCreation';
import { Part } from '@/components/ui/useQuotes';
import { useSnackbar } from '@/components/ui/Snackbar';

interface PartDetails {
  name: string;
  number: string;
  price: number | null;
  note: string;
}

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
  
  return undefined;
};

export default function NewQuotePage() {
  const { showSnackbar } = useSnackbar();
  
  const {
    quotes,
    parts,
    updateQuote,
    deleteQuote,
    updatePart,
    updateMultipleParts,
    markQuoteCompleted,
    markQuoteAsOrdered,
    isLoading,
  } = useQuotes();

  // Filter quotes to only show those waiting for initial pricing (unpriced only)
  const unpricedQuotes = quotes.filter(quote => {
    // Use the database status directly - much simpler and more reliable
    return quote.status === 'unpriced';
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

  const handleSubmit = async (fields: Record<string, string>, parts: PartDetails[]) => {
    try {
      const result = await createNormalizedQuote({
        customer: {
          name: fields.customer,
          phone: fields.phone || '',
          address: fields.address || ''
        },
        vehicle: {
          rego: fields.rego || '',
          make: fields.make,
          model: fields.model,
          series: fields.series || '',
          year: fields.mthyr ? validateDateString(fields.mthyr) : undefined,
          vin: fields.vin || '',
          color: fields.color || '',
          transmission: fields.auto ? 'auto' : 'manual',
          body: fields.body || '',
          notes: fields.notes || ''
        },
        parts: parts?.map((part: any) => ({
          name: part.name || '',
          number: part.number || '',
          price: part.price || null,
          note: part.note || ''
        })) || [],
        notes: fields.notes || '',
        requiredBy: fields.requiredBy || ''
      });

      console.log('Quote created successfully:', result);
      
      // Show success message
      showSnackbar('Quote created successfully!', 'success');
      
      // Reset form or redirect
      // You might want to redirect to the quote details or reset the form here
      
    } catch (error) {
      console.error('Quote creation failed with error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showSnackbar(`Error creating quote: ${errorMessage}`, 'error');
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
          />
        </div>
      </div>
    </div>
  );
}
