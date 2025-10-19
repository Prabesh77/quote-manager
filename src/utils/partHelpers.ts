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

