import supabase from '@/utils/supabase';
import { QuoteActionsService } from '@/services/quoteActions/quoteActionsService';

// Helper function to convert Australian date format (DD/MM/YYYY) to correct format
const convertAustralianDateToISO = (dateString: string | undefined): string | null => {
  if (!dateString || dateString.trim() === '') {
    return null;
  }

  const trimmed = dateString.trim();
  
  // Check if it's already in ISO format (contains 'T' or is in YYYY-MM-DD format)
  if (trimmed.includes('T') || /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed; // Already in correct format
  }

  // Handle Australian format like "24/09/2025 9:30am" (DD/MM/YYYY)
  if (trimmed.includes('/')) {
    const parts = trimmed.split(' ');
    const datePart = parts[0]; // "24/09/2025"
    const timePart = parts[1]; // "9:30am"
    
    const dateComponents = datePart.split('/');
    if (dateComponents.length === 3) {
      const day = parseInt(dateComponents[0]);
      const month = parseInt(dateComponents[1]);
      const year = parseInt(dateComponents[2]);
      
      // Validate the date components
      if (!isNaN(day) && !isNaN(month) && !isNaN(year) && 
          day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
        
        if (timePart) {
          // Parse time part (e.g., "9:30am", "12:00pm")
          const timeStr = timePart.toLowerCase();
          let hours = 0;
          let minutes = 0;
          
          if (timeStr.includes('pm')) {
            const time = timeStr.replace('pm', '');
            if (time.includes(':')) {
              const [h, m] = time.split(':');
              const hour = parseInt(h);
              hours = hour === 12 ? 12 : hour + 12;
              minutes = parseInt(m || '0');
            } else {
              const timeNum = parseInt(time);
              const hour = Math.floor(timeNum / 100);
              hours = hour === 12 ? 12 : hour + 12;
              minutes = timeNum % 100;
            }
          } else if (timeStr.includes('am')) {
            const time = timeStr.replace('am', '');
            if (time.includes(':')) {
              const [h, m] = time.split(':');
              hours = parseInt(h);
              minutes = parseInt(m || '0');
            } else {
              const timeNum = parseInt(time);
              hours = Math.floor(timeNum / 100);
              minutes = timeNum % 100;
            }
          }
          
          // Create a date string that represents the Sydney time
          const isoDateTime = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
          
          // Create a date object - since we're in Sydney timezone, this will automatically
          // convert the local time to UTC when we call toISOString()
          const sydneyDate = new Date(isoDateTime);
          
          // The date object is already correctly converted to UTC by JavaScript
          // No need for manual timezone conversion since we're in Sydney timezone
          return sydneyDate.toISOString();
        } else {
          // No time part, just return the date
          const isoDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          return isoDate;
        }
      }
    }
  }
  
  // If we can't parse it, return the original string
  return dateString;
};

interface CustomerData {
  name: string;
  phone?: string;
  address?: string;
}

interface VehicleData {
  rego?: string;
  make: string;
  model: string;
  series?: string;
  year?: string; // Changed to string to store "9/2017" format
  vin?: string;
  color?: string;
  auto?: boolean; // boolean auto transmission field
  body?: string; // Added body field
  notes?: string;
}

interface PartData {
  name: string;
  number?: string;
  price?: number;
  list_price?: number;
  af?: boolean;
  note?: string;
}

interface QuoteData {
  customer: CustomerData;
  vehicle: VehicleData;
  parts: PartData[];
  notes?: string;
  requiredBy?: string;
  quoteRef: string; // User-provided quote reference
  settlement?: number; // Settlement percentage for the quote
  pcParts?: string; // PartsCheck format parts (comma-separated)
}

