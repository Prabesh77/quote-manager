export type QuoteActionType = 'CREATED' | 'PRICED' | 'VERIFIED' | 'COMPLETED' | 'MARKED_WRONG';

export interface QuoteAction {
  id: number;
  quote_id: string; // UUID
  user_id: string; // UUID
  action_type: QuoteActionType;
  timestamp: string;
  created_at: string;
}

export interface QuoteActionWithUser extends QuoteAction {
  user: {
    id: string; // UUID
    email: string;
    raw_user_meta_data?: {
      full_name?: string;
    };
  };
}

export interface QuoteActionWithQuote extends QuoteAction {
  quote: {
    id: string; // UUID
    quote_number: string;
    customer_name: string;
    total_amount?: number;
  };
}

export interface UserStats {
  user_id: string; // UUID
  user_email: string;
  user_name?: string;
  quotes_created: number;
  parts_created: number;
  quotes_priced: number;
  quotes_verified: number;
  quotes_completed: number;
  total_quotes: number;
  total_value_created: number;
  total_value_priced: number;
  total_value_verified: number;
  total_value_completed: number;
}

export interface QuoteActionFilters {
  user_id?: string; // UUID
  action_type?: QuoteActionType;
  start_date?: string;
  end_date?: string;
  quote_id?: string; // UUID
}
