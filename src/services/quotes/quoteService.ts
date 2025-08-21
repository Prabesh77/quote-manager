import supabase from '@/utils/supabase';
import { Quote, QuoteFormData, QuoteUpdateData, QuoteWithParts } from '@/types/quote';
import { Part } from '@/types/part';
import { ApiResponse } from '@/types/common';

// Parse Australian-style dates like "19/08/2025" or "19/08/2025 12:00pm" into ISO8601
function parseAustralianDateTime(input?: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  // dd/mm/yyyy [HH:MM(am|pm)]
  const re = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(am|pm)?)?$/i;
  const match = trimmed.match(re);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10); // 1-12
  const year = parseInt(match[3], 10);
  let hour = 0;
  let minute = 0;
  if (match[4] && match[5]) {
    hour = parseInt(match[4], 10);
    minute = parseInt(match[5], 10);
    const meridiem = (match[6] || '').toLowerCase();
    if (meridiem === 'pm' && hour < 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
  }
  // Validate ranges
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  // Use UTC to avoid timezone shifts
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
}

export class QuoteService {
  /**
   * Fetch all quotes with related data
   */
  static async fetchQuotes(): Promise<ApiResponse<Quote[]>> {
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
        return { data: null, error: quotesError.message };
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
        return { data: null, error: partsError.message };
      }

