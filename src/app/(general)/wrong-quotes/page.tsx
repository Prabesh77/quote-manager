'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import QuoteTable from '@/components/ui/QuoteTable';
import { useQuotesQuery, useUpdatePartInQuoteJsonMutation, useUpdatePartsComprehensiveBatchMutation, queryKeys } from '@/hooks/queries/useQuotesQuery';
import { useAllQuoteParts } from '@/hooks/useAllQuoteParts';
import { useQueryClient } from '@tanstack/react-query';
import supabase from '@/utils/supabase';

function WrongQuotesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  
  // Get the quote ID from URL params if provided
  const quoteId = searchParams.get('quoteId');
  
  // Fetch wrong quotes created by the current user
  const { 
    data: quotesData, 
    isLoading, 
    error 
  } = useQuotesQuery(1, 100, { 
    status: 'wrong',
    created_by: user?.id 
  });

  // Fetch parts for the quotes being displayed
  const { data: parts } = useAllQuoteParts(quotesData?.quotes || []);

  // Use the actual mutation for part updates
  const updatePartMutation = useUpdatePartInQuoteJsonMutation();
  const updatePartsComprehensiveBatchMutation = useUpdatePartsComprehensiveBatchMutation();

  // Filter quotes if a specific quote ID is provided
  const quotes = quoteId 
    ? quotesData?.quotes?.filter(q => q.id === quoteId) || []
    : quotesData?.quotes || [];

  // Debug logging to check status
  console.log('🔍 Wrong Quotes Debug:', {
    quotesCount: quotes.length,
    quotesDataCount: quotesData?.quotes?.length,
    sampleQuote: quotes[0] ? {
      id: quotes[0].id,
      status: quotes[0].status,
      quoteRef: quotes[0].quoteRef
    } : null
  });


  // Custom part update handler that includes status transition logic
  const handleUpdatePart = async (partId: string, updates: any) => {
    try {
      console.log('🔍 handleUpdatePart Debug:', {
        partId,
        updates,
        quotesCount: quotes.length,
        quotesDataCount: quotesData?.quotes?.length
      });

      // Find the quote that contains this part
      // Since we only have one quote in wrong-quotes page, we can use the first quote
      const quote = quotes.length > 0 ? quotes[0] : null;
      
      console.log('🔍 Quote found:', quote ? {
        id: quote.id,
        quoteRef: quote.quoteRef,
        partsRequestedCount: quote.parts_requested?.length
      } : null);
      
      if (!quote) {
        console.error('❌ Quote not found for part:', partId);
        return { data: null, error: new Error('Quote not found for this part') };
      }

      // Transform the updates to match what the mutation expects
      const transformedUpdates = { ...updates };
      
      // If updates contains a number field, extract it to the top level
      if (updates.number !== undefined) {
        transformedUpdates.number = updates.number;
      }

      console.log('🔍 Calling mutation with:', {
        quoteId: quote.id,
        partId: partId,
        updates: transformedUpdates
      });

      // Update the part using the mutation
      const result = await updatePartMutation.mutateAsync({ 
        quoteId: quote.id, 
        partId: partId, 
        updates: transformedUpdates 
      });

      console.log('🔍 Mutation result:', result);

      // Manually invalidate queries to ensure instant refresh
      // Invalidate the specific query used by this page
      const specificQueryKey = queryKeys.quotes(1, 100, { status: 'wrong', created_by: user?.id });
      queryClient.invalidateQueries({ queryKey: specificQueryKey });
      queryClient.refetchQueries({ queryKey: specificQueryKey });
      
      // Also invalidate base quotes to ensure other pages update
      queryClient.invalidateQueries({ queryKey: queryKeys.quotesBase });

      // After successful part update, check if quote should transition status
      await checkAndTransitionQuoteStatus(quote.id);

      console.log('✅ Part update completed successfully');
      return { data: result.data as any, error: null };
    } catch (error) {
      console.error('❌ Error in handleUpdatePart:', error);
      return { data: {} as any, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  // Custom multiple parts update handler
  const handleUpdateMultipleParts = async (updates: Array<{ id: string; updates: any }>, quoteId?: string, changeStatus: boolean = true) => {
    try {
      console.log('🔍 handleUpdateMultipleParts Debug:', {
        updates,
        quoteId,
        updatesCount: updates.length,
        quotesCount: quotes.length
      });

      // Find the quote that contains these parts
      // Use quoteId if provided, otherwise search by part ID
      let quote;
      if (quoteId) {
        quote = quotes.find(q => q.id === quoteId);
      } else {
        quote = quotes.find(q => 
          q.parts_requested?.some((partItem: any) => 
            updates.some(update => update.id === partItem.part_id)
          )
        );
      }
      
      console.log('🔍 Quote found for multiple parts:', quote ? {
        id: quote.id,
        quoteRef: quote.quoteRef,
        partsRequestedCount: quote.parts_requested?.length
      } : null);
      
      if (!quote) {
        console.error('❌ Quote not found for these parts');
        return;
      }

      // Use the comprehensive batch mutation to update all parts in a single operation
      await updatePartsComprehensiveBatchMutation.mutateAsync({ 
        quoteId: quote.id, 
        updates, 
        changeStatus 
      });

      // After successful parts update, check if quote should transition status
      await checkAndTransitionQuoteStatus(quote.id);
      
      console.log('✅ Multiple parts update completed successfully');
    } catch (error) {
      console.error('❌ Error in handleUpdateMultipleParts:', error);
    }
  };

  // Helper function to check and transition quote status
  const checkAndTransitionQuoteStatus = async (quoteId: string) => {
    try {
      // Get the updated quote data
      const { data: updatedQuote, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (error) {
        console.error('Error fetching updated quote:', error);
        return;
      }

      // Check if all parts have valid part numbers (not empty or placeholder values)
      const allPartsValid = updatedQuote.parts_requested.every((part: any) => 
        part.part_id && part.part_id.trim() !== '' && part.part_id !== 'R' && part.part_id !== 'L'
      );

      console.log('🔍 Status Transition Debug:', {
        quoteId,
        currentStatus: updatedQuote.status,
        partsRequested: updatedQuote.parts_requested,
        allPartsValid,
        shouldTransition: allPartsValid && updatedQuote.status === 'wrong'
      });

      if (allPartsValid && updatedQuote.status === 'wrong') {
        // Move quote back to unpriced status
        const { error: statusError } = await supabase
          .from('quotes')
          .update({ status: 'unpriced' })
          .eq('id', quoteId);

        if (statusError) {
          console.error('Error updating quote status:', statusError);
        } else {
          // Invalidate queries to refresh the UI
          const specificQueryKey = queryKeys.quotes(1, 100, { status: 'wrong', created_by: user?.id });
          queryClient.invalidateQueries({ queryKey: specificQueryKey });
          queryClient.refetchQueries({ queryKey: specificQueryKey });
          queryClient.invalidateQueries({ queryKey: queryKeys.quotesBase });
        }
      }
    } catch (error) {
      console.error('Error checking quote status transition:', error);
    }
  };

  // Standard quote update handler (for other quote fields)
  const handleQuoteUpdate = async (quoteId: string, fields: Record<string, any>) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update(fields)
        .eq('id', quoteId);

      if (error) {
        console.error('Error updating quote:', error);
        return { error: new Error(error.message) };
      }

      // Invalidate queries to refresh the UI
      const specificQueryKey = queryKeys.quotes(1, 100, { status: 'wrong', created_by: user?.id });
      queryClient.invalidateQueries({ queryKey: specificQueryKey });
      queryClient.refetchQueries({ queryKey: specificQueryKey });
      queryClient.invalidateQueries({ queryKey: queryKeys.quotesBase });

      return { error: null };
    } catch (error) {
      console.error('Error in handleQuoteUpdate:', error);
      return { error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-lg text-gray-600">Please log in to view your wrong quotes.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
            Your Wrong Quotes
          </h1>
          
          <p className="mt-2 text-gray-600">
            Quotes that have been marked as wrong and returned to you for correction.
          </p>
        </div>

        {/* QuoteTable */}
        {isLoading ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading wrong quotes...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <AlertTriangle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-lg text-gray-600">No wrong quotes found for you.</p>
            <p className="mt-2 text-sm text-gray-500">
              Quotes marked as wrong will appear here for you to correct.
            </p>
            <Link 
              href="/" 
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Go to Dashboard
            </Link>
          </div>
        ) : (
          <QuoteTable
            quotes={quotes}
            parts={parts || []}
            onUpdateQuote={handleQuoteUpdate}
            onDeleteQuote={() => Promise.resolve({ error: null })}
            onUpdatePart={handleUpdatePart}
            onUpdateMultipleParts={handleUpdateMultipleParts}
            showCompleted={false}
            defaultFilter="all"
            isLoading={isLoading}
            itemsPerPage={10}
            showPagination={true}
            useServerSideSearch={false}
          />
        )}
      </div>
    </div>
  );
}

export default function WrongQuotesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wrong quotes...</p>
        </div>
      </div>
    }>
      <WrongQuotesContent />
    </Suspense>
  );
}