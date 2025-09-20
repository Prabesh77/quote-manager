import supabase from '@/utils/supabase';

export interface PartsRule {
  id: string;
  part_name: string;
  rule_type: 'required_for' | 'not_required_for' | 'none';
  brands: string[];
  description?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface CreatePartsRuleData {
  part_name: string;
  rule_type: 'required_for' | 'not_required_for' | 'none';
  brands: string[];
  description?: string;
}

export interface UpdatePartsRuleData extends CreatePartsRuleData {
  id: string;
}

class PartsRulesService {
  // Fetch all parts rules
  async getPartsRules(): Promise<PartsRule[]> {
    try {
      const { data, error } = await supabase
        .from('parts_rules')
        .select('*')
        .order('part_name', { ascending: true });

      if (error) {
        console.error('Error fetching parts rules:', error);
        throw new Error('Failed to fetch parts rules');
      }

      return data || [];
    } catch (error) {
      console.error('PartsRulesService.getPartsRules error:', error);
      throw error;
    }
  }

  // Create a new parts rule
  async createPartsRule(ruleData: CreatePartsRuleData): Promise<PartsRule> {
    try {
      const { data, error } = await supabase
        .from('parts_rules')
        .insert({
          part_name: ruleData.part_name,
          rule_type: ruleData.rule_type,
          brands: ruleData.brands,
          description: ruleData.description || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating parts rule:', error);
        if (error.code === '23505') {
          throw new Error('A rule for this part already exists');
        }
        throw new Error('Failed to create parts rule');
      }

      return data;
    } catch (error) {
      console.error('PartsRulesService.createPartsRule error:', error);
      throw error;
    }
  }

  // Update an existing parts rule
  async updatePartsRule(ruleData: UpdatePartsRuleData): Promise<PartsRule> {
    try {
      const { data, error } = await supabase
        .from('parts_rules')
        .update({
          part_name: ruleData.part_name,
          rule_type: ruleData.rule_type,
          brands: ruleData.brands,
          description: ruleData.description || null,
        })
        .eq('id', ruleData.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating parts rule:', error);
        if (error.code === '23505') {
          throw new Error('A rule for this part already exists');
        }
        throw new Error('Failed to update parts rule');
      }

      if (!data) {
        throw new Error('Parts rule not found');
      }

      return data;
    } catch (error) {
      console.error('PartsRulesService.updatePartsRule error:', error);
      throw error;
    }
  }

  // Delete a parts rule
  async deletePartsRule(ruleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('parts_rules')
        .delete()
        .eq('id', ruleId);

      if (error) {
        console.error('Error deleting parts rule:', error);
        throw new Error('Failed to delete parts rule');
      }
    } catch (error) {
      console.error('PartsRulesService.deletePartsRule error:', error);
      throw error;
    }
  }

  // Get parts rule by part name
  async getPartsRuleByPartName(partName: string): Promise<PartsRule | null> {
    try {
      const { data, error } = await supabase
        .from('parts_rules')
        .select('*')
        .eq('part_name', partName)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No rows found
        }
        console.error('Error fetching parts rule by part name:', error);
        throw new Error('Failed to fetch parts rule');
      }

      return data;
    } catch (error) {
      console.error('PartsRulesService.getPartsRuleByPartName error:', error);
      throw error;
    }
  }
}

export const partsRulesService = new PartsRulesService();
