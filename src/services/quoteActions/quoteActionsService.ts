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

      // Get unique user IDs
      const userIds = [...new Set(actions.map(action => action.user_id))];
      
      // Fetch user data from user_profiles table
      const { data: userProfiles, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, username, full_name')
        .in('id', userIds);
      
      // Create a map of user data for quick lookup
      const userMap = new Map();
      (userProfiles || []).forEach(profile => {
        userMap.set(profile.id, {
          id: profile.id,
          email: profile.username,
          raw_user_meta_data: {
            full_name: profile.full_name
          }
        });
      });

      return actions.map(action => ({
        ...action,
        user: userMap.get(action.user_id) || {
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

      if (!data || data.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(data.map(action => action.user_id))];
      
      // Fetch user data from user_profiles table (accessible by authenticated users)
      const { data: userProfiles, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, username, full_name')
        .in('id', userIds);
      
      if (usersError) {
        console.error('Error fetching user profiles:', usersError);
        // Fallback to basic data
        return data.map(action => ({
          ...action,
          user: {
            id: action.user_id,
            email: 'User',
            raw_user_meta_data: {}
          }
        }));
      }

      // Create a map of user data for quick lookup
      const userMap = new Map();
      (userProfiles || []).forEach(profile => {
        userMap.set(profile.id, {
          id: profile.id,
          email: profile.username, // Use username as email fallback
          raw_user_meta_data: {
            full_name: profile.full_name
          }
        });
      });

      // Map actions with user data
      return data.map(action => ({
        ...action,
        user: userMap.get(action.user_id) || {
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
      // First, get all quote actions
      let actionsQuery = supabase
        .from('quote_actions')
        .select('user_id, action_type, timestamp, quote_id')
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


      // Get unique quote IDs and fetch quote data separately
      const quoteIds = [...new Set(actions?.map(action => action.quote_id) || [])];

      const { data: quotes, error: quotesError } = await supabase
        .from('quotes')
        .select('id, parts_requested')
        .in('id', quoteIds);

      if (quotesError) {
        console.error('Error fetching quotes for user stats:', quotesError);
        return [];
      }


      // Create a map of quote ID to quote data
      const quotesMap = new Map(quotes?.map(quote => [quote.id, quote]) || []);
      console.log('🔍 Quotes map:', quotesMap);

      // Helper function to calculate quote total value
      const calculateQuoteValue = (partsRequested: any): number => {
        // Handle JSON string case
        let partsArray = partsRequested;
        if (typeof partsRequested === 'string') {
          try {
            partsArray = JSON.parse(partsRequested);
          } catch (e) {
            return 0;
          }
        }
        
        if (!Array.isArray(partsArray)) return 0;
        
        return partsArray.reduce((total, part) => {
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
        const quote = quotesMap.get(action.quote_id);
        const quoteValue = calculateQuoteValue(quote?.parts_requested || []);
        
        if (!userStatsMap.has(userId)) {
          userStatsMap.set(userId, {
            user_id: userId,
            user_email: 'User',
            user_name: 'User',
            quotes_created: 0,
            parts_created: 0,
            quotes_priced: 0,
            quotes_verified: 0,
            quotes_completed: 0,
            total_quotes: 0,
            total_value_created: 0,
            total_value_priced: 0,
            total_value_verified: 0,
            total_value_completed: 0
          });
        }

        const stats = userStatsMap.get(userId)!;
        stats.total_quotes++;

        switch (action.action_type) {
          case 'CREATED':
            stats.quotes_created++;
            stats.total_value_created += quoteValue;
            // Count parts created when quote is created
            const partsRequested = quote?.parts_requested;
            console.log('🔍 CREATED action debug:', {
              quoteId: action.quote_id,
              userId: action.user_id,
              quote: quote,
              partsRequested: partsRequested,
              type: typeof partsRequested,
              isArray: Array.isArray(partsRequested),
              length: Array.isArray(partsRequested) ? partsRequested.length : 'N/A'
            });
            
            // Handle JSON string case
            let partsArray = partsRequested;
            if (typeof partsRequested === 'string') {
              try {
                partsArray = JSON.parse(partsRequested);
              } catch (e) {
                console.log('❌ Failed to parse JSON string:', e);
                partsArray = null;
              }
            }
            
            if (Array.isArray(partsArray)) {
              stats.parts_created += partsArray.length;
            } else {
              console.log('❌ Parts not counted - partsRequested is not an array:', partsRequested, 'parsed:', partsArray);
            }
            break;
          case 'PRICED':
            stats.quotes_priced++;
            stats.total_value_priced += quoteValue;
            break;
          case 'VERIFIED':
            stats.quotes_verified++;
            stats.total_value_verified += quoteValue;
            break;
          case 'COMPLETED':
            stats.quotes_completed++;
            stats.total_value_completed += quoteValue;
            break;
          case 'MARKED_WRONG':
            // Don't increment any counters for wrong quotes
            break;
        }
      });

      // Convert map to array and get user information
      const finalUserIds = Array.from(userStatsMap.keys());
      
      // Fetch user data from user_profiles table
      const { data: userProfiles, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, username, full_name')
        .in('id', finalUserIds);
      
      if (usersError) {
        console.error('Error fetching user profiles for stats:', usersError);
        // Return stats with fallback user data
        return Array.from(userStatsMap.values())
          .sort((a, b) => b.total_quotes - a.total_quotes || b.quotes_created - a.quotes_created);
      }

      // Create a map of user data for quick lookup
      const userMap = new Map();
      (userProfiles || []).forEach(profile => {
        userMap.set(profile.id, {
          username: profile.username,
          full_name: profile.full_name
        });
      });

      // Update user stats with real user information
      const userStats = Array.from(userStatsMap.values()).map(stats => {
        const userInfo = userMap.get(stats.user_id);
        return {
          ...stats,
          user_email: userInfo?.username || 'User',
          user_name: userInfo?.full_name || userInfo?.username || 'User'
        };
      });

      return userStats.sort((a, b) => b.total_quotes - a.total_quotes || b.quotes_created - a.quotes_created);
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

      if (!data || data.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(data.map(action => action.user_id))];
      
      // Fetch user data from user_profiles table
      const { data: userProfiles, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, username, full_name')
        .in('id', userIds);
      
      // Create a map of user data for quick lookup
      const userMap = new Map();
      (userProfiles || []).forEach(profile => {
        userMap.set(profile.id, {
          id: profile.id,
          email: profile.username,
          raw_user_meta_data: {
            full_name: profile.full_name
          }
        });
      });

      return data.map(action => ({
        ...action,
        user: userMap.get(action.user_id) || {
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
