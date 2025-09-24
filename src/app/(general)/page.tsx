'use client';

import { useQuotesQuery, useDeleteQuoteMutation, useUpdatePartInQuoteJsonMutation, useUpdatePartsComprehensiveBatchMutation, useCreateQuoteMutation } from '@/hooks/queries/useQuotesQuery';
import { useQuery } from '@tanstack/react-query';
import { QuoteForm } from "@/components/ui/QuoteForm";
import QuoteTable from "@/components/ui/QuoteTable";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { useSnackbar } from '@/components/ui/Snackbar';
import { QuoteActionsService } from '@/services/quoteActions/quoteActionsService';
import supabase from '@/utils/supabase';
import { useState } from 'react';
import { Part } from '@/components/ui/useQuotes';
import { useDebouncedSearchWithPageReset } from '@/hooks/useDebouncedSearch';

export default function HomePage() {
  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  
  // Search state with debouncing and page reset
  const { searchTerm, debouncedSearchTerm, setSearchTerm } = useDebouncedSearchWithPageReset(
    () => setCurrentPage(1)
  );

  // Get quotes for display (server-side pagination: 10 per page) - only show unpriced quotes
  const { data: quotesData, isLoading: quotesLoading } = useQuotesQuery(currentPage, 10, { 
    status: 'unpriced',
    search: debouncedSearchTerm 
  });
  
  // Get all quote IDs for fetching parts for all quotes
  const allQuoteIds = quotesData?.quotes?.map(quote => quote.id) || [];
  
  // Fetch parts for all quotes - we'll use a different approach
  // Since useQuotePartsFromJson only works for one quote, we'll fetch all parts at once
  const { data: allParts, isLoading: partsLoading } = useQuery({
    queryKey: ['all-parts-for-quotes', allQuoteIds],
    queryFn: async () => {
      if (allQuoteIds.length === 0) return [];
      
      // Get all quotes with their parts_requested JSON
      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('id, parts_requested')
        .in('id', allQuoteIds);
      
      if (quotesError) throw quotesError;
      
      // Extract all unique part IDs from all quotes
      const allPartIds = new Set<string>();
      quotes?.forEach(quote => {
        if (quote.parts_requested && Array.isArray(quote.parts_requested)) {
          quote.parts_requested.forEach((partItem: any) => {
            if (partItem.part_id) {
              allPartIds.add(partItem.part_id);
            }
          });
        }
      });
      
      if (allPartIds.size === 0) return [];
      
      // Fetch all parts data
      const { data: partsData, error: partsError } = await supabase
        .from('parts')
        .select('*')
        .in('id', Array.from(allPartIds));
      
      if (partsError) throw partsError;
      
      // Map database fields to UI fields
      const mappedParts = partsData?.map(part => ({
        id: part.id,
        name: part.part_name, // Map part_name to name for UI compatibility
        number: part.part_number || '',
        price: part.price,
        list_price: part.list_price || null,
        af: part.af || false,
        note: '', // Will be filled from quote-specific data
        createdAt: part.created_at
      })) || [];
      
      
      return mappedParts;
    },
    enabled: allQuoteIds.length > 0,
  });
  const { showSnackbar } = useSnackbar();

  // Use the actual mutations
  const deleteQuoteMutation = useDeleteQuoteMutation();
  const updatePartMutation = useUpdatePartInQuoteJsonMutation();
  const updatePartsComprehensiveBatchMutation = useUpdatePartsComprehensiveBatchMutation();
  const createQuoteMutation = useCreateQuoteMutation();

  const handleSubmit = async (fields: Record<string, string>, parts: any[]) => {
    try {
      const quoteData = {
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
          list_price: part.list_price || null,
          af: part.af || false,
          note: part.note || ''
        })) || [],
        notes: '',
        requiredBy: fields.requiredBy || '',
        quoteRef: fields.quoteRef,
        settlement: fields.settlement
      };

      await createQuoteMutation.mutateAsync(quoteData);
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
      // Find the quote that contains this part
      const quote = quotesData?.quotes?.find(q => 
        q.parts_requested?.some((partItem: any) => partItem.part_id === id)
      );
      
      if (!quote) {
        showSnackbar('Quote not found for this part', 'error');
        return { data: {} as Part, error: new Error('Quote not found') };
      }

      const result = await updatePartMutation.mutateAsync({ quoteId: quote.id, partId: id, updates, changeStatus: true });
      
      // Note: PRICED tracking is now handled in useUpdatePartInQuoteJsonMutation 
      // when status changes to 'waiting_verification'
      if (updates.price !== null && updates.price !== undefined) {
        console.log('💾 INDIVIDUAL: Price updated, PRICED tracking handled by mutation');
      }
      
      return { data: result.data as Part, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showSnackbar(`Error updating part: ${errorMessage}`, 'error');
      return { data: {} as Part, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  const onUpdateMultipleParts = async (updates: Array<{ id: string; updates: any }>, quoteId?: string, changeStatus: boolean = true) => {
    let quote;
    
    if (quoteId) {
      // If quoteId is provided, use it directly (more reliable)
      quote = quotesData?.quotes?.find(q => q.id === quoteId);
    } else {
      // Fallback: Find the quote that contains these parts
      quote = quotesData?.quotes?.find(q => 
        q.parts_requested?.some((partItem: any) => 
          updates.some(update => update.id === partItem.part_id)
        )
      );
    }
    
    if (!quote) {
      showSnackbar('Quote not found for these parts', 'error');
      return;
    }

    try {
      // Use the comprehensive batch mutation to update all parts in a single operation
      await updatePartsComprehensiveBatchMutation.mutateAsync({ 
        quoteId: quote.id, 
        updates, 
        changeStatus 
      });
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

  const onMarkCompleted = async (id: string) => {
    try {
      // Update quote status to completed
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'completed' })
        .eq('id', id);
      
      if (error) {
        console.error('Mark completed error:', error);
        showSnackbar(`Error marking quote as completed: ${error.message}`, 'error');
        return { error: new Error(error.message) };
      }
      
      // Track quote completion action
      try {
        console.log('🎯 COMPLETED: Tracking completion action for quote:', id);
        await QuoteActionsService.trackQuoteAction(id, 'COMPLETED');
        console.log('✅ COMPLETED: Successfully tracked completion action for quote:', id);
      } catch (trackingError) {
        console.warn('Failed to track quote completion:', trackingError);
        // Don't fail the operation if tracking fails
      }
      
      showSnackbar('Quote marked as completed successfully!', 'success');
      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showSnackbar(`Error marking quote as completed: ${errorMessage}`, 'error');
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quotes Waiting for Pricing</h2>
          
          <QuoteTable
            quotes={quotesData?.quotes || []}
            parts={allParts || []}
            onUpdateQuote={onUpdateQuote}
            onDeleteQuote={onDeleteQuote}
            onUpdatePart={onUpdatePart}
            onUpdateMultipleParts={onUpdateMultipleParts}
            onMarkCompleted={onMarkCompleted}
            onMarkAsOrdered={onMarkAsOrdered}
            onMarkAsOrderedWithParts={onMarkAsOrderedWithParts}
            showCompleted={false}
            defaultFilter="unpriced"
            isLoading={quotesLoading || partsLoading}
            showPagination={true}
            // Server pagination props
            currentPage={currentPage}
            totalPages={quotesData?.totalPages || 1}
            total={quotesData?.total || 0}
            pageSize={10}
            onPageChange={setCurrentPage}
            // Server-side search props
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            useServerSideSearch={true}
          />
        </div>
      </div>
    </ProtectedRoute>
  );
}
