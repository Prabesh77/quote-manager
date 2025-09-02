import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QuoteActionsService } from '@/services/quoteActions/quoteActionsService';
import { QuoteActionFilters, QuoteActionType } from '@/types/quoteActions';

// Query keys
export const quoteActionsKeys = {
  all: ['quoteActions'] as const,
  lists: () => [...quoteActionsKeys.all, 'list'] as const,
  list: (filters: QuoteActionFilters) => [...quoteActionsKeys.lists(), filters] as const,
  byQuote: (quoteId: string) => [...quoteActionsKeys.all, 'quote', quoteId] as const,
  userStats: (startDate?: string, endDate?: string) => 
    [...quoteActionsKeys.all, 'userStats', startDate, endDate] as const,
  recentActivity: (limit: number) => [...quoteActionsKeys.all, 'recent', limit] as const,
  activitySummary: () => [...quoteActionsKeys.all, 'summary'] as const,
};

// Hook to get quote actions with filters
export const useQuoteActionsQuery = (filters?: QuoteActionFilters) => {
  return useQuery({
    queryKey: quoteActionsKeys.list(filters || {}),
    queryFn: () => QuoteActionsService.getQuoteActions(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to get quote actions for a specific quote
export const useQuoteActionsByQuoteQuery = (quoteId: string) => {
  return useQuery({
    queryKey: quoteActionsKeys.byQuote(quoteId),
    queryFn: () => QuoteActionsService.getQuoteActionsByQuoteId(quoteId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to get user statistics
export const useUserStatsQuery = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: quoteActionsKeys.userStats(startDate, endDate),
    queryFn: () => QuoteActionsService.getUserStats(startDate, endDate),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: true, // Always enabled, but with proper caching
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Prevent refetch on component mount if data is fresh
  });
};

// Hook to get recent activity
export const useRecentActivityQuery = (limit: number = 50) => {
  return useQuery({
    queryKey: quoteActionsKeys.recentActivity(limit),
    queryFn: () => QuoteActionsService.getRecentActivity(limit),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get activity summary
export const useActivitySummaryQuery = () => {
  return useQuery({
    queryKey: quoteActionsKeys.activitySummary(),
    queryFn: () => QuoteActionsService.getActivitySummary(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchOnMount: false, // Prevent refetch on component mount if data is fresh
  });
};

// Hook to manually track a quote action
export const useTrackQuoteActionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      quoteId, 
      actionType, 
      userId 
    }: { 
      quoteId: string; 
      actionType: QuoteActionType; 
      userId?: string; 
    }) => QuoteActionsService.trackQuoteAction(quoteId, actionType, userId),
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: quoteActionsKeys.byQuote(data.quote_id) 
      });
      queryClient.invalidateQueries({ 
        queryKey: quoteActionsKeys.recentActivity(50) 
      });
      queryClient.invalidateQueries({ 
        queryKey: quoteActionsKeys.activitySummary() 
      });
      queryClient.invalidateQueries({ 
        queryKey: quoteActionsKeys.userStats() 
      });
    },
  });
};