      // Convert normalized quotes to legacy format for QuoteTable compatibility
      const legacyQuotes: Quote[] = (normalizedQuotes || []).map((normalizedQuote: any) => {
        // Get parts for this quote
        const quotePartsForThisQuote = (quoteParts || []).filter((qp: any) => qp.quote_id === normalizedQuote.id);
        const partIds = quotePartsForThisQuote.map((qp: any) => qp.part_id).join(',');

        return {
          id: normalizedQuote.id,
          vin: normalizedQuote.vehicle?.vin || '',
          partRequested: partIds,
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
      });

      return { data: legacyQuotes, error: null };
    } catch (error) {
      console.error('Error fetching quotes:', error);
      return { data: null, error: 'Failed to fetch quotes' };
    }
  }

  /**
   * Update a quote with normalized schema support
   */
  static async updateQuote(id: string, fields: QuoteUpdateData): Promise<ApiResponse<Quote>> {
    try {
      // Separate fields for different tables
      const quoteFields: Record<string, any> = {};
      const vehicleUpdateFields: Record<string, any> = {};
      const customerUpdateFields: Record<string, any> = {};
      
      // Define which fields go to which table
      const quoteOnlyFields = ['status', 'notes', 'tax_invoice_number', 'required_by'];
      const vehicleFieldNames = ['make', 'model', 'series', 'vin', 'rego', 'year', 'color', 'notes'];
      const customerUpdateFieldsNames = ['name', 'phone', 'address'];
      
      Object.entries(fields).forEach(([key, value]) => {
        if (quoteOnlyFields.includes(key)) {
          // Normalize required_by if present
          if (key === 'required_by' && typeof value === 'string') {
            const iso = parseAustralianDateTime(value as string);
            quoteFields[key] = iso ?? value;
          } else {
            quoteFields[key] = value;
          }
        } else if (vehicleFieldNames.includes(key)) {
          // Map legacy field names to normalized field names
          const fieldMap: Record<string, string> = {
            'body': 'notes', // Map body to notes field
            'mthyr': 'year' // Map mthyr to year field
          };
          const normalizedKey = fieldMap[key] || key;
          vehicleUpdateFields[normalizedKey] = value;
        } else if (customerUpdateFieldsNames.includes(key)) {
          customerUpdateFields[key] = value;
        }
      });

      // Update quotes table if needed
      if (Object.keys(quoteFields).length > 0) {
        const { error: quoteError } = await supabase
          .from('quotes')
          .update(quoteFields)
          .eq('id', id);
        if (quoteError) {
          console.error('Error updating quote:', quoteError);
          return { data: null, error: quoteError.message };
        }
      }

      // Update vehicles table if needed
      if (Object.keys(vehicleUpdateFields).length > 0) {
        // Fetch vehicle_id for the quote
        const { data: quoteRow, error: fetchError } = await supabase
          .from('quotes')
          .select('vehicle_id')
          .eq('id', id)
          .single();
        if (fetchError) {
          console.error('Error fetching quote vehicle_id:', fetchError);
          return { data: null, error: fetchError.message };
        }

        const { error: vehicleError } = await supabase
          .from('vehicles')
          .update(vehicleUpdateFields)
          .eq('id', quoteRow.vehicle_id);
        if (vehicleError) {
          console.error('Error updating vehicle:', vehicleError);
          return { data: null, error: vehicleError.message };
        }
      }

      // Update customers table if needed
      if (Object.keys(customerUpdateFields).length > 0) {
        const { data: quoteRow, error: fetchError } = await supabase
          .from('quotes')
          .select('customer_id')
          .eq('id', id)
          .single();
        if (fetchError) {
          console.error('Error fetching quote customer_id:', fetchError);
          return { data: null, error: fetchError.message };
        }

        const { error: customerError } = await supabase
          .from('customers')
          .update(customerUpdateFields)
          .eq('id', quoteRow.customer_id);
        if (customerError) {
          console.error('Error updating customer:', customerError);
          return { data: null, error: customerError.message };
        }
      }

      return { data: null, error: null };
    } catch (error) {
      console.error('Update quote error:', error);
      return { data: null, error: 'Failed to update quote' };
    }
  }

  /**
   * Delete a quote
   */
  static async deleteQuote(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.from('quotes').delete().eq('id', id);
      
      if (error) {
        console.error('Delete quote error:', error);
        return { data: null, error: error.message };
      }
      
      return { data: null, error: null };
    } catch (error) {
      console.error('Delete quote error:', error);
      return { data: null, error: 'Failed to delete quote' };
    }
  }

  /**
   * Mark quote as completed
   */
  static async markQuoteCompleted(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'completed' })
        .eq('id', id);
      
      if (error) {
        console.error('Mark completed error:', error);
        return { data: null, error: error.message };
      }
      
      return { data: null, error: null };
    } catch (error) {
      console.error('Mark completed error:', error);
      return { data: null, error: 'Failed to mark quote as completed' };
    }
  }

  /**
   * Mark quote as ordered
   */
  static async markQuoteAsOrdered(id: string, taxInvoiceNumber: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ 
          status: 'ordered',
          tax_invoice_number: taxInvoiceNumber 
        })
        .eq('id', id);
      
      if (error) {
        console.error('Mark ordered error:', error);
        return { data: null, error: error.message };
      }
      
      return { data: null, error: null };
    } catch (error) {
      console.error('Mark ordered error:', error);
      return { data: null, error: 'Failed to mark quote as ordered' };
    }
  }

  /**
   * Verify quote price (move from waiting_verification to priced)
   */
  static async verifyQuotePrice(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'priced' })
        .eq('id', id);
      
      if (error) {
        console.error('Verify price error:', error);
        return { data: null, error: error.message };
      }
      
      return { data: null, error: null };
    } catch (error) {
      console.error('Verify price error:', error);
      return { data: null, error: 'Failed to verify quote price' };
    }
  }

  /**
   * Create a new quote with customer, vehicle, and parts
   */
  static async createQuote(quoteData: {
    customer: { name: string; phone?: string; address?: string };
    vehicle: { 
      rego?: string; 
      make: string; 
      model: string; 
      series?: string; 
      year?: string; 
      vin?: string; 
      color?: string; 
      auto?: boolean; 
      body?: string; 
      notes?: string;
    };
    parts: Array<{ name: string; number?: string; price?: number | null; note?: string }>;
    notes?: string;
    requiredBy?: string;
    quoteRef?: string;
  }): Promise<ApiResponse<Quote>> {
    try {
      // Step 1: Create or find customer
      let customerId: string;
      if (quoteData.customer.phone) {
        // Try to find existing customer by phone
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', quoteData.customer.phone)
          .single();
        
        if (existingCustomer) {
          customerId = existingCustomer.id;
          // Update customer info if different
          await supabase
            .from('customers')
            .update({
              name: quoteData.customer.name,
              address: quoteData.customer.address || ''
            })
            .eq('id', customerId);
        } else {
          // Create new customer
          const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert({
              name: quoteData.customer.name,
              phone: quoteData.customer.phone,
              address: quoteData.customer.address
            })
            .select('id')
            .single();
          
          if (customerError) throw customerError;
          customerId = newCustomer.id;
        }
      } else {
        // Create new customer without phone
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            name: quoteData.customer.name,
            address: quoteData.customer.address
          })
          .select('id')
          .single();
        
        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }

      // Step 2: Create vehicle
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .insert({
          rego: quoteData.vehicle.rego,
          make: quoteData.vehicle.make,
          model: quoteData.vehicle.model,
          series: quoteData.vehicle.series,
          year: quoteData.vehicle.year ? parseInt(quoteData.vehicle.year) : null,
          vin: quoteData.vehicle.vin,
          color: quoteData.vehicle.color,
          transmission: quoteData.vehicle.auto ? 'auto' : 'manual',
          body: quoteData.vehicle.body,
          notes: quoteData.vehicle.notes
        })
        .select('id')
        .single();
      
      if (vehicleError) throw vehicleError;
      const vehicleId = vehicle.id;

      // Step 3: Create quote
      const requiredByIso = parseAustralianDateTime(quoteData.requiredBy);
      const { data: quote, error: quoteError } = await supabase
        .from('quotes')
        .insert({
          customer_id: customerId,
          vehicle_id: vehicleId,
          status: 'unpriced',
          notes: quoteData.notes,
          required_by: requiredByIso,
          quote_ref: quoteData.quoteRef
        })
        .select('id')
        .single();
      
      if (quoteError) throw quoteError;
      const quoteId = quote.id;

      // Step 4: Create parts and parts_requested JSON structure
      if (quoteData.parts && quoteData.parts.length > 0) {
        const createdParts: Array<{ id: string; name: string; number: string }> = [];
        
        // Create parts in parts table
        for (const partData of quoteData.parts) {
          const { data: part, error: partError } = await supabase
            .from('parts')
            .insert({
              vehicle_id: vehicleId,
              part_name: partData.name,
              part_number: partData.number,
              price: partData.price
            })
            .select('id, part_name, part_number')
            .single();
          
          if (partError) throw partError;
          createdParts.push({
            id: part.id,
            name: part.part_name,
            number: part.part_number
          });
        }

        // Create parts_requested JSON structure for the quote using actual part IDs
        const partsRequested = createdParts.map(part => ({
          part_id: part.id, // Use the actual part ID from the parts table
          variants: [] // Empty variants array initially - notes and prices will be added here during pricing
        }));

        // Update the quote with parts_requested JSON
        const { error: updateError } = await supabase
          .from('quotes')
          .update({ parts_requested: partsRequested })
          .eq('id', quoteId);

        if (updateError) throw updateError;
      }

      // Return the created quote in legacy format for compatibility
      const createdQuote: Quote = {
        id: quoteId,
        vin: quoteData.vehicle.vin || '',
        partRequested: quoteData.parts.map(p => p.name).join(','),
        quoteRef: quoteData.quoteRef || `Q${quoteId.slice(0, 8)}`,
        createdAt: new Date().toISOString(),
        make: quoteData.vehicle.make,
        model: quoteData.vehicle.model,
        series: quoteData.vehicle.series || '',
        auto: quoteData.vehicle.auto || false,
        body: quoteData.vehicle.body || '',
        mthyr: quoteData.vehicle.year || '',
        rego: quoteData.vehicle.rego || '',
        requiredBy: quoteData.requiredBy,
        customer: quoteData.customer.name,
        address: quoteData.customer.address || '',
        phone: quoteData.customer.phone || '',
        status: 'unpriced',
        taxInvoiceNumber: undefined
      };

      return { data: createdQuote, error: null };
    } catch (error) {
      console.error('Create quote error:', error);
      return { data: null, error: error instanceof Error ? error.message : 'Failed to create quote' };
    }
  }
} 