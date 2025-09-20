import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partsRulesService, PartsRule, CreatePartsRuleData, UpdatePartsRuleData } from '@/services/partsRules/partsRulesService';

// Query keys
export const partsRulesKeys = {
  all: ['partsRules'] as const,
  lists: () => [...partsRulesKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...partsRulesKeys.lists(), { filters }] as const,
  details: () => [...partsRulesKeys.all, 'detail'] as const,
  detail: (id: string) => [...partsRulesKeys.details(), id] as const,
};

// Fetch all parts rules
export function usePartsRulesQuery() {
  return useQuery({
    queryKey: partsRulesKeys.lists(),
    queryFn: () => partsRulesService.getPartsRules(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch parts rule by part name
export function usePartsRuleByPartNameQuery(partName: string) {
  return useQuery({
    queryKey: partsRulesKeys.detail(partName),
    queryFn: () => partsRulesService.getPartsRuleByPartName(partName),
    enabled: !!partName,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Create parts rule mutation
export function useCreatePartsRuleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePartsRuleData) => partsRulesService.createPartsRule(data),
    onSuccess: () => {
      // Invalidate and refetch parts rules
      queryClient.invalidateQueries({ queryKey: partsRulesKeys.lists() });
    },
    onError: (error: Error) => {
      console.error('Failed to create parts rule:', error);
    },
  });
}

// Update parts rule mutation
export function useUpdatePartsRuleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePartsRuleData) => partsRulesService.updatePartsRule(data),
    onSuccess: (updatedRule) => {
      // Update the specific rule in cache
      queryClient.setQueryData(partsRulesKeys.detail(updatedRule.id), updatedRule);
      // Invalidate and refetch parts rules list
      queryClient.invalidateQueries({ queryKey: partsRulesKeys.lists() });
    },
    onError: (error: Error) => {
      console.error('Failed to update parts rule:', error);
    },
  });
}

// Delete parts rule mutation
export function useDeletePartsRuleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ruleId: string) => partsRulesService.deletePartsRule(ruleId),
    onSuccess: (_, deletedRuleId) => {
      // Remove the rule from cache
      queryClient.removeQueries({ queryKey: partsRulesKeys.detail(deletedRuleId) });
      // Invalidate and refetch parts rules list
      queryClient.invalidateQueries({ queryKey: partsRulesKeys.lists() });
    },
    onError: (error: Error) => {
      console.error('Failed to delete parts rule:', error);
    },
  });
}
