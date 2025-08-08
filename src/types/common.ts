export type QuoteStatus = 'active' | 'completed' | 'ordered' | 'delivered' | 'unpriced' | 'priced';

export type FilterType = 'all' | 'unpriced' | 'priced';

export type ConnectionStatus = 'checking' | 'connected' | 'error';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: QuoteStatus;
  dateRange?: {
    start: Date;
    end: Date;
  };
} 