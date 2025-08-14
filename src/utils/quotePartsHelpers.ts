import { Quote, Part, QuotePartItem } from '@/components/ui/useQuotes';

// Helper functions for working with JSON parts in quotes

/**
 * Get parts for a quote from the new JSON structure
 */
export const getQuotePartsFromJson = (quote: Quote, allParts: Part[]): Part[] => {
  if (!quote.partsRequested || !Array.isArray(quote.partsRequested)) {
    // Fallback to legacy partRequested string
    return getQuotePartsFromLegacy(quote.partRequested, allParts);
  }

  return quote.partsRequested.map(quotePart => {
    // Find the base part data
    const basePart = allParts.find(p => p.id === quotePart.part_id);
    
    if (!basePart) {
      // Create a placeholder if part not found
      const defaultVariant = quotePart.variants?.[0];
      return {
        id: quotePart.part_id,
        name: 'Unknown Part',
        number: '',
        price: defaultVariant?.final_price ?? null,
        note: defaultVariant?.note || '',
        createdAt: new Date().toISOString()
      };
    }

    // Get the default variant or first variant
    const defaultVariant = quotePart.variants?.find(v => v.is_default) || quotePart.variants?.[0];

    // Merge base part data with quote-specific data
    return {
      ...basePart,
      price: defaultVariant?.final_price ?? basePart.price, // Use variant price if available, otherwise fall back to base part price
      note: defaultVariant?.note || ''
    };
  });
};

/**
 * Legacy helper for backward compatibility
 */
const getQuotePartsFromLegacy = (partRequested: string, allParts: Part[]): Part[] => {
  if (!partRequested) return [];
  
  const partIds = partRequested.split(',').map(id => id.trim());
  return allParts.filter(part => partIds.includes(part.id));
};

/**
 * Add a part to a quote's JSON parts array
 */
export const addPartToQuote = (quote: Quote, partId: string, note: string = '', finalPrice: number | null = null): QuotePartItem[] => {
  const currentParts = quote.partsRequested || [];
  
  // Check if part already exists
  const existingPartIndex = currentParts.findIndex(p => p.part_id === partId);
  
  if (existingPartIndex >= 0) {
    // Update existing part - add new variant
    const updatedParts = [...currentParts];
    const existingPart = updatedParts[existingPartIndex];
    
    const newVariant = {
      id: `var_${partId}_${Date.now()}`,
      note,
      final_price: finalPrice,
      created_at: new Date().toISOString(),
      is_default: false
    };
    
    updatedParts[existingPartIndex] = {
      ...existingPart,
      variants: [...(existingPart.variants || []), newVariant]
    };
    
    return updatedParts;
  } else {
    // Add new part with first variant
    return [
      ...currentParts,
      {
        part_id: partId,
        variants: [{
          id: `var_${partId}_${Date.now()}`,
          note,
          final_price: finalPrice,
          created_at: new Date().toISOString(),
          is_default: true
        }]
      }
    ];
  }
};

/**
 * Remove a part from a quote's JSON parts array
 */
export const removePartFromQuote = (quote: Quote, partId: string): QuotePartItem[] => {
  const currentParts = quote.partsRequested || [];
  return currentParts.filter(p => p.part_id !== partId);
};

/**
 * Update a part's note or price in a quote's JSON parts array
 */
export const updatePartInQuote = (
  quote: Quote, 
  partId: string, 
  updates: { note?: string; final_price?: number | null }
): QuotePartItem[] => {
  const currentParts = quote.partsRequested || [];
  
  return currentParts.map(p => 
    p.part_id === partId 
      ? { 
          ...p, 
          variants: p.variants.map(v => 
            v.is_default 
              ? { 
                  ...v, 
                  ...(updates.note !== undefined && { note: updates.note }),
                  ...(updates.final_price !== undefined && { final_price: updates.final_price })
                }
              : v
          )
        }
      : p
  );
};

/**
 * Convert JSON parts array to legacy comma-separated string (for backward compatibility)
 */
export const partsJsonToLegacyString = (partsRequested: QuotePartItem[]): string => {
  return partsRequested.map(p => p.part_id).join(',');
};

/**
 * Check if a quote has any parts with prices (for status determination)
 */
export const quoteHasPartWithPrice = (quote: Quote): boolean => {
  if (!quote.partsRequested || !Array.isArray(quote.partsRequested)) {
    return false;
  }
  
  return quote.partsRequested.some(p => 
    p.variants?.some(v => v.final_price !== null && v.final_price !== undefined && v.final_price > 0)
  );
}; 