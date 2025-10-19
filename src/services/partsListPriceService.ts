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
   * If multiple supersession numbers are provided (comma-separated), uses ONLY the FIRST one
   * @param partNumber - The part number to search for (can be comma-separated supersessions)
   * @returns Sell price or null if not found
   */
  static async fetchSellPrice(partNumber: string): Promise<number | null> {
    try {
      if (!partNumber || !partNumber.trim()) {
        return null;
      }

      // If multiple part numbers (supersession), use only the FIRST one
      let partNumberToUse = partNumber.trim();
      if (partNumberToUse.includes(',')) {
        const firstNumber = partNumberToUse.split(',')[0].trim();
        partNumberToUse = firstNumber;
      }

      const normalizedPartNumber = this.normalizePartNumber(partNumberToUse);
      
      // Try only 2 variations (keep it simple)
      const variations: string[] = [
        normalizedPartNumber, // 1. Exact match (no special chars)
      ];
      
      // 2. Mazda-specific: Try without last character (Mazda part numbers often vary in last char)
      if (normalizedPartNumber.length >= 9) {
        const withoutLastChar = normalizedPartNumber.slice(0, -1);
        variations.push(withoutLastChar);
      }

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
            return sellPrice;
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error in fetchSellPrice:', error);
      return null;
    }
  }
}

