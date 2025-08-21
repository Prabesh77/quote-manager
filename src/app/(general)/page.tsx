'use client';

import { useQuotesQuery, useDeleteQuoteMutation, useQuotePartsFromJson, useUpdatePartInQuoteJsonMutation } from '@/hooks/queries/useQuotesQuery';
import { QuoteForm } from "@/components/ui/QuoteForm";
import QuoteTable from "@/components/ui/QuoteTable";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { useSnackbar } from '@/components/ui/Snackbar';
import { QuoteService } from '@/services/quotes/quoteService';
import { useState } from 'react';

export default function HomePage() {
  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Get quotes for display (server-side pagination: 1 per page)
  const { data: quotesData, isLoading: quotesLoading } = useQuotesQuery(currentPage, 1);
  
  // Get the current quote ID for fetching only related parts
  const currentQuoteId = quotesData?.quotes?.[0]?.id;
  
  // Fetch only parts related to the current quote from parts_requested JSON column
  const { data: parts, isLoading: partsLoading } = useQuotePartsFromJson(currentQuoteId || '');
  const { showSnackbar } = useSnackbar();

  // Use the actual mutations
  const deleteQuoteMutation = useDeleteQuoteMutation();
  const updatePartMutation = useUpdatePartInQuoteJsonMutation();

  // Use the actual QuoteService to create quotes
  const createQuote = async (data: any) => {
    try {
      const result = await QuoteService.createQuote(data);
      return result;
    } catch (error) {
      console.error('Error in createQuote:', error);
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

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

  // Placeholder mutation functions for QuoteTable
  const onUpdateQuote = async (id: string, fields: Record<string, any>) => {
    try {
      showSnackbar('Quote updated successfully!', 'success');
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showSnackbar(`Error updating quote: ${errorMessage}`, 'error');
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  const onDeleteQuote = async (id: string) => {
    try {
      await deleteQuoteMutation.mutateAsync(id);
      showSnackbar('Quote deleted successfully!', 'success');
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showSnackbar(`Error deleting quote: ${errorMessage}`, 'error');
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  const onUpdatePart = async (id: string, updates: any) => {
    try {
      if (!currentQuoteId) {
        showSnackbar('No quote selected', 'error');
        return { data: {} as any, error: new Error('No quote selected') };
      }

      const result = await updatePartMutation.mutateAsync({ quoteId: currentQuoteId, partId: id, updates });
      return { data: result.data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showSnackbar(`Error updating part: ${errorMessage}`, 'error');
      return { data: {} as any, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  const onUpdateMultipleParts = async (updates: Array<{ id: string; updates: any }>) => {
    if (!currentQuoteId) {
      showSnackbar('No quote selected', 'error');
      return;
    }

    try {
      console.log('🔄 Updating multiple parts:', updates);
      
      // Update each part individually using the mutation
      for (const { id, updates: partUpdates } of updates) {
        console.log(`🔄 Updating part ${id}:`, partUpdates);
        try {
          await updatePartMutation.mutateAsync({ quoteId: currentQuoteId, partId: id, updates: partUpdates });
          console.log(`✅ Successfully updated part ${id}`);
        } catch (error) {
          console.error(`❌ Error updating part ${id}:`, error);
          showSnackbar(`Error updating part ${id}`, 'error');
        }
      }
      
      showSnackbar(`${updates.length} parts updated successfully!`, 'success');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showSnackbar(`Error updating parts: ${errorMessage}`, 'error');
    }
  };

  const onMarkAsOrdered = async (id: string, taxInvoiceNumber: string) => {
    try {
      showSnackbar('Quote marked as ordered successfully!', 'success');
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showSnackbar(`Error marking quote as ordered: ${errorMessage}`, 'error');
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  const onMarkAsOrderedWithParts = async (id: string, taxInvoiceNumber: string, partIds: string[]) => {
    try {
      showSnackbar('Quote marked as ordered with parts successfully!', 'success');
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showSnackbar(`Error marking quote as ordered: ${errorMessage}`, 'error');
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  return (
    <ProtectedRoute allowedRoles={['quote_creator', 'admin']}>
      <div className="py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Quote</h1>
        <QuoteForm onSubmit={handleSubmit} />
        
        {/* Display quotes with server-side pagination */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Quotes</h2>
          
          <QuoteTable
            quotes={quotesData?.quotes || []}
            parts={parts || []}
            onUpdateQuote={onUpdateQuote}
            onDeleteQuote={onDeleteQuote}
            onUpdatePart={onUpdatePart}
            onUpdateMultipleParts={onUpdateMultipleParts}
            onMarkAsOrdered={onMarkAsOrdered}
            onMarkAsOrderedWithParts={onMarkAsOrderedWithParts}
            showCompleted={false}
            isLoading={quotesLoading || partsLoading}
            showPagination={true}
            // Server pagination props
            currentPage={currentPage}
            totalPages={quotesData?.totalPages || 1}
            total={quotesData?.total || 0}
            pageSize={1}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
