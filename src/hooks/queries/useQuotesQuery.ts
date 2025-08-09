'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '@/utils/supabase';
import { Quote, Part, QuotePart, QuotePartItem } from '@/components/ui/useQuotes';
import { useSnackbar } from '@/components/ui/Snackbar';
import { updatePartInQuote, quoteHasPartWithPrice } from '@/utils/quotePartsHelpers';
import { createNormalizedQuote } from '@/utils/normalizedQuoteCreation';

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

    console.log('Normalized quotes found:', normalizedQuotes?.length || 0);

    // Convert normalized quotes to legacy format for QuoteTable compatibility
    const legacyQuotes: Quote[] = (normalizedQuotes || []).map(normalizedQuote => {
      // Use new JSON parts_requested if available, otherwise fall back to quote_parts table
      let partsRequested: any[] = [];
      let partIds = '';

      if (normalizedQuote.parts_requested && Array.isArray(normalizedQuote.parts_requested)) {
        // New JSON format
        partsRequested = normalizedQuote.parts_requested;
        partIds = partsRequested.map(p => p.part_id).join(',');
        console.log('Using JSON parts for quote:', normalizedQuote.id.slice(0, 8), 'parts:', partsRequested.length);
      } else {
        // Legacy format - this will be removed after migration
        console.log('Using legacy parts format for quote:', normalizedQuote.id.slice(0, 8));
        partsRequested = [];
        partIds = ''; // Will be populated by legacy logic if needed
      }

      // Debug: Log the vehicle data to see what's available
      console.log('Vehicle data for quote', normalizedQuote.id, ':', normalizedQuote.vehicle);

      const legacyQuote = {
        id: normalizedQuote.id,
        vin: normalizedQuote.vehicle?.vin || '',
        partRequested: partIds, // Legacy field for backward compatibility
        partsRequested: partsRequested, // New JSON field
        quoteRef: normalizedQuote.quote_ref || `Q${normalizedQuote.id.slice(0, 8)}`, // Use stored quote_ref or fallback to generated
        createdAt: normalizedQuote.created_at,
        make: normalizedQuote.vehicle?.make || '',
        model: normalizedQuote.vehicle?.model || '',
        series: normalizedQuote.vehicle?.series || '',
        auto: normalizedQuote.vehicle?.auto ?? false, // Use boolean auto column directly
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
export const useCreateQuoteMutation = () => {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  
  return useMutation({
    mutationFn: async (quoteData: any) => {
      return await createNormalizedQuote(quoteData);
    },
    onSuccess: () => {
      // Invalidate and refetch quotes after successful creation
      queryClient.invalidateQueries({ queryKey: queryKeys.quotes });
      queryClient.invalidateQueries({ queryKey: queryKeys.parts });
    },
    onError: (error) => {
      console.error('Error creating quote:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showSnackbar(`Error creating quote: ${errorMessage}`, 'error');
    },
  });
};

export const useUpdateQuoteMutation = () => {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  
  return useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: Record<string, any> }) => {
      // Separate quote fields from vehicle fields
      const vehicleFields = ['make', 'model', 'series', 'mthyr', 'vin', 'rego', 'color', 'auto', 'body'];
      const quoteFields: Record<string, any> = {};
      const vehicleUpdates: Record<string, any> = {};
      
      // Separate the fields
      Object.keys(fields).forEach(key => {
        if (vehicleFields.includes(key)) {
          // Map frontend field names to database column names
          if (key === 'mthyr') {
            vehicleUpdates.year = fields[key];
          } else {
            vehicleUpdates[key] = fields[key];
          }
        } else {
          quoteFields[key] = fields[key];
        }
      });
      
      // Update vehicle fields if any exist
      if (Object.keys(vehicleUpdates).length > 0) {
        // First, get the vehicle_id from the quote
        const { data: quote, error: quoteError } = await supabase
          .from('quotes')
          .select('vehicle_id')
          .eq('id', id)
          .single();
        
        if (quoteError) {
          throw new Error(`Error fetching quote: ${quoteError.message}`);
        }
        
        // Update the vehicle
        const { error: vehicleError } = await supabase
          .from('vehicles')
          .update(vehicleUpdates)
          .eq('id', quote.vehicle_id);
        
        if (vehicleError) {
          throw new Error(`Error updating vehicle: ${vehicleError.message}`);
        }
      }
      
      // Update quote fields if any exist
      if (Object.keys(quoteFields).length > 0) {
        const { error: quoteError } = await supabase
          .from('quotes')
          .update(quoteFields)
          .eq('id', id);
        
        if (quoteError) {
          throw new Error(`Error updating quote: ${quoteError.message}`);
        }
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
      // First, update the parts table for basic info (name, number)
      if (updates.name !== undefined || updates.number !== undefined) {
        const partUpdateData: any = {};
        if (updates.name !== undefined) partUpdateData.part_name = updates.name;
        if (updates.number !== undefined) partUpdateData.part_number = updates.number;
        
        const { error: partError } = await supabase
          .from('parts')
          .update(partUpdateData)
          .eq('id', id);

        if (partError) {
          throw new Error(`Error updating part info: ${partError.message}`);
        }
      }
      
      // Update JSON structure for price and note (quote-specific data)
      if (updates.price !== undefined || updates.note !== undefined) {
        // Update new JSON structure with queryClient for cache invalidation
        await updatePartInJsonQuotes(id, {
          price: updates.price,
          note: updates.note
        }, queryClient);
      }

      // Get the updated part data for return
      const { data: updatedPart, error: fetchError } = await supabase
        .from('parts')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.warn('Warning: Could not fetch updated part data:', fetchError);
      }

      // Return the updated part in legacy format
      const legacyPart: Part = {
        id: id,
        name: updatedPart?.part_name || updates.name || '',
        number: updatedPart?.part_number || updates.number || '',
        price: updates.price ?? updatedPart?.price ?? null,
        note: updates.note || '',
        createdAt: updatedPart?.created_at || new Date().toISOString(),
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

// Legacy function removed - using checkAndUpdateQuoteStatusJson instead

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
        // Status will be updated by JSON structure automatically
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
      // Status will be updated by JSON structure automatically
      
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
      
      const results = await Promise.all(
        updates.map(async ({ id, updates: partUpdates }) => {
          
          // First, update the parts table for basic info (name, number)
          if (partUpdates.name !== undefined || partUpdates.number !== undefined) {
            const partUpdateData: any = {};
            if (partUpdates.name !== undefined) partUpdateData.part_name = partUpdates.name;
            if (partUpdates.number !== undefined) partUpdateData.part_number = partUpdates.number;
            
            const { error: partError } = await supabase
              .from('parts')
              .update(partUpdateData)
              .eq('id', id);

            if (partError) {
              throw new Error(`Error updating part ${id} info: ${partError.message}`);
            }
          }
          
          // Update JSON structure for price and note (quote-specific data)
          if (partUpdates.price !== undefined || partUpdates.note !== undefined) {
            // Update new JSON structure with queryClient for cache invalidation
            await updatePartInJsonQuotes(id, {
              price: partUpdates.price,
              note: partUpdates.note
            }, queryClient);
          }
          
          // Get the updated part data for return
          const { data: updatedPart, error: fetchError } = await supabase
            .from('parts')
            .select('*')
            .eq('id', id)
            .single();

          if (fetchError) {
            console.warn(`Warning: Could not fetch updated part data for ${id}:`, fetchError);
          }
          
          return {
            id: id,
            name: updatedPart?.part_name || partUpdates.name || '',
            number: updatedPart?.part_number || partUpdates.number || '',
            price: partUpdates.price ?? updatedPart?.price ?? null,
            note: partUpdates.note || '',
            createdAt: updatedPart?.created_at || new Date().toISOString(),
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

// Helper function to update parts in JSON structure
const updatePartInJsonQuotes = async (partId: string, updates: { price?: number | null; note?: string }, queryClient?: any) => {
  try {
    // Find all quotes that contain this part in their JSON structure
    const { data: quotesWithPart, error: fetchError } = await supabase
      .from('quotes')
      .select('id, parts_requested')
      .not('parts_requested', 'is', null);

    if (fetchError) {
      console.error('❌ Error fetching quotes for JSON update:', fetchError);
      return;
    }

    if (!quotesWithPart || quotesWithPart.length === 0) {
      return;
    }

    const updatedQuoteIds: string[] = [];

    // Update each quote that contains this part
    for (const quote of quotesWithPart) {
      if (!quote.parts_requested || !Array.isArray(quote.parts_requested)) continue;

      const partsArray = quote.parts_requested as QuotePartItem[];
      const partIndex = partsArray.findIndex((p: QuotePartItem) => p.part_id === partId);
      
      if (partIndex >= 0) {
        // Update the part in the JSON array
        const updatedParts = [...partsArray];
        const currentPart = updatedParts[partIndex];
        
        // Create a single update object with all changes
        const partUpdates: any = { ...currentPart };
        
        if (updates.price !== undefined) {
          partUpdates.final_price = updates.price;
        }
        if (updates.note !== undefined) {
          partUpdates.note = updates.note;
        }
        
        // Apply the single update
        updatedParts[partIndex] = partUpdates;

        // Update the quote with the modified JSON
        const { error: updateError } = await supabase
          .from('quotes')
          .update({ parts_requested: updatedParts })
          .eq('id', quote.id);

        if (updateError) {
          console.error('❌ Error updating quote JSON parts:', updateError);
        } else {
          updatedQuoteIds.push(quote.id);
          
          // Check and update quote status using new structure
          await checkAndUpdateQuoteStatusJson(quote.id, updatedParts);
        }
      }
    }

    // Invalidate React Query cache if queryClient is provided
    if (queryClient && updatedQuoteIds.length > 0) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.quotes });
    }

  } catch (error) {
    console.error('❌ Error in updatePartInJsonQuotes:', error);
  }
};

// Updated status check function for JSON structure
const checkAndUpdateQuoteStatusJson = async (quoteId: string, partsArray?: QuotePartItem[]) => {
  try {
    // Get current quote status
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('status, parts_requested')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      console.error('❌ Error fetching quote for status update:', quoteError);
      return;
    }

    // Only update if currently unpriced
    if (quote.status !== 'unpriced') {
      return;
    }

    // Use provided parts array or get from quote
    const parts = partsArray || (quote.parts_requested as QuotePartItem[]) || [];
    
    // Check if any part has a price
    const hasAnyPrice = parts.some((part: QuotePartItem) => 
      part.final_price !== null && part.final_price !== undefined && part.final_price > 0
    );

    if (hasAnyPrice) {
      console.log('💰 Quote has parts with prices, updating status to waiting_verification');
      
      const { error: statusUpdateError } = await supabase
        .from('quotes')
        .update({ status: 'waiting_verification' })
        .eq('id', quoteId);

      if (statusUpdateError) {
        console.error('❌ Error updating quote status:', statusUpdateError);
      } else {
        console.log('✅ Quote status updated to waiting_verification:', quoteId);
      }
    }
  } catch (error) {
    console.error('❌ Error in checkAndUpdateQuoteStatusJson:', error);
  }
}; 