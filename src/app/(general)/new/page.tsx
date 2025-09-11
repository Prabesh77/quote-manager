'use client';

import { usePartsQuery, useCreateQuoteMutation } from '@/hooks/queries/useQuotesQuery';
import { QuoteForm } from "@/components/ui/QuoteForm";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { useSnackbar } from '@/components/ui/Snackbar';

export default function NewQuotePage() {
  // Only need parts for the form, not quotes
  const { data: parts, isLoading: partsLoading } = usePartsQuery();
  const { showSnackbar } = useSnackbar();
  
  // Use the actual mutation for creating quotes
  const createQuoteMutation = useCreateQuoteMutation();

  const handleSubmit = async (fields: Record<string, string>, parts: any[]) => {
    try {
      await createQuoteMutation.mutateAsync({
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
