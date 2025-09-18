'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '@/utils/supabase';
import { Quote, Part, QuotePart, QuotePartItem } from '@/components/ui/useQuotes';
import { PartWithVariants } from '@/types/part';
import { useSnackbar } from '@/components/ui/Snackbar';
import { updatePartInQuote, quoteHasPartWithPrice } from '@/utils/quotePartsHelpers';
import { createNormalizedQuote } from '@/utils/normalizedQuoteCreation';

// Query Keys - centralized for consistency
export const queryKeys = {
  quotes: (page: number = 1, limit: number = 20, filters?: { status?: string; customer?: string; make?: string; search?: string }) => ['quotes', page, limit, filters] as const,
  quotesBase: ['quotes'] as const, // Base key for invalidating all quote queries
  parts: ['parts'] as const,
  quote: (id: string) => ['quotes', id] as const,
  part: (id: string) => ['parts', id] as const,
  userProfile: (id: string) => ['userProfile', id] as const,
};

// Fetch functions
const fetchQuotes = async (page: number = 1, limit: number = 20, filters?: { status?: string; customer?: string; make?: string; search?: string }): Promise<{ quotes: Quote[]; total: number; totalPages: number }> => {
  try {
    // Build the base query
    let query = supabase
      .from('quotes')
      .select(`
        *,
        customer:customers(*),
        vehicle:vehicles(*)
      `, { count: 'exact' }); // Get exact count for pagination

    // Apply filters if provided
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.customer) {
      query = query.ilike('customer.name', `%${filters.customer}%`);
    }
    if (filters?.make) {
      query = query.ilike('vehicle.make', `%${filters.make}%`);
    }
    
    // Apply search filter - smart search by quote_ref and vehicle make
    if (filters?.search && filters.search.trim()) {
      const searchTerm = filters.search.trim();
      
      // Check if the search term looks like a quote reference (primarily numeric)
      const numericChars = (searchTerm.match(/\d/g) || []).length;
      const totalChars = searchTerm.length;
      const isNumericSearch = numericChars > totalChars / 2; // More than half are numbers
      
      if (isNumericSearch) {
        // For numeric searches, focus primarily on quote_ref
        // Only include vehicle make if it's a very short search term
        if (searchTerm.length >= 4) {
          query = query.ilike('quote_ref', `%${searchTerm}%`);
        } else {
          query = query.or(`quote_ref.ilike.*${searchTerm}*,vehicle.make.ilike.*${searchTerm}*`);
        }
      } else {
        // For non-numeric searches (like brand names), search vehicle make
        query = query.ilike('vehicle.make', `%${searchTerm}%`);
      }
    }

    // Apply pagination using Supabase range
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit - 1; // Supabase range is inclusive
    query = query.range(startIndex, endIndex);

    // Order by creation date (newest first)
    query = query.order('created_at', { ascending: false });

    // Execute the query
    const { data: normalizedQuotes, error: quotesError, count } = await query;

    if (quotesError) {
      console.error('Error fetching normalized quotes:', quotesError);
      throw new Error(quotesError.message);
    }

    // Convert normalized quotes to legacy format for QuoteTable compatibility
    const legacyQuotes: Quote[] = (normalizedQuotes || []).map(normalizedQuote => {
      // Use JSON parts_requested for all quotes
      let partsRequested: any[] = [];
      let partIds = '';

      if (normalizedQuote.parts_requested && Array.isArray(normalizedQuote.parts_requested)) {
        partsRequested = normalizedQuote.parts_requested;
        partIds = partsRequested.map(p => p.part_id).join(',');
      } else {
        // Fallback for quotes without parts
        partsRequested = [];
        partIds = '';
      }

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

      return legacyQuote;
    });

    // Calculate pagination info using the count from Supabase
    const total = count || 0;
    const totalPages = Math.ceil(total / limit);
    
    return {
      quotes: legacyQuotes,
      total,
      totalPages
    };
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
        list_price: part.list_price || null,
        af: part.af || false,
        note: '', // Notes are now stored in parts_requested JSON, not parts table
        createdAt: part.created_at,
      }));

    return legacyParts;
  } catch (error) {
    console.error('Error fetching normalized parts:', error);
    throw error;
  }
};

