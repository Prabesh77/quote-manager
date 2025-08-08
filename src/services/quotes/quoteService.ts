import supabase from '@/utils/supabase';
import { Quote, QuoteFormData, QuoteUpdateData, QuoteWithParts } from '@/types/quote';
import { Part } from '@/types/part';
import { ApiResponse } from '@/types/common';

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
      const customerFieldNames = ['name', 'phone', 'address'];
      
      Object.entries(fields).forEach(([key, value]) => {
        if (quoteOnlyFields.includes(key)) {
          quoteFields[key] = value;
        } else if (vehicleFieldNames.includes(key)) {
          // Map legacy field names to normalized field names
          const fieldMap: Record<string, string> = {
            'auto': 'transmission', // Map auto to transmission field
            'body': 'notes', // Map body to notes field
            'mthyr': 'year' // Map mthyr to year field
          };
          const normalizedKey = fieldMap[key] || key;
          vehicleUpdateFields[normalizedKey] = value;
        } else if (customerFieldNames.includes(key)) {
          customerUpdateFields[key] = value;
        }
      });

      // Get the quote to find related vehicle and customer IDs
      const { data: quote, error: fetchError } = await supabase
        .from('quotes')
        .select('vehicle_id, customer_id')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching quote for update:', fetchError);
        return { data: null, error: fetchError.message };
      }

      // Update quotes table if there are quote fields
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

      // Update vehicles table if there are vehicle fields
      if (Object.keys(vehicleUpdateFields).length > 0 && quote.vehicle_id) {
        const { error: vehicleError } = await supabase
          .from('vehicles')
          .update(vehicleUpdateFields)
          .eq('id', quote.vehicle_id);
        
        if (vehicleError) {
          console.error('Error updating vehicle:', vehicleError);
          return { data: null, error: vehicleError.message };
        }
      }

      // Update customers table if there are customer fields
      if (Object.keys(customerUpdateFields).length > 0 && quote.customer_id) {
        const { error: customerError } = await supabase
          .from('customers')
          .update(customerUpdateFields)
          .eq('id', quote.customer_id);
        
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
} 