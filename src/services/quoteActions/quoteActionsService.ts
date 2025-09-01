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

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch quote actions: ${error.message}`);
    }

    // For now, return actions without user data to avoid complexity
    // We can enhance this later with proper user data fetching
    return (data || []).map(action => ({
      ...action,
      user: {
        id: action.user_id,
        email: 'User', // Placeholder
        raw_user_meta_data: {}
      }
    }));
  }

  // Get quote actions for a specific quote
  static async getQuoteActionsByQuoteId(quoteId: string): Promise<QuoteActionWithUser[]> {
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
        email: 'User', // Placeholder
        raw_user_meta_data: {}
      }
    }));
  }

  // Get user statistics
  static async getUserStats(startDate?: string, endDate?: string): Promise<UserStats[]> {
    let query = `
      SELECT 
        u.id as user_id,
        u.email as user_email,
        COALESCE(u.raw_user_meta_data->>'full_name', u.email) as user_name,
        COUNT(CASE WHEN qa.action_type = 'CREATED' THEN 1 END) as quotes_created,
        COUNT(CASE WHEN qa.action_type = 'PRICED' THEN 1 END) as quotes_priced,
        COUNT(CASE WHEN qa.action_type = 'COMPLETED' THEN 1 END) as quotes_completed,
        COUNT(*) as total_quotes,
        COALESCE(SUM(CASE WHEN qa.action_type = 'CREATED' THEN q.total_amount ELSE 0 END), 0) as total_value_created,
        COALESCE(SUM(CASE WHEN qa.action_type = 'PRICED' THEN q.total_amount ELSE 0 END), 0) as total_value_priced,
        COALESCE(SUM(CASE WHEN qa.action_type = 'COMPLETED' THEN q.total_amount ELSE 0 END), 0) as total_value_completed
      FROM auth.users u
      LEFT JOIN quote_actions qa ON u.id = qa.user_id
      LEFT JOIN quotes q ON qa.quote_id = q.id
    `;

    const conditions = [];
    if (startDate) {
      conditions.push(`qa.timestamp >= '${startDate}'`);
    }
    if (endDate) {
      conditions.push(`qa.timestamp <= '${endDate}'`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += `
      GROUP BY u.id, u.email, u.raw_user_meta_data
      ORDER BY total_quotes DESC, quotes_created DESC
    `;

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });

    if (error) {
      throw new Error(`Failed to fetch user stats: ${error.message}`);
    }

    return data || [];
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
        email: 'User', // Placeholder
        raw_user_meta_data: {}
      }
    }));
  }

  // Get activity summary for dashboard
  static async getActivitySummary(): Promise<{
    total_actions: number;
    actions_today: number;
    actions_this_week: number;
    actions_this_month: number;
  }> {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
          COUNT(*) as total_actions,
          COUNT(CASE WHEN DATE(timestamp) = '${today}' THEN 1 END) as actions_today,
          COUNT(CASE WHEN timestamp >= '${weekAgo}' THEN 1 END) as actions_this_week,
          COUNT(CASE WHEN timestamp >= '${monthAgo}' THEN 1 END) as actions_this_month
        FROM quote_actions
      `
    });

    if (error) {
      throw new Error(`Failed to fetch activity summary: ${error.message}`);
    }

    return data?.[0] || {
      total_actions: 0,
      actions_today: 0,
      actions_this_week: 0,
      actions_this_month: 0
    };
  }
}