// Custom hooks using TanStack Query
export const useQuotesQuery = (page: number = 1, limit: number = 20, filters?: { status?: string; customer?: string; make?: string; search?: string }) => {
  return useQuery({
    queryKey: queryKeys.quotes(page, limit, filters),
    queryFn: () => fetchQuotes(page, limit, filters),
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

// DEPRECATED: This function used the old quote_parts table
// Use useQuotePartsFromJson instead for JSON-based quote parts
export const useQuotePartsQuery = (quoteId: string) => {
  console.warn('useQuotePartsQuery is deprecated. Use useQuotePartsFromJson instead.');
  return useQuery({
    queryKey: [...queryKeys.quotesBase, 'parts', quoteId],
    queryFn: async () => {
      throw new Error('useQuotePartsQuery is deprecated. Use useQuotePartsFromJson instead.');
    },
    enabled: false, // Disabled to prevent usage
  });
};

// Helper function to convert QuotePart to legacy Part format for UI compatibility
export const quotePartToLegacyPart = (quotePart: QuotePart): Part => ({
  id: quotePart.partId,
  name: quotePart.partName,
  number: quotePart.partNumber,
  price: quotePart.finalPrice, // Only use manually set final price, no automatic fallback
  list_price: quotePart.list_price || null,
  af: quotePart.af || false,
  note: quotePart.note,
  createdAt: quotePart.createdAt,
});

// Hook to get parts from the quote's parts_requested JSON column with part details from parts table
export const useQuotePartsFromJson = (quoteId: string) => {
  return useQuery({
    queryKey: [...queryKeys.quotesBase, 'json-parts', quoteId],
    queryFn: async () => {
      if (!quoteId) {
        return [];
      }

      // Get the quote with its parts_requested JSON
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('parts_requested')
        .eq('id', quoteId)
        .maybeSingle();

            if (quoteError) {
        console.error('❌ Error fetching quote for parts:', quoteError);
        console.error('❌ QuoteId was:', quoteId);
        throw new Error(quoteError.message);
      }
      
      if (!quote) {
        return [];
      }
      
      if (!quote.parts_requested || !Array.isArray(quote.parts_requested)) {
        return [];
      }

      // Extract part IDs from the JSON
      const partIds = quote.parts_requested.map((partItem: any) => partItem.part_id);

      if (partIds.length === 0) {
        return [];
      }

      // Fetch part details from the parts table
      const { data: partsData, error: partsError } = await supabase
        .from('parts')
        .select('*')
        .in('id', partIds);

      if (partsError) {
        console.error('Error fetching parts data:', partsError);
        throw new Error(partsError.message);
      }

      // Create a map of part data by ID for quick lookup
      const partsMap = new Map();
      (partsData || []).forEach(part => {
        partsMap.set(part.id, part);
      });

      // Combine JSON data with parts table data
      const legacyParts: PartWithVariants[] = quote.parts_requested.map((partItem: any) => {
        const partData = partsMap.get(partItem.part_id);
        
        // Get price and note from variants (use default variant only - no fallback to part level)
        const defaultVariant = partItem.variants?.find((v: any) => v.is_default === true);
        

        
        const legacyPart = {
          id: partItem.part_id,
          name: partData?.part_name || '',
          number: partData?.part_number || '',
          price: defaultVariant?.final_price || null,
          note: defaultVariant?.note || '',
          createdAt: partData?.created_at || new Date().toISOString(),
                  // Add variants array to match QuoteTable's expected structure
        variants: partItem.variants || []
      };
      
      return legacyPart;
    });
    
    return legacyParts;
    },
    enabled: !!quoteId,
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on mount if data is fresh
  });
};

// Helper function to update parts in the quote's parts_requested JSON column
export const updatePartInQuoteJson = async (quoteId: string, partId: string, updates: any) => {
  try {
    // Get the current quote's parts_requested JSON
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('parts_requested')
      .eq('id', quoteId)
      .single();

    if (quoteError) {
      throw new Error(`Error fetching quote: ${quoteError.message}`);
    }

    if (!quote.parts_requested || !Array.isArray(quote.parts_requested)) {
      throw new Error('No parts found in quote');
    }

    // Update the part in the JSON structure using variants
    const updatedPartsRequested = quote.parts_requested.map((partItem: any) => {
      if (partItem.part_id === partId) {
        const updatedPart = { ...partItem };
        
        // Handle price and note updates through variants
        if (updates.price !== undefined || updates.note !== undefined) {
          const variants = partItem.variants || [];
          
          // Find existing default variant or create new one
          const defaultVariantIndex = variants.findIndex((v: any) => v.is_default === true);
          
          if (defaultVariantIndex === -1) {
            // Create new default variant
            const newVariant = {
              id: `var_${partId}_${Date.now()}`,
              note: updates.note || '',
              final_price: updates.price || null,
              created_at: new Date().toISOString(),
              is_default: true
            };
            updatedPart.variants = [newVariant];
          } else {
            // Update existing default variant
            const updatedVariants = [...variants];
            updatedVariants[defaultVariantIndex] = {
              ...updatedVariants[defaultVariantIndex],
              ...(updates.note !== undefined && { note: updates.note }),
              ...(updates.price !== undefined && { final_price: updates.price }),
            };
            updatedPart.variants = updatedVariants;
          }
          
          // Update the part-level final_price based on variants
          updatedPart.final_price = updatedPart.variants.reduce((sum: number, variant: any) => {
            return sum + (variant.final_price || 0);
          }, 0);
        }
        
        return updatedPart;
      }
      return partItem;
    });
    
                  // Check if all parts now have prices to determine if status should change
        const allPartsHavePrices = updatedPartsRequested.every((part: any) => {
          const defaultVariant = part.variants?.find((v: any) => v.is_default === true);
          const hasPrice = defaultVariant?.final_price && defaultVariant.final_price > 0;
          return hasPrice;
        });

        // Update the quote with the modified parts_requested JSON and potentially status
        const updateData: any = { parts_requested: updatedPartsRequested };
        
        // If all parts now have prices, update status to 'priced'
        if (allPartsHavePrices) {
          updateData.status = 'priced';
        }

      const { error: updateError } = await supabase
        .from('quotes')
        .update(updateData)
        .eq('id', quoteId);

      if (updateError) {
        throw new Error(`Error updating quote: ${updateError.message}`);
      }

    // If updating name or number, also update the parts table
    if (updates.name !== undefined || updates.number !== undefined) {
      const partUpdateData: any = {};
      if (updates.name !== undefined) partUpdateData.part_name = updates.name;
      if (updates.number !== undefined) partUpdateData.part_number = updates.number;
      
      const { error: partError } = await supabase
        .from('parts')
        .update(partUpdateData)
        .eq('id', partId);

      if (partError) {
        console.warn('Warning: Could not update part in parts table:', partError);
      }
    }

    // Return the updated part data
    const updatedPart = updatedPartsRequested.find((p: any) => p.part_id === partId);
    
    // Get the latest part data from parts table
    const { data: partData, error: partFetchError } = await supabase
      .from('parts')
      .select('*')
      .eq('id', partId)
      .single();

    if (partFetchError) {
      console.warn('Warning: Could not fetch updated part data:', partFetchError);
    }

    // Get price and note from variants
    const defaultVariant = updatedPart.variants?.find((v: any) => v.is_default === true);
    
    const legacyPart = {
      id: updatedPart.part_id,
      name: partData?.part_name || '',
      number: partData?.part_number || '',
      price: defaultVariant?.final_price || null,
      note: defaultVariant?.note || '',
      createdAt: partData?.created_at || new Date().toISOString(),
    };

    return { data: legacyPart, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
  }
};

// Helper function to get legacy parts array from quote parts (DEPRECATED - use useQuotePartsFromJson instead)
export const useQuotePartsAsLegacyParts = (quoteId: string) => {
  console.warn('useQuotePartsAsLegacyParts is deprecated. Use useQuotePartsFromJson instead.');
  return {
    data: [],
    partToQuotePartMap: {},
    isLoading: false,
    error: null,
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
    onSuccess: (data) => {
      // Invalidate and refetch quotes after successful creation
      queryClient.invalidateQueries({ queryKey: queryKeys.quotesBase });
      queryClient.invalidateQueries({ queryKey: queryKeys.parts });
      // Also invalidate the specific all-parts-for-quotes queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['all-parts-for-quotes'] });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.quotesBase });
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
      queryClient.invalidateQueries({ queryKey: queryKeys.quotesBase });
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
      
      // Note: Price and note updates are now handled through quote_parts table
      // This mutation only updates basic part info (name, number)
      // For price/note updates, use useUpdateQuotePartMutation instead

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
        list_price: updates.list_price ?? updatedPart?.list_price ?? null,
        af: updates.af ?? updatedPart?.af ?? false,
        note: updates.note || '',
        createdAt: updatedPart?.created_at || new Date().toISOString(),
      };

      return legacyPart;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.parts });
      queryClient.invalidateQueries({ queryKey: queryKeys.quotesBase });
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
        list_price: data.list_price || null,
        af: data.af || false,
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
      queryClient.invalidateQueries({ queryKey: queryKeys.quotesBase });
    },
    onError: (error) => {
      console.error('Error updating quote part:', error);
      showSnackbar(`Failed to update quote part: ${error.message}`, 'error');
    },
  });
};

