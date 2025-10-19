import supabase from '@/utils/supabase';

/**
 * Finds an existing part by part number and name, or creates a new one
 * Returns the part ID to use in quotes
 */
export const findOrCreatePart = async (
  partData: {
    name: string;
    number?: string;
    price?: number | null;
    note?: string;
  },
  vehicleId?: string
): Promise<{ partId: string; isNew: boolean; error: string | null }> => {
  try {
    // Check if a part with the same number and name already exists
    if (partData.number && partData.name) {
      const { data: existingParts, error: checkError } = await supabase
        .from('parts')
        .select('id, part_name, part_number')
        .eq('part_number', partData.number)
        .eq('part_name', partData.name)
        .limit(1);
      
      if (checkError) {
        console.error('Error checking for existing part:', checkError);
        return { partId: '', isNew: false, error: checkError.message };
      }
      
      if (existingParts && existingParts.length > 0) {
        // Reuse existing part
        const partId = existingParts[0].id;
        console.log(`✓ Reusing existing part: ${partData.number} - ${partData.name} (ID: ${partId})`);
        return { partId, isNew: false, error: null };
      }
    }
    
    // Create new part
    const { data: newPart, error: partError } = await supabase
      .from('parts')
      .insert({
        vehicle_id: vehicleId || null,
        part_name: partData.name,
        part_number: partData.number || null,
        price: partData.price || null,
        note: partData.note || null,
      })
      .select('id')
      .single();

    if (partError) {
      console.error('Error creating part:', partError);
      return { partId: '', isNew: true, error: partError.message };
    }
    
    console.log(`✓ Created new part: ${partData.number} - ${partData.name} (ID: ${newPart.id})`);
    return { partId: newPart.id, isNew: true, error: null };
  } catch (error) {
    console.error('Error in findOrCreatePart:', error);
    return { 
      partId: '', 
      isNew: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Price history entry structure
 */
interface PriceHistoryEntry {
  final_price: number;
  list_price: number | null;
  quote_id: string;
  quote_ref: string;
  priced_at: string;
  variant_id?: string;
}

interface PriceHistory {
  price_history: PriceHistoryEntry[];
}

/**
 * Add a price to a part's price history (keeps last 3)
 * Extracts price from the default variant or first variant
 */
export const addPriceToHistory = async (
  partId: string,
  finalPrice: number,
  listPrice: number | null,
  quoteId: string,
  quoteRef: string,
  variantId?: string
): Promise<{ success: boolean; error: string | null }> => {
  try {
    // Fetch current price history
    const { data: part, error: fetchError } = await supabase
      .from('parts')
      .select('last_prices')
      .eq('id', partId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching part for price history:', fetchError);
      return { success: false, error: fetchError.message };
    }

    // Get existing history or initialize empty
    const currentHistory: PriceHistory = part?.last_prices || { price_history: [] };
    const historyArray = currentHistory.price_history || [];

    // Create new entry
    const newEntry: PriceHistoryEntry = {
      final_price: finalPrice,
      list_price: listPrice,
      quote_id: quoteId,
      quote_ref: quoteRef,
      priced_at: new Date().toISOString(),
      variant_id: variantId,
    };

    // Add to beginning of array (most recent first)
    const updatedHistory = [newEntry, ...historyArray];

    // Keep only last 3
    const trimmedHistory = updatedHistory.slice(0, 3);

    // Update the part
    const { error: updateError } = await supabase
      .from('parts')
      .update({ 
        last_prices: { price_history: trimmedHistory } 
      })
      .eq('id', partId);

    if (updateError) {
      console.error('Error updating price history:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`✓ Added price $${finalPrice} to history for part ${partId} (quote: ${quoteRef})`);
    return { success: true, error: null };
  } catch (error) {
    console.error('Error in addPriceToHistory:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
};

/**
 * Update price history for all parts in a quote when it's marked as priced
 * Extracts prices from parts_requested JSON and updates each part's history
 */
export const updatePriceHistoryForQuote = async (
  quoteId: string,
  partsRequested: Array<{
    part_id: string;
    variants: Array<{
      id: string;
      final_price: number | null;
      list_price: number | null;
      is_default?: boolean;
    }>;
  }>,
  quoteRef: string
): Promise<{ success: boolean; error: string | null; updatedCount: number }> => {
  try {
    let updatedCount = 0;

    for (const partItem of partsRequested) {
      // Find the default variant or use the first one
      const defaultVariant = partItem.variants.find(v => v.is_default) || partItem.variants[0];

      // Skip if no variant or no price
      if (!defaultVariant || defaultVariant.final_price === null || defaultVariant.final_price === undefined) {
        continue;
      }

      // Add to price history
      const result = await addPriceToHistory(
        partItem.part_id,
        defaultVariant.final_price,
        defaultVariant.list_price,
        quoteId,
        quoteRef,
        defaultVariant.id
      );

      if (result.success) {
        updatedCount++;
      } else {
        console.warn(`Failed to update price history for part ${partItem.part_id}:`, result.error);
      }
    }

    console.log(`✓ Updated price history for ${updatedCount} parts in quote ${quoteRef}`);
    return { success: true, error: null, updatedCount };
  } catch (error) {
    console.error('Error in updatePriceHistoryForQuote:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      updatedCount: 0
    };
  }
};

