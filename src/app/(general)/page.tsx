'use client';

import { useQuotes } from '@/hooks/useQuotesWithQuery';
import { QuoteForm } from "@/components/ui/QuoteForm";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { useSnackbar } from '@/components/ui/Snackbar';

export default function HomePage() {
  const { quotes, parts, isLoading, createQuote } = useQuotes();
  const { showSnackbar } = useSnackbar();

  const handleSubmit = async (fields: Record<string, string>, parts: any[]) => {
    try {
      const result = await createQuote({
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
          year: fields.mthyr,
          vin: fields.vin || '',
          color: '',
          auto: fields.auto === 'true',
          body: fields.body || '',
          notes: ''
        },
        parts: parts?.map((part: any) => ({
          name: part.name || '',
          number: part.number || '',
          price: part.price || null,
          note: part.note || ''
        })) || [],
        notes: '',
        requiredBy: fields.requiredBy || '',
        quoteRef: fields.quoteRef
      });

      if (result.error) {
        throw result.error;
      }

      showSnackbar('Quote created successfully!', 'success');
    } catch (error) {
      console.error('Quote creation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showSnackbar(`Error creating quote: ${errorMessage}`, 'error');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['quote_creator', 'admin']}>
      <div className="py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Quote</h1>
        <QuoteForm onSubmit={handleSubmit} />
      </div>
    </ProtectedRoute>
  );
}
