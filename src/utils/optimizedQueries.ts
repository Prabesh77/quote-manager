import supabase from '@/utils/supabase';

// Optimized queries with proper indexing and selective fetching
export const optimizedQueries = {
  // Fetch quotes with pagination and filtering
  getQuotes: async (options: {
    status?: string;
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) => {
    const { status, limit = 50, offset = 0, search, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    
    let query = supabase
      .from('quotes')
      .select('*')
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`vin.ilike.%${search}%,quoteRef.ilike.%${search}%,customer.ilike.%${search}%`);
    }

    return query;
  },

  // Fetch quotes by status with count
  getQuotesByStatus: async (status: string) => {
    return supabase
      .from('quotes')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('createdAt', { ascending: false });
  },

  // Get quote with parts in single query
  getQuoteWithParts: async (quoteId: string) => {
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) return { data: null, error: quoteError };

    const partIds = quote.partRequested?.split(',').filter(Boolean) || [];
    
    if (partIds.length === 0) {
      return { data: { quote, parts: [] }, error: null };
    }

    const { data: parts, error: partsError } = await supabase
      .from('parts')
      .select('*')
      .in('id', partIds);

    return {
      data: { quote, parts: parts || [] },
      error: partsError
    };
  },

  // Batch update quotes
  updateQuotesBatch: async (updates: Array<{ id: string; updates: Record<string, any> }>) => {
    const promises = updates.map(({ id, updates }) =>
      supabase
        .from('quotes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    );

    return Promise.all(promises);
  },

  // Search quotes with full-text search
  searchQuotes: async (searchTerm: string, limit = 20) => {
    return supabase
      .from('quotes')
      .select('*')
      .or(`vin.ilike.%${searchTerm}%,quoteRef.ilike.%${searchTerm}%,customer.ilike.%${searchTerm}%,make.ilike.%${searchTerm}%,model.ilike.%${searchTerm}%`)
      .order('createdAt', { ascending: false })
      .limit(limit);
  },

  // Get dashboard stats efficiently
  getDashboardStats: async () => {
    const { data, error } = await supabase
      .rpc('get_dashboard_stats');

    if (error) {
      // Fallback to individual queries if RPC doesn't exist
      const [totalQuotes, completedQuotes, orderedQuotes, unpricedQuotes, pricedQuotes] = await Promise.all([
        supabase.from('quotes').select('*', { count: 'exact', head: true }),
        supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('status', 'ordered'),
        supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('status', 'unpriced'),
        supabase.from('quotes').select('*', { count: 'exact', head: true }).eq('status', 'priced'),
      ]);

      return {
        data: {
          totalQuotes: totalQuotes.count || 0,
          completedQuotes: completedQuotes.count || 0,
          orderedQuotes: orderedQuotes.count || 0,
          unpricedQuotes: unpricedQuotes.count || 0,
          pricedQuotes: pricedQuotes.count || 0,
        },
        error: null
      };
    }

    return { data, error };
  },

  // Get recent activity
  getRecentActivity: async (limit = 10) => {
    return supabase
      .from('quotes')
      .select('id, quoteRef, status, createdAt, customer')
      .order('createdAt', { ascending: false })
      .limit(limit);
  }
};

// Database indexes to create for better performance
export const createPerformanceIndexes = async () => {
  const indexes = [
    // Quotes table indexes
    'CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status)',
    'CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes("createdAt")',
    'CREATE INDEX IF NOT EXISTS idx_quotes_vin ON quotes(vin)',
    'CREATE INDEX IF NOT EXISTS idx_quotes_quote_ref ON quotes("quoteRef")',
    'CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer)',
    
    // Parts table indexes
    'CREATE INDEX IF NOT EXISTS idx_parts_name ON parts(name)',
    'CREATE INDEX IF NOT EXISTS idx_parts_number ON parts(number)',
    'CREATE INDEX IF NOT EXISTS idx_parts_created_at ON parts("createdAt")',
    
    // Full-text search indexes
    'CREATE INDEX IF NOT EXISTS idx_quotes_search ON quotes USING gin(to_tsvector(\'english\', vin || \' \' || "quoteRef" || \' \' || COALESCE(customer, \'\')))',
  ];

  for (const index of indexes) {
    try {
      await supabase.rpc('exec_sql', { sql: index });
    } catch (error) {
      console.warn('Index creation failed:', error);
    }
  }
}; 