// Mutation to update quote parts using legacy Part interface (for UI compatibility) - DEPRECATED
export const useUpdateQuotePartLegacyMutation = (quoteId: string) => {
  console.warn('useUpdateQuotePartLegacyMutation is deprecated. Use useUpdatePartInQuoteJsonMutation instead.');
  
  return useMutation({
    mutationFn: async ({ partId, updates }: { partId: string; updates: Partial<Part> }) => {
      throw new Error('useUpdateQuotePartLegacyMutation is deprecated. Use useUpdatePartInQuoteJsonMutation instead.');
    },
    onSuccess: async () => {},
    onError: (error) => {
      console.error('Error updating quote part:', error);
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
      queryClient.invalidateQueries({ queryKey: queryKeys.quotesBase });
    },
    onError: (error) => {
      console.error('Error deleting part:', error);
      showSnackbar(`Failed to delete part: ${error.message}`, 'error');
    },
  });
};

// Mutation hook for updating parts in JSON quotes with automatic cache invalidation
export const useUpdatePartInQuoteJsonMutation = () => {
  const queryClient = useQueryClient();
  const { showSnackbar } = useSnackbar();
  
  return useMutation({
    mutationFn: async ({ quoteId, partId, updates }: { quoteId: string; partId: string; updates: any }) => {
      
      // Get the current quote's parts_requested JSON
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .select('parts_requested')
        .eq('id', quoteId)
        .single();

      if (quoteError) {
        throw new Error(`Error fetching quote: ${quoteError.message}`);
      }

      if (!quote.parts_requested || !Array.isArray(quote.parts_requested)) {
        throw new Error('No parts found in quote');
      }


      // Update the part in the JSON structure using variants
      const updatedPartsRequested = quote.parts_requested.map((partItem: any) => {
        if (partItem.part_id === partId) {
          const updatedPart = { ...partItem };
          
          // Handle price and note updates through variants
          if (updates.price !== undefined || updates.note !== undefined) {
            const variants = partItem.variants || [];
            
            // Check if we have a specific variantId to update
            if (updates.variantId) {
              
              // Find existing variant by ID
              const variantIndex = variants.findIndex((v: any) => v.id === updates.variantId);
              
              if (variantIndex !== -1) {
                // Update existing variant
                const updatedVariants = [...variants];
                updatedVariants[variantIndex] = {
                  ...updatedVariants[variantIndex],
                  ...(updates.note !== undefined && { note: updates.note }),
                  ...(updates.price !== undefined && { final_price: updates.price }),
                  ...(updates.list_price !== undefined && { list_price: updates.list_price }),
                  ...(updates.af !== undefined && { af: updates.af }),
                };
                updatedPart.variants = updatedVariants;
              } else {
                // Create new variant with specific ID
                const newVariant = {
                  id: updates.variantId,
                  note: updates.note || '',
                  final_price: updates.price || null,
                  list_price: updates.list_price || null,
                  af: updates.af || false,
                  created_at: new Date().toISOString(),
                  is_default: false
                };
                updatedPart.variants = [...variants, newVariant];
              }
            } else {
              // Fallback: Find existing default variant or create new one (legacy behavior)
              const defaultVariantIndex = variants.findIndex((v: any) => v.is_default === true);
              
              if (defaultVariantIndex === -1) {
                // Create new default variant
                const newVariant = {
                  id: `var_${partId}_${Date.now()}`,
                  note: updates.note || '',
                  final_price: updates.price || null,
                  list_price: updates.list_price || null,
                  af: updates.af || false,
                  created_at: new Date().toISOString(),
                  is_default: true
                };
                updatedPart.variants = [newVariant];
              } else {
                // Update existing default variant
                const updatedVariants = [...variants];
                updatedVariants[defaultVariantIndex] = {
                  ...updatedVariants[defaultVariantIndex],
                  ...(updates.note !== undefined && { note: updates.note }),
                  ...(updates.price !== undefined && { final_price: updates.price }),
                  ...(updates.list_price !== undefined && { list_price: updates.list_price }),
                  ...(updates.af !== undefined && { af: updates.af }),
                };
                updatedPart.variants = updatedVariants;
              }
            }
            
            // Note: We don't update part-level final_price anymore - only variants contain pricing info
          }
          
          return updatedPart;
        }
        return partItem;
      });
      
      // Get current quote status before updating
      const { data: currentQuoteData, error: currentQuoteError } = await supabase
        .from('quotes')
        .select('status')
        .eq('id', quoteId)
        .single();
      
      if (currentQuoteError) {
        throw new Error(`Error fetching current quote status: ${currentQuoteError.message}`);
      }
      
      const currentStatus = currentQuoteData?.status;

      // Check if ANY part now has a price to determine if status should change
      const anyPartHasPrice = updatedPartsRequested.some((part: any) => {
        // Check if any variant has a price (not just default variant)
        const hasAnyVariantWithPrice = part.variants?.some((variant: any) => 
          variant.final_price && variant.final_price > 0
        );
        return hasAnyVariantWithPrice;
      });

      // Update the quote with the modified parts_requested JSON and potentially status
      const updateData: any = { parts_requested: updatedPartsRequested };
      
      // If any part now has a price, update status to 'waiting_verification' (unless already in a higher status)
      const shouldChangeToWaitingVerification = anyPartHasPrice && 
        currentStatus === 'unpriced';
      
      if (shouldChangeToWaitingVerification) {
        updateData.status = 'waiting_verification';
      }


      const { error: updateError } = await supabase
        .from('quotes')
        .update(updateData)
        .eq('id', quoteId);

      if (updateError) {
        throw new Error(`Error updating quote: ${updateError.message}`);
      }


      // Track PRICED action only when status changes from unpriced to waiting_verification
      if (shouldChangeToWaitingVerification) {
        try {
          const { QuoteActionsService } = await import('@/services/quoteActions/quoteActionsService');
          await QuoteActionsService.trackQuoteAction(quoteId, 'PRICED');
        } catch (trackingError) {
          console.warn('Failed to track PRICED action:', trackingError);
          // Don't fail the operation if tracking fails
        }
      }

      // If updating name or number, also update the parts table
      if (updates.name !== undefined || updates.number !== undefined) {
        const partUpdateData: any = {};
        if (updates.name !== undefined) partUpdateData.part_name = updates.name;
        if (updates.number !== undefined) partUpdateData.part_number = updates.number;
        
        const { error: partError } = await supabase
          .from('parts')
          .update(partUpdateData)
          .eq('id', partId);

        if (partError) {
          console.warn('Warning: Could not update part in parts table:', partError);
        }
      }

      // Return the updated part data
      const updatedPart = updatedPartsRequested.find((p: any) => p.part_id === partId);
      
      // Get the latest part data from parts table
      const { data: partData, error: partFetchError } = await supabase
        .from('parts')
        .select('*')
        .eq('id', partId)
        .single();

      if (partFetchError) {
        console.warn('Warning: Could not fetch updated part data:', partFetchError);
      }

      // Get price and note from variants only
      const defaultVariant = updatedPart.variants?.find((v: any) => v.is_default === true);
      
      const legacyPart = {
        id: updatedPart.part_id,
        name: partData?.part_name || '',
        number: partData?.part_number || '',
        price: defaultVariant?.final_price || null,
        note: defaultVariant?.note || '',
        createdAt: partData?.created_at || new Date().toISOString(),
      };

      return { data: legacyPart, error: null };
    },
    onSuccess: (data, variables) => {
      // Invalidate both the specific parts query and the base quotes to handle structural changes
      const partsKey = [...queryKeys.quotesBase, 'json-parts', variables.quoteId];
      
      // Invalidate the parts query
      queryClient.invalidateQueries({ queryKey: partsKey });
      
      // Also invalidate the base quotes to handle structural changes (like new variants)
      queryClient.invalidateQueries({ queryKey: queryKeys.quotesBase });
      
      // Force refetch the parts to ensure immediate update
      queryClient.refetchQueries({ queryKey: partsKey });
      
      showSnackbar('Part updated successfully!', 'success');
    },
    onError: (error) => {
      console.error('Error updating part in quote JSON:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      showSnackbar(`Error updating part: ${errorMessage}`, 'error');
    },
  });
};
