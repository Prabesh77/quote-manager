import { Quote } from '@/types/quote';
import { Part } from '@/types/part';
import supabase from './supabase';

/**
 * Sync data from normalized tables to legacy format
 * This is used to maintain compatibility with existing UI components
 */
export async function syncNormalizedToLegacy() {
  try {
    // Fetch all normalized data
    const { data: normalizedQuotes, error: quotesError } = await supabase
      .from('quotes')
      .select(`
        *,
        vehicle:vehicles(*),
        customer:customers(*)
      `);

    if (quotesError) {
      console.error('Error fetching normalized quotes:', quotesError);
      return { success: false, error: quotesError };
    }

    // Transform to legacy format
    const legacyQuotes: Quote[] = normalizedQuotes?.map(nq => ({
      id: nq.id,
      quoteRef: nq.quote_ref,
      vin: nq.vehicle?.vin || '',
      partRequested: nq.part_requested || '',
      make: nq.vehicle?.make || '',
      model: nq.vehicle?.model || '',
      series: nq.vehicle?.series || '',
      auto: nq.vehicle?.auto || false,
      body: nq.vehicle?.body || '',
      mthyr: nq.vehicle?.year || '',
      rego: nq.vehicle?.registration || '',
      requiredBy: undefined, // This field doesn't exist in normalized schema
      customer: nq.customer?.name || '',
      address: nq.customer?.address || '',
      phone: nq.customer?.phone || '',
      status: nq.status || 'active',
      taxInvoiceNumber: nq.tax_invoice_number,
      createdAt: nq.created_at,
      updatedAt: nq.updated_at
    })) || [];

    console.log('Synced quotes to legacy format:', legacyQuotes.length);
    return { success: true, data: legacyQuotes };

  } catch (error) {
    console.error('Error in syncNormalizedToLegacy:', error);
    return { success: false, error };
  }
}

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