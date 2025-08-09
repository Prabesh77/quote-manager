'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import supabase from '@/utils/supabase';
import { Quote, Part } from '@/components/ui/useQuotes';
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
      name: part.name,
      number: part.number,
      price: part.price,
      note: part.notes || '',
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
    staleTime: 2 * 60 * 1000, // 2 minutes - quotes change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes cache time
    refetchOnWindowFocus: true, // Refetch when user comes back to the app
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
      const { data, error } = await supabase
        .from('parts')
        .update({
          name: updates.name,
          number: updates.number,
          price: updates.price,
          notes: updates.note,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Convert back to legacy format
      const legacyPart: Part = {
        id: data.id,
        name: data.name,
        number: data.number,
        price: data.price,
        note: data.notes || '',
        createdAt: data.created_at,
      };
      
      return legacyPart;
    },
    onSuccess: () => {
      // Invalidate both quotes and parts since they're related
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
          name: partData.name,
          number: partData.number,
          price: partData.price,
          notes: partData.note,
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Convert back to legacy format
      const legacyPart: Part = {
        id: data.id,
        name: data.name,
        number: data.number,
        price: data.price,
        note: data.notes || '',
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
          const { data, error } = await supabase
            .from('parts')
            .update({
              name: partUpdates.name,
              number: partUpdates.number,
              price: partUpdates.price,
              notes: partUpdates.note,
            })
            .eq('id', id)
            .select()
            .single();
          
          if (error) {
            throw new Error(`Error updating part ${id}: ${error.message}`);
          }
          
          return {
            id: data.id,
            name: data.name,
            number: data.number,
            price: data.price,
            note: data.notes || '',
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