export const createNormalizedQuote = async (quoteData: QuoteData) => {
  try {    
    // Step 1: Create or find customer
    let customerId: string;
    
    // Check if customer already exists
    const { data: existingCustomer, error: customerCheckError } = await supabase
      .from('customers')
      .select('id')
      .eq('name', quoteData.customer.name)
      .maybeSingle();

    if (existingCustomer && !customerCheckError) {
      customerId = existingCustomer.id;
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: quoteData.customer.name,
          phone: quoteData.customer.phone || null,
          address: quoteData.customer.address || null,
        })
        .select()
        .single();

      if (customerError) {
        console.error('Error creating customer:', customerError);
        throw customerError;
      }

      customerId = newCustomer.id;
    }

    // Step 2: Create or find vehicle
    let vehicleId: string;
        
    let vehicleQuery = supabase
      .from('vehicles')
      .select('id, make, model, series, year, color, auto, body')
      .eq('make', quoteData.vehicle.make)
      .eq('model', quoteData.vehicle.model);
    
    // Add series filter if provided
    if (quoteData.vehicle.series) {
      vehicleQuery = vehicleQuery.eq('series', quoteData.vehicle.series);
    } else {
      vehicleQuery = vehicleQuery.is('series', null);
    }
    
    // Add year filter if provided
    if (quoteData.vehicle.year) {
      vehicleQuery = vehicleQuery.eq('year', quoteData.vehicle.year);
    } else {
      vehicleQuery = vehicleQuery.is('year', null);
    }
    
    // Add color filter if provided
    if (quoteData.vehicle.color) {
      vehicleQuery = vehicleQuery.eq('color', quoteData.vehicle.color);
    } else {
      vehicleQuery = vehicleQuery.is('color', null);
    }
    
    // Add auto filter if provided
    if (quoteData.vehicle.auto !== undefined) {
      vehicleQuery = vehicleQuery.eq('auto', quoteData.vehicle.auto);
    } else {
      vehicleQuery = vehicleQuery.is('auto', null);
    }
    
    // Add body filter if provided
    if (quoteData.vehicle.body) {
      vehicleQuery = vehicleQuery.eq('body', quoteData.vehicle.body);
    } else {
      vehicleQuery = vehicleQuery.is('body', null);
    }
    
    const { data: existingVehicles, error: vehicleCheckError } = await vehicleQuery;
        
    if (vehicleCheckError) {
      console.error('Error checking for existing vehicle:', vehicleCheckError);
      throw vehicleCheckError;
    }
    
    if (existingVehicles && existingVehicles.length > 0) {
      // Use existing vehicle
      vehicleId = existingVehicles[0].id;
    } else {
              // Create new vehicle
        const { data: newVehicle, error: vehicleError } = await supabase
          .from('vehicles')
          .insert({
            rego: quoteData.vehicle.rego || null,
            make: quoteData.vehicle.make,
            model: quoteData.vehicle.model,
            series: quoteData.vehicle.series || null,
            year: quoteData.vehicle.year || null,
            vin: quoteData.vehicle.vin || null,
            color: quoteData.vehicle.color || null,
            auto: quoteData.vehicle.auto || false,
            body: quoteData.vehicle.body || null,
            notes: quoteData.vehicle.notes || null,
          })
          .select()
          .single();

      if (vehicleError) {
        console.error('Error creating vehicle:', vehicleError);
        throw vehicleError;
      }

      vehicleId = newVehicle.id;
    }

    // Step 3: Create parts first, then create quote with complete data
    const finalPartsRequested = [];
    
    for (let i = 0; i < quoteData.parts.length; i++) {
      const partData = quoteData.parts[i];
      
      // Use the list price from the part data (already fetched in QuoteForm when part number was entered)
      const listPriceToUse = partData.list_price || null;
      
      // Always create new parts for each quote to avoid conflicts
      // Each quote should have its own unique parts
      const { data: part, error: partError } = await supabase
        .from('parts')
        .insert({
          vehicle_id: vehicleId,
          part_name: partData.name,
          part_number: partData.number || null,
          price: partData.price || null,
        })
        .select()
        .single();

      if (partError) {
        console.error('Error creating part:', partError);
        throw partError;
      }

      // Add to final JSON array with fetched list price
      finalPartsRequested.push({
        part_id: part.id,
        note: partData.note || '',
        final_price: null, // Initially null, will be set during pricing
        list_price: listPriceToUse,
        variants: [{
          id: `variant_${Date.now()}_${i}`,
          number: partData.number || '',
          note: partData.note || '',
          final_price: null,
          list_price: listPriceToUse,
          af: partData.af || false,
          created_at: new Date().toISOString(),
          is_default: true
        }]
      });
    }

    // Step 4: Create quote with complete parts_requested JSON array
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        customer_id: customerId,
        vehicle_id: vehicleId,
        status: 'unpriced',
        notes: quoteData.notes || null,
        required_by: quoteData.requiredBy ? convertAustralianDateToISO(quoteData.requiredBy) : null,
        quote_ref: quoteData.quoteRef, // Store user-provided quote reference
        settlement: quoteData.settlement || 0, // Add settlement field
        parts_requested: finalPartsRequested, // Create with complete data
        pc_parts: quoteData.pcParts || null, // Store PartsCheck format parts
      })
      .select()
      .single();

    if (quoteError) {
      console.error('Error creating quote:', quoteError);
      throw quoteError;
    }


    // Track quote creation action
    try {
      console.log('Tracking quote creation for quote ID:', quote.id);
      const trackingResult = await QuoteActionsService.trackQuoteAction(quote.id.toString(), 'CREATED');
      console.log('Quote creation tracked successfully:', trackingResult);
    } catch (trackingError) {
      console.error('Failed to track quote creation:', trackingError);
      // Don't fail the quote creation if tracking fails, but log the error
    }

    return {
      success: true,
      quoteId: quote.id,
      customerId,
      vehicleId,
      partsCount: finalPartsRequested.length
    };
  } catch (error) {
    console.error('❌ Error in createNormalizedQuote:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      supabaseError: error
    });
    throw error;
  }
};

// Helper function to get quote with all related data
export const getQuoteWithDetails = async (quoteId: string) => {
  try {
    // Get quote with customer and vehicle details
    const { data: quoteDetails, error: detailsError } = await supabase
      .rpc('get_quote_with_details', { quote_uuid: quoteId });

    if (detailsError) throw detailsError;

    // Get quote parts with part details
    const { data: quotePartsDetails, error: partsError } = await supabase
      .rpc('get_quote_parts_with_details', { quote_uuid: quoteId });

    if (partsError) throw partsError;

    return {
      data: {
        quote: quoteDetails,
        quote_parts: quotePartsDetails
      },
      error: null
    };

  } catch (error) {
    console.error('Error getting quote details:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}; 