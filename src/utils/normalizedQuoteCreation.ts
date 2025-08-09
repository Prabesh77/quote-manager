import supabase from '@/utils/supabase';

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
  transmission?: string; // auto/manual transmission
  body?: string; // Added body field
  notes?: string;
}

interface PartData {
  name: string;
  number?: string;
  price?: number;
  note?: string;
}

interface QuoteData {
  customer: CustomerData;
  vehicle: VehicleData;
  parts: PartData[];
  notes?: string;
  requiredBy?: string;
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
      console.log('Using existing customer:', quoteData.customer.name);
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
      console.log('Created new customer:', quoteData.customer.name);
    }

    // Step 2: Create or find vehicle
    let vehicleId: string;
    
    // Check if vehicle already exists by matching make, model, series, year, and color
    console.log('Vehicle data received:', quoteData.vehicle);
    
    let vehicleQuery = supabase
      .from('vehicles')
      .select('id, make, model, series, year, color, transmission, body')
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
    
    // Add transmission filter if provided
    if (quoteData.vehicle.transmission) {
      vehicleQuery = vehicleQuery.eq('transmission', quoteData.vehicle.transmission);
    } else {
      vehicleQuery = vehicleQuery.is('transmission', null);
    }
    
    // Add body filter if provided
    if (quoteData.vehicle.body) {
      vehicleQuery = vehicleQuery.eq('body', quoteData.vehicle.body);
    } else {
      vehicleQuery = vehicleQuery.is('body', null);
    }
    
    const { data: existingVehicles, error: vehicleCheckError } = await vehicleQuery;
    
    console.log('Vehicle query result:', { existingVehicles, vehicleCheckError });
    
    if (vehicleCheckError) {
      console.error('Error checking for existing vehicle:', vehicleCheckError);
      throw vehicleCheckError;
    }
    
    if (existingVehicles && existingVehicles.length > 0) {
      // Use existing vehicle
      vehicleId = existingVehicles[0].id;
      console.log('Using existing vehicle:', `${existingVehicles[0].make} ${existingVehicles[0].model} ${existingVehicles[0].series || ''} ${existingVehicles[0].year || ''} ${existingVehicles[0].color || ''}`);
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
            transmission: quoteData.vehicle.transmission || null,
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
      console.log('Created new vehicle:', `${quoteData.vehicle.make} ${quoteData.vehicle.model} ${quoteData.vehicle.series || ''} ${quoteData.vehicle.year || ''} ${quoteData.vehicle.color || ''}`);
    }

    // Step 3: Create quote with JSON parts structure
    // Build the parts_requested JSON array
    const partsRequestedJson = quoteData.parts.map(partData => ({
      part_id: '', // Will be filled after creating parts
      note: partData.note || '',
      final_price: null // Initially null, will be set during pricing
    }));

    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        customer_id: customerId,
        vehicle_id: vehicleId,
        status: 'unpriced',
        notes: quoteData.notes || null,
        required_by: quoteData.requiredBy || null,
        parts_requested: partsRequestedJson, // Re-enabled for fresh JSON setup
      })
      .select()
      .single();

    if (quoteError) {
      console.error('Error creating quote:', quoteError);
      throw quoteError;
    }

    console.log('Created quote:', quote.id);

    // Step 4: Create parts and update the JSON array with actual part IDs
    const finalPartsRequested = [];
    
    for (let i = 0; i < quoteData.parts.length; i++) {
      const partData = quoteData.parts[i];
      let partId: string;
      
      // Check if part already exists for this vehicle
      const { data: existingPart, error: partCheckError } = await supabase
        .from('parts')
        .select('id')
        .eq('vehicle_id', vehicleId)
        .eq('part_name', partData.name)
        .maybeSingle();

      if (existingPart && !partCheckError) {
        partId = existingPart.id;
        console.log('Using existing part:', partData.name);
      } else {
        // Create new part
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

        partId = part.id;
        console.log('Created new part:', partData.name);
      }

      // Add to final JSON array
      finalPartsRequested.push({
        part_id: partId,
        note: partData.note || '',
        final_price: null // Initially null, will be set during pricing
      });
    }

    // Step 5: Update quote with final parts_requested JSON array
    const { error: updateQuoteError } = await supabase
      .from('quotes')
      .update({
        parts_requested: finalPartsRequested
      })
      .eq('id', quote.id);

    if (updateQuoteError) {
      console.error('Error updating quote with parts:', updateQuoteError);
      throw updateQuoteError;
    }

    console.log('✅ Successfully created normalized quote with JSON parts structure');
    console.log('Quote ID:', quote.id);
    console.log('Parts in quote:', finalPartsRequested.length);

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