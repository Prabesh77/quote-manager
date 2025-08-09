'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '@/utils/supabase';
import { Quote, Part, QuotePart } from '@/components/ui/useQuotes';
import { useSnackbar } from '@/components/ui/Snackbar';

// Query Keys - centralized for consistency
export const queryKeys = {
  quotes: ['quotes'] as const,
  parts: ['parts'] as const,
  quote: (id: string) => ['quotes', id] as const,
  part: (id: string) => ['parts', id] as const,
};

// Fetch functions
const fetchQuotes = async (): Promise<Quote[]> => {
  try {
    // Get normalized quotes with customer and vehicle details
    const { data: normalizedQuotes, error: quotesError } = await supabase
      .from('quotes')
      .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(*)
      `)
      .order('created_at', { ascending: false });

    if (quotesError) {
      console.error('Error fetching normalized quotes:', quotesError);
      throw new Error(quotesError.message);
    }

    // Get all quote parts with part details
    const { data: quoteParts, error: partsError } = await supabase
      .from('quote_parts')
      .select(`
        *,
        part:parts(*)
      `);

    if (partsError) {
      console.error('Error fetching quote parts:', partsError);
      throw new Error(partsError.message);
    }

    console.log('Normalized quotes found:', normalizedQuotes?.length || 0);
    console.log('Quote parts found:', quoteParts?.length || 0);

    // Convert normalized quotes to legacy format for QuoteTable compatibility
    const legacyQuotes: Quote[] = (normalizedQuotes || []).map(normalizedQuote => {
      // Get parts for this quote
      const quotePartsForThisQuote = (quoteParts || []).filter(qp => qp.quote_id === normalizedQuote.id);
      const partIds = quotePartsForThisQuote.map(qp => qp.part_id).join(',');

      // Debug: Log the vehicle data to see what's available
      console.log('Vehicle data for quote', normalizedQuote.id, ':', normalizedQuote.vehicle);

      const legacyQuote = {
        id: normalizedQuote.id,
        vin: normalizedQuote.vehicle?.vin || '',
        partRequested: partIds,
        quoteRef: `Q${normalizedQuote.id.slice(0, 8)}`, // Generate quote ref from ID
        createdAt: normalizedQuote.created_at,
        make: normalizedQuote.vehicle?.make || '',
        model: normalizedQuote.vehicle?.model || '',
        series: normalizedQuote.vehicle?.series || '',
        auto: normalizedQuote.vehicle?.transmission === 'auto', // Map transmission to auto boolean
        body: normalizedQuote.vehicle?.body || '', // Map body field correctly
        mthyr: normalizedQuote.vehicle?.year?.toString() || '',
        rego: normalizedQuote.vehicle?.rego || '',
        requiredBy: normalizedQuote.required_by || undefined,
        customer: normalizedQuote.customer?.name || '',
        address: normalizedQuote.customer?.address || '',
        phone: normalizedQuote.customer?.phone || '',
        status: normalizedQuote.status as Quote['status'],
        taxInvoiceNumber: normalizedQuote.tax_invoice_number || undefined,
      };



      console.log('Converted quote:', legacyQuote.id, 'with parts:', partIds);
      console.log('Body value:', legacyQuote.body);
      return legacyQuote;
    });

    console.log('Final legacy quotes:', legacyQuotes.length);
    return legacyQuotes;
  } catch (error) {
    console.error('Error fetching normalized quotes:', error);
    throw error;
  }
};

const fetchParts = async (): Promise<Part[]> => {
  try {
    const { data: normalizedParts, error } = await supabase
      .from('parts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching normalized parts:', error);
      throw new Error(error.message);
    }

    // Convert normalized parts to legacy format
    const legacyParts: Part[] = (normalizedParts || []).map(part => ({
      id: part.id,
      name: part.part_name,
      number: part.part_number || '',
      price: part.price,
      note: '', // Notes are now stored in quote_parts, not parts
      createdAt: part.created_at,
    }));

    console.log('Loaded normalized parts:', legacyParts.length);
    return legacyParts;
  } catch (error) {
    console.error('Error fetching normalized parts:', error);
    throw error;
  }
};

// Custom hooks using TanStack Query
export const useQuotesQuery = () => {
  return useQuery({
    queryKey: queryKeys.quotes,
    queryFn: fetchQuotes,
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: 'always', // Refetch when component mounts if data is stale
    retry: 2, // Retry twice on failure
  });
};

export const usePartsQuery = () => {
  return useQuery({
    queryKey: queryKeys.parts,
    queryFn: fetchParts,
    staleTime: 5 * 60 * 1000, // 5 minutes - parts change less frequently
    gcTime: 10 * 60 * 1000, // 10 minutes cache time
    refetchOnWindowFocus: true,
    retry: 2,
  });
};

// Query to get quote parts with quote-specific data (price and notes)
export const useQuotePartsQuery = (quoteId: string) => {
  return useQuery({
    queryKey: [...queryKeys.quotes, 'parts', quoteId],
    queryFn: async () => {
      if (!quoteId) return [];

      const { data: quotePartsData, error } = await supabase
        .from('quote_parts')
        .select(`
          id,
          final_price,
          note,
          part:parts(
            id,
            part_name,
            part_number,
            price,
            created_at
          )
        `)
        .eq('quote_id', quoteId);

      if (error) {
        console.error('Error fetching quote parts:', error);
        throw new Error(error.message);
      }

      // Convert to QuotePart format with quote-specific data
      const quoteParts: QuotePart[] = (quotePartsData || []).map(qp => {
        const part = qp.part as any; // Cast to any to handle Supabase nested object typing
        return {
          quotePartId: qp.id,
          quoteId: quoteId,
          partId: part?.id || '',
          finalPrice: qp.final_price || null,
          note: qp.note || '',
          partName: part?.part_name || '',
          partNumber: part?.part_number || '',
          basePrice: part?.price || null,
          createdAt: part?.created_at || '',
        };
      });

      return quoteParts;
    },
    enabled: !!quoteId,
  });
};

// Helper function to convert QuotePart to legacy Part format for UI compatibility
export const quotePartToLegacyPart = (quotePart: QuotePart): Part => ({
  id: quotePart.partId,
  name: quotePart.partName,
  number: quotePart.partNumber,
  price: quotePart.finalPrice, // Only use manually set final price, no automatic fallback
  note: quotePart.note,
  createdAt: quotePart.createdAt,
});

// Helper function to get legacy parts array from quote parts
export const useQuotePartsAsLegacyParts = (quoteId: string) => {
  const quotePartsQuery = useQuotePartsQuery(quoteId);
  
  const legacyParts: Part[] = (quotePartsQuery.data || []).map(quotePartToLegacyPart);
  
  return {
    ...quotePartsQuery,
    data: legacyParts,
  };
};

// Mutation functions
export const useUpdateQuoteMutation = () => {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  
  return useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: Record<string, any> }) => {
      const { error } = await supabase
        .from('quotes')
        .update(fields)
        .eq('id', id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return { id, fields };
    },
    onSuccess: () => {
      // Invalidate and refetch quotes after successful update
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes });
    },
    onError: (error) => {
      console.error('Error updating quote:', error);
      showSnackbar(`Failed to update quote: ${error.message}`, 'error');
    },
  });
};

export const useDeleteQuoteMutation = () => {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return id;
    },
    onSuccess: () => {
      // Invalidate and refetch quotes
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes });
    },
    onError: (error) => {
      console.error('Error deleting quote:', error);
      showSnackbar(`Failed to delete quote: ${error.message}`, 'error');
    },
  });
};

export const useUpdatePartMutation = () => {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Part> }) => {
      console.log('🔧 Updating part:', id, 'with updates:', updates);
      
      // First, update the parts table (legacy)
      const { data, error } = await supabase
        .from('parts')
        .update({
          part_name: updates.name,
          part_number: updates.number,
          price: updates.price,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // If price or note is being updated, also update quote_parts
      if (updates.price !== undefined || updates.note !== undefined) {
        console.log('💰 Price or note update detected, updating quote_parts...');
        console.log('📝 Note value being updated:', updates.note);
        
        // Find all quote_parts that reference this part
        const { data: quotePartsData, error: quotePartsError } = await supabase
          .from('quote_parts')
          .select('id, quote_id')
          .eq('part_id', id);

        if (quotePartsError) {
          console.error('❌ Error fetching quote_parts:', quotePartsError);
        } else if (quotePartsData && quotePartsData.length > 0) {
          console.log('📋 Found quote_parts to update:', quotePartsData.length);
          
          // Update each quote_parts entry
          for (const quotePart of quotePartsData) {
            const updateData: any = {};
            if (updates.price !== undefined) updateData.final_price = updates.price;
            if (updates.note !== undefined) updateData.note = updates.note;
            
            console.log('📝 Updating quote_part with data:', updateData);
            
            const { error: updateError } = await supabase
              .from('quote_parts')
              .update(updateData)
              .eq('id', quotePart.id);

            if (updateError) {
              console.error('❌ Error updating quote_part:', updateError);
            } else {
              console.log('✅ Updated quote_part:', quotePart.id, 'with note:', updateData.note);
              
              // Check and update quote status
              await checkAndUpdateQuoteStatus(quotePart.quote_id);
            }
          }
        } else {
          console.log('⚠️ No quote_parts found for part:', id);
        }
      }

      // Return the updated part in legacy format
      const legacyPart: Part = {
        id: data.id,
        name: data.part_name,
        number: data.part_number || '',
        price: data.price,
        note: updates.note || '', // Use the note from updates since it's not in parts table
        createdAt: data.created_at,
      };

      return legacyPart;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parts });
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes });
    },
    onError: (error) => {
      console.error('Error updating part:', error);
      showSnackbar(`Failed to update part: ${error.message}`, 'error');
    },
  });
};

export const useAddPartMutation = () => {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  
  return useMutation({
    mutationFn: async (partData: Omit<Part, 'id' | 'createdAt'>) => {
      const { data, error } = await supabase
        .from('parts')
        .insert({
          part_name: partData.name,
          part_number: partData.number,
          price: partData.price,
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Convert back to legacy format
      const legacyPart: Part = {
        id: data.id,
        name: data.part_name,
        number: data.part_number || '',
        price: data.price,
        note: '', // Notes are now stored in quote_parts, not parts
        createdAt: data.created_at,
      };
      
      return legacyPart;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parts });
    },
    onError: (error) => {
      console.error('Error adding part:', error);
      showSnackbar(`Failed to add part: ${error.message}`, 'error');
    },
  });
};

// Helper function to check if quote status should be updated based on part prices
const checkAndUpdateQuoteStatus = async (quoteId: string) => {
  console.log('🔍 checkAndUpdateQuoteStatus called for quote:', quoteId);
  
  try {
    // Get current quote status
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('status')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      console.error('❌ Error fetching quote for status update:', quoteError);
      return;
    }

    console.log('📋 Current quote status:', quote.status);

    // Only update if quote is currently unpriced
    if (quote.status !== 'unpriced') {
      console.log('⏭️ Quote is not unpriced, skipping status update');
      return;
    }

    // Check if any parts have final_price set
    const { data: quoteParts, error: partsError } = await supabase
      .from('quote_parts')
      .select('final_price')
      .eq('quote_id', quoteId);

    if (partsError) {
      console.error('❌ Error fetching quote parts for status update:', partsError);
      return;
    }

    console.log('🔧 Quote parts with prices:', quoteParts);

    // If at least one part has a price, update quote status to waiting_verification
    const hasAnyPrice = quoteParts?.some(part => part.final_price !== null && part.final_price !== undefined);
    
    console.log('💰 Has any price?', hasAnyPrice);
    
    if (hasAnyPrice) {
      console.log('🔄 Updating quote status to waiting_verification...');
      
      const { error: updateError } = await supabase
        .from('quotes')
        .update({ status: 'waiting_verification' })
        .eq('id', quoteId);

      if (updateError) {
        console.error('❌ Error updating quote status:', updateError);
        console.error('❌ Full error details:', JSON.stringify(updateError, null, 2));
      } else {
        console.log('✅ Successfully updated quote', quoteId, 'status to waiting_verification');
      }
    } else {
      console.log('💸 No parts have prices yet');
    }
  } catch (error) {
    console.error('❌ Error in checkAndUpdateQuoteStatus:', error);
  }
};

export const useUpdateQuotePartMutation = () => {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  
  return useMutation({
    mutationFn: async ({ 
      quotePartId, 
      updates 
    }: { 
      quotePartId: string; 
      updates: { finalPrice?: number; note?: string } 
    }) => {
      const { data, error } = await supabase
        .from('quote_parts')
        .update({
          final_price: updates.finalPrice,
          note: updates.note,
        })
        .eq('id', quotePartId)
        .select('quote_id')
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: async (data) => {
      // Check and update quote status if needed
      if (data?.quote_id) {
        await checkAndUpdateQuoteStatus(data.quote_id);
      }
      
      // Invalidate queries since quote_parts data affects quote display
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes });
    },
    onError: (error) => {
      console.error('Error updating quote part:', error);
      showSnackbar(`Failed to update quote part: ${error.message}`, 'error');
    },
  });
};

// Mutation to update quote parts using legacy Part interface (for UI compatibility)
export const useUpdateQuotePartLegacyMutation = (quoteId: string) => {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  const quotePartsQuery = useQuotePartsQuery(quoteId);
  
  return useMutation({
    mutationFn: async ({ partId, updates }: { partId: string; updates: Partial<Part> }) => {
      // Find the quote_parts record for this part in this quote
      const quotePart = quotePartsQuery.data?.find(qp => qp.partId === partId);
      
      if (!quotePart) {
        throw new Error(`Quote part not found for part ${partId} in quote ${quoteId}`);
      }
      
      const { data, error } = await supabase
        .from('quote_parts')
        .update({
          final_price: updates.price,
          note: updates.note,
        })
        .eq('id', quotePart.quotePartId)
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    },
    onSuccess: async () => {
      // Check and update quote status if needed
      await checkAndUpdateQuoteStatus(quoteId);
      
      // Invalidate both quotes and the specific quote parts query
      queryClient.invalidateQueries({ queryKey: [...queryKeys.quotes, 'parts', quoteId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes });
    },
    onError: (error) => {
      console.error('Error updating quote part:', error);
      showSnackbar(`Failed to update part: ${error.message}`, 'error');
    },
  });
};

export const useDeletePartMutation = () => {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('parts')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parts });
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes });
    },
    onError: (error) => {
      console.error('Error deleting part:', error);
      showSnackbar(`Failed to delete part: ${error.message}`, 'error');
    },
  });
};

export const useUpdateMultiplePartsMutation = () => {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  
  return useMutation({
    mutationFn: async (updates: Array<{ id: string; updates: Partial<Part> }>) => {
      console.log('🔧 Updating multiple parts:', updates.length);
      
      const results = await Promise.all(
        updates.map(async ({ id, updates: partUpdates }) => {
          console.log('🔧 Updating part:', id, 'with updates:', partUpdates);
          
          // First, update the parts table (legacy)
          const { data, error } = await supabase
            .from('parts')
            .update({
              part_name: partUpdates.name,
              part_number: partUpdates.number,
              price: partUpdates.price,
            })
            .eq('id', id)
            .select()
            .single();
          
          if (error) {
            throw new Error(`Error updating part ${id}: ${error.message}`);
          }

          // If price or note is being updated, also update quote_parts
          if (partUpdates.price !== undefined || partUpdates.note !== undefined) {
            console.log('💰 Price or note update detected for part:', id);
            console.log('📝 Note value being updated:', partUpdates.note);
            
            // Find all quote_parts that reference this part
            const { data: quotePartsData, error: quotePartsError } = await supabase
              .from('quote_parts')
              .select('id, quote_id')
              .eq('part_id', id);

            if (quotePartsError) {
              console.error('❌ Error fetching quote_parts for part:', id, quotePartsError);
            } else if (quotePartsData && quotePartsData.length > 0) {
              console.log('📋 Found quote_parts to update for part:', id, quotePartsData.length);
              
              // Update each quote_parts entry
              for (const quotePart of quotePartsData) {
                const updateData: any = {};
                if (partUpdates.price !== undefined) updateData.final_price = partUpdates.price;
                if (partUpdates.note !== undefined) updateData.note = partUpdates.note;
                
                console.log('📝 Updating quote_part with data:', updateData);
                
                const { error: updateError } = await supabase
                  .from('quote_parts')
                  .update(updateData)
                  .eq('id', quotePart.id);

                if (updateError) {
                  console.error('❌ Error updating quote_part:', updateError);
                } else {
                  console.log('✅ Updated quote_part:', quotePart.id, 'with note:', updateData.note);
                  
                  // Check and update quote status
                  await checkAndUpdateQuoteStatus(quotePart.quote_id);
                }
              }
            } else {
              console.log('⚠️ No quote_parts found for part:', id);
            }
          }
          
          return {
            id: data.id,
            name: data.part_name,
            number: data.part_number || '',
            price: data.price,
            note: partUpdates.note || '', // Use the note from updates since it's not in parts table
            createdAt: data.created_at,
          };
        })
      );
      
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parts });
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes });
    },
    onError: (error) => {
      console.error('Error updating multiple parts:', error);
      showSnackbar(`Failed to update parts: ${error.message}`, 'error');
    },
  });
}; 