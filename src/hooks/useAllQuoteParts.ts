import { useQuery } from '@tanstack/react-query';
import supabase from '@/utils/supabase';

export function useAllQuoteParts(quotes: any[]) {
  return useQuery({
    queryKey: ['all-parts-for-quotes', quotes.map(q => q.id)],
    queryFn: async () => {
      if (!quotes || quotes.length === 0) return [];
      
      // Get all quotes with their parts_requested JSON
      const { data: quotesWithParts, error: quotesError } = await supabase
        .from('quotes')
        .select('id, parts_requested')
        .in('id', quotes.map(q => q.id));

      if (quotesError) throw quotesError;

      // Extract all unique part IDs from all quotes
      const allPartIds = new Set<string>();
      quotesWithParts?.forEach(quote => {
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
        note: '', // Will be filled from quote-specific data
        createdAt: part.created_at
      })) || [];
      
      return mappedParts;
    },
    enabled: quotes && quotes.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
