import supabase from '@/utils/supabase';
import { Part, PartFormData, PartUpdateData } from '@/types/part';
import { ApiResponse } from '@/types/common';

export class PartService {
  /**
   * Fetch all parts
   */
  static async fetchParts(): Promise<ApiResponse<Part[]>> {
    try {
      const { data: normalizedParts, error } = await supabase
        .from('parts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching normalized parts:', error);
        return { data: null, error: error.message };
      }

      // Convert normalized parts to legacy format for QuoteTable compatibility
      const legacyParts: Part[] = (normalizedParts || []).map((part: any) => ({
        id: part.id,
        name: part.part_name,
        number: part.part_number || '',
        price: part.price,
        note: part.note || '',
        createdAt: part.created_at,
      }));

      return { data: legacyParts, error: null };
    } catch (error) {
      console.error('Error fetching parts:', error);
      return { data: null, error: 'Failed to fetch parts' };
    }
  }

  /**
   * Add a new part
   */
  static async addPart(partData: PartFormData): Promise<ApiResponse<Part>> {
    try {
      // Convert legacy part format to normalized format
      const normalizedPart = {
        part_name: partData.name,
        part_number: partData.number,
        price: partData.price,
        note: partData.note,
        created_at: new Date().toISOString(),
      };
      
      const { data, error } = await supabase.from('parts').insert(normalizedPart).select();
      
      if (error) {
        console.error('Error adding part:', error);
        return { data: null, error: error.message };
      }

      if (!data || data.length === 0) {
        return { data: null, error: 'No part data returned' };
      }

      const newPart: Part = {
        id: data[0].id,
        name: data[0].part_name,
        number: data[0].part_number || '',
        price: data[0].price,
        note: data[0].note || '',
        createdAt: data[0].created_at,
      };

      return { data: newPart, error: null };
    } catch (error) {
      console.error('Error adding part:', error);
      return { data: null, error: 'Failed to add part' };
    }
  }

  /**
   * Update a part
   */
  static async updatePart(id: string, updates: PartUpdateData): Promise<ApiResponse<Part>> {
    try {
      // Convert legacy part format to normalized format
      const normalizedUpdates: any = {};
      if (updates.name !== undefined) normalizedUpdates.part_name = updates.name;
      if (updates.number !== undefined) normalizedUpdates.part_number = updates.number;
      if (updates.price !== undefined) normalizedUpdates.price = updates.price;
      if (updates.note !== undefined) normalizedUpdates.note = updates.note;
      
      const { data, error } = await supabase
        .from('parts')
        .update(normalizedUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating part:', error);
        return { data: null, error: error.message };
      }

      const updatedPart: Part = {
        id: data.id,
        name: data.part_name,
        number: data.part_number || '',
        price: data.price,
        note: data.note || '',
        createdAt: data.created_at,
      };

      return { data: updatedPart, error: null };
    } catch (error) {
      console.error('Error updating part:', error);
      return { data: null, error: 'Failed to update part' };
    }
  }

  /**
   * Delete a part
   */
  static async deletePart(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.from('parts').delete().eq('id', id);
      
      if (error) {
        console.error('Error deleting part:', error);
        return { data: null, error: error.message };
      }
      
      return { data: null, error: null };
    } catch (error) {
      console.error('Error deleting part:', error);
      return { data: null, error: 'Failed to delete part' };
    }
  }

  /**
   * Update multiple parts
   */
  static async updateMultipleParts(updates: Array<{ id: string; updates: PartUpdateData }>): Promise<ApiResponse<Part[]>> {
    try {
      const results: Part[] = [];
      
      for (const { id, updates: partUpdates } of updates) {
        const result = await this.updatePart(id, partUpdates);
        if (result.data) {
          results.push(result.data);
        }
      }
      
      return { data: results, error: null };
    } catch (error) {
      console.error('Error updating multiple parts:', error);
      return { data: null, error: 'Failed to update multiple parts' };
    }
  }
} 