import supabase from '@/utils/supabase';
import { 
  QuoteAction, 
  QuoteActionWithUser, 
  QuoteActionWithQuote, 
  UserStats, 
  QuoteActionFilters,
  QuoteActionType 
} from '@/types/quoteActions';

export class QuoteActionsService {
  // Get all quote actions with optional filters
  static async getQuoteActions(filters?: QuoteActionFilters): Promise<QuoteActionWithUser[]> {
    try {
      // First, get the quote actions
      let query = supabase
        .from('quote_actions')
        .select('*')
        .order('timestamp', { ascending: false });

      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters?.action_type) {
        query = query.eq('action_type', filters.action_type);
      }

      if (filters?.quote_id) {
        query = query.eq('quote_id', filters.quote_id);
      }

      if (filters?.start_date) {
        query = query.gte('timestamp', filters.start_date);
      }

      if (filters?.end_date) {
        query = query.lte('timestamp', filters.end_date);
      }

      const { data: actions, error } = await query;

      if (error) {
        throw new Error(`Failed to fetch quote actions: ${error.message}`);
      }

      if (!actions || actions.length === 0) {
        return [];
      }

      // For now, return actions with basic user info
      // We can enhance this later with proper user data fetching
      return actions.map(action => ({
        ...action,
        user: {
          id: action.user_id,
          email: 'User',
          raw_user_meta_data: {}
        }
      }));
    } catch (error) {
      console.error('Error in getQuoteActions:', error);
      // Fallback to basic data without user info
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('quote_actions')
        .select('*')
        .order('timestamp', { ascending: false });

      if (fallbackError) {
        throw new Error(`Failed to fetch quote actions: ${fallbackError.message}`);
      }

      return (fallbackData || []).map(action => ({
        ...action,
        user: {
          id: action.user_id,
          email: 'User',
          raw_user_meta_data: {}
        }
      }));
    }
  }

  // Get quote actions for a specific quote
  static async getQuoteActionsByQuoteId(quoteId: string): Promise<QuoteActionWithUser[]> {
    try {
      const { data, error } = await supabase
        .from('quote_actions')
        .select('*')
        .eq('quote_id', quoteId)
        .order('timestamp', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch quote actions for quote ${quoteId}: ${error.message}`);
      }

      return (data || []).map(action => ({
        ...action,
        user: {
          id: action.user_id,
          email: 'User',
          raw_user_meta_data: {}
        }
      }));
    } catch (error) {
      console.error('Error in getQuoteActionsByQuoteId:', error);
      return [];
    }
  }

  // Get user statistics
  static async getUserStats(startDate?: string, endDate?: string): Promise<UserStats[]> {
    try {
      // First, get all quote actions with quote data
      let actionsQuery = supabase
        .from('quote_actions')
        .select(`
          user_id, 
          action_type, 
          timestamp,
          quote_id,
          quotes(
            id,
            parts_requested
          )
        `)
        .order('timestamp', { ascending: false });

      if (startDate) {
        actionsQuery = actionsQuery.gte('timestamp', startDate);
      }
      if (endDate) {
        actionsQuery = actionsQuery.lte('timestamp', endDate);
      }

      const { data: actions, error: actionsError } = await actionsQuery;

      if (actionsError) {
        console.error('Error fetching actions for user stats:', actionsError);
        return [];
      }

      // Helper function to calculate quote total value
      const calculateQuoteValue = (partsRequested: any[]): number => {
        if (!Array.isArray(partsRequested)) return 0;
        
        return partsRequested.reduce((total, part) => {
          if (!part.variants || !Array.isArray(part.variants)) return total;
          
          const defaultVariant = part.variants.find((v: any) => v.is_default === true);
          if (!defaultVariant || !defaultVariant.final_price) return total;
          
          return total + (parseFloat(defaultVariant.final_price) || 0);
        }, 0);
      };

      // Process the data to calculate stats per user
      const userStatsMap = new Map<string, UserStats>();

      (actions || []).forEach(action => {
        const userId = action.user_id;
        const quoteValue = calculateQuoteValue(action.quotes?.[0]?.parts_requested || []);
        
        if (!userStatsMap.has(userId)) {
          userStatsMap.set(userId, {
            user_id: userId,
            user_email: 'User',
            user_name: 'User',
            quotes_created: 0,
            quotes_priced: 0,
            quotes_completed: 0,
            total_quotes: 0,
            total_value_created: 0,
            total_value_priced: 0,
            total_value_completed: 0
          });
        }

        const stats = userStatsMap.get(userId)!;
        stats.total_quotes++;

        switch (action.action_type) {
          case 'CREATED':
            stats.quotes_created++;
            stats.total_value_created += quoteValue;
            break;
          case 'PRICED':
            stats.quotes_priced++;
            stats.total_value_priced += quoteValue;
            break;
          case 'COMPLETED':
            stats.quotes_completed++;
            stats.total_value_completed += quoteValue;
            break;
        }
      });

      // Convert map to array and sort
      const userStats = Array.from(userStatsMap.values())
        .sort((a, b) => b.total_quotes - a.total_quotes || b.quotes_created - a.quotes_created);

      return userStats;
    } catch (error) {
      console.error('Error in getUserStats:', error);
      return [];
    }
  }

  // Manually track a quote action (for cases where triggers don't work)
  static async trackQuoteAction(
    quoteId: string, 
    actionType: QuoteActionType, 
    userId?: string
  ): Promise<QuoteAction> {
    const currentUser = userId || (await supabase.auth.getUser()).data.user?.id;
    
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }

    const { data, error } = await supabase
      .from('quote_actions')
      .insert({
        quote_id: quoteId,
        user_id: currentUser,
        action_type: actionType,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to track quote action: ${error.message}`);
    }

    return data;
  }

  // Get recent activity
  static async getRecentActivity(limit: number = 50): Promise<QuoteActionWithUser[]> {
    try {
      const { data, error } = await supabase
        .from('quote_actions')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch recent activity: ${error.message}`);
      }

      return (data || []).map(action => ({
        ...action,
        user: {
          id: action.user_id,
          email: 'User',
          raw_user_meta_data: {}
        }
      }));
    } catch (error) {
      console.error('Error in getRecentActivity:', error);
      return [];
    }
  }

  // Get activity summary for dashboard
  static async getActivitySummary(): Promise<{
    total_actions: number;
    actions_today: number;
    actions_this_week: number;
    actions_this_month: number;
  }> {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      // Get all actions
      const { data: allActions, error: allError } = await supabase
        .from('quote_actions')
        .select('timestamp');

      if (allError) {
        console.error('Error fetching all actions:', allError);
        return {
          total_actions: 0,
          actions_today: 0,
          actions_this_week: 0,
          actions_this_month: 0
        };
      }

      const actions = allActions || [];
      const total_actions = actions.length;
      
      // Count actions by time period
      const actions_today = actions.filter(action => 
        action.timestamp.startsWith(today)
      ).length;
      
      const actions_this_week = actions.filter(action => 
        action.timestamp >= weekAgo
      ).length;
      
      const actions_this_month = actions.filter(action => 
        action.timestamp >= monthAgo
      ).length;

      return {
        total_actions,
        actions_today,
        actions_this_week,
        actions_this_month
      };
    } catch (error) {
      console.error('Error in getActivitySummary:', error);
      return {
        total_actions: 0,
        actions_today: 0,
        actions_this_week: 0,
        actions_this_month: 0
      };
    }
  }
}
