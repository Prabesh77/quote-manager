import supabase from '@/utils/supabase';

/**
 * Service for fetching list prices from parts_list_price table
 */
export class PartsListPriceService {
  /**
   * Normalize part number by removing special characters for matching
   */
  private static normalizePartNumber(partNumber: string): string {
    if (!partNumber) return '';
    // Remove spaces, hyphens, and # symbols
    return partNumber.replace(/[\s\-#]/g, '').toUpperCase();
  }

  /**
   * Fetch sell price for a given part number (Stockcode)
   * Tries multiple variations of the part number to find a match
   * @param partNumber - The part number to search for
   * @returns Sell price or null if not found
   */
  static async fetchSellPrice(partNumber: string): Promise<number | null> {
    try {
      if (!partNumber || !partNumber.trim()) {
        return null;
      }

      const cleanPartNumber = partNumber.trim().toUpperCase();
      const normalizedPartNumber = this.normalizePartNumber(partNumber);
      console.log(`Fetching list price for part number: ${partNumber} (normalized: ${normalizedPartNumber})`);
      
      // Try multiple variations of the part number (avoid duplicates)
      const variations = new Set([
        cleanPartNumber, // Original format (uppercase)
        normalizedPartNumber, // No special chars: ABC123
        cleanPartNumber.replace(/[\s\-#]/g, '-'), // All with hyphens: ABC-123
        cleanPartNumber.replace(/[\s\-#]/g, ' '), // All with spaces: ABC 123
        cleanPartNumber.replace(/[\s\-#]/g, '#'), // All with #: ABC#123
      ]);

      // Try each unique variation until we find a match
      for (const variation of Array.from(variations)) {
        console.log(`Trying variation: ${variation}`);
        const { data: parts, error } = await supabase
          .from('parts_list_price')
          .select('Stockcode, "Sell Price"')
          .eq('Stockcode', variation)
          .limit(1);

        if (error) {
          console.error(`Error fetching with variation ${variation}:`, error);
          continue;
        }

        if (parts && parts.length > 0 && parts[0]['Sell Price']) {
          // Remove $ sign and any other currency symbols before parsing
          const priceString = String(parts[0]['Sell Price']).replace(/[$,\s]/g, '');
          const sellPrice = Number(priceString);
          if (!isNaN(sellPrice)) {
            console.log(`✅ Found match for ${partNumber} using variation "${variation}": $${sellPrice}`);
            return sellPrice;
          }
        }
      }

      console.log(`No list price found for part number: ${partNumber} (tried ${variations.length} variations)`);
      return null;
    } catch (error) {
      console.error('Error in fetchSellPrice:', error);
      return null;
    }
  }
}

