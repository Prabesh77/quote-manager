import supabase from '@/utils/supabase';
import { Quote, Part } from '@/components/ui/useQuotes';

// Function to convert normalized data to legacy format
export const syncNormalizedToLegacy = async () => {
  try {
    // Get all normalized quotes with customer and vehicle details
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
      return [];
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
      return [];
    }

    // Convert to legacy format
    const legacyQuotes: Quote[] = (normalizedQuotes || []).map(normalizedQuote => {
      // Get parts for this quote
      const quotePartsForThisQuote = (quoteParts || []).filter(qp => qp.quote_id === normalizedQuote.id);
      const partIds = quotePartsForThisQuote.map(qp => qp.part_id).join(',');

      return {
        id: normalizedQuote.id,
        vin: normalizedQuote.vehicle?.vin || '',
        partRequested: partIds,
        quoteRef: `Q${normalizedQuote.id.slice(0, 8)}`, // Generate quote ref from ID
        createdAt: normalizedQuote.created_at,
        make: normalizedQuote.vehicle?.make || '',
        model: normalizedQuote.vehicle?.model || '',
        series: normalizedQuote.vehicle?.series || '',
        auto: true, // Default value
        body: normalizedQuote.vehicle?.body || '',
        mthyr: normalizedQuote.vehicle?.year?.toString() || '',
        rego: normalizedQuote.vehicle?.rego || '',
        requiredBy: undefined, // Not in normalized structure
        customer: normalizedQuote.customer?.name || '',
        address: normalizedQuote.customer?.address || '',
        phone: normalizedQuote.customer?.phone || '',
        status: normalizedQuote.status as Quote['status'],
        taxInvoiceNumber: normalizedQuote.tax_invoice_number || undefined,
      };
    });

    return legacyQuotes;
  } catch (error) {
    console.error('Error syncing normalized to legacy:', error);
    return [];
  }
};

// Function to convert normalized parts to legacy format
export const syncNormalizedPartsToLegacy = async (): Promise<Part[]> => {
  try {
    const { data: normalizedParts, error } = await supabase
      .from('parts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching normalized parts:', error);
      return [];
    }

    // Convert to legacy format
    const legacyParts: Part[] = (normalizedParts || []).map(part => ({
      id: part.id,
      name: part.part_name,
      number: part.part_number || '',
      price: part.price,
      note: part.note || '',
      createdAt: part.created_at,
    }));

    return legacyParts;
  } catch (error) {
    console.error('Error syncing normalized parts to legacy:', error);
    return [];
  }
}; 