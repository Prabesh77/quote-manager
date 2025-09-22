/**
 * Common types used across the application
 */

export type QuoteStatus = 
  | 'active'
  | 'unpriced' 
  | 'waiting_verification'
  | 'priced' 
  | 'completed' 
  | 'ordered' 
  | 'delivered'
  | 'wrong';

export type FilterType = 'all' | 'unpriced' | 'priced';

export type ConnectionStatus = 'checking' | 'connected' | 'error' | 'disconnected';

export interface ApiResponse<T = any> {
  data: T | null;
  error: Error | string | null;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  status?: QuoteStatus;
  search?: string;
} 