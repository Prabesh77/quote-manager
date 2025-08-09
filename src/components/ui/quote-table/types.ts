import { Quote, Part } from '../useQuotes';

export interface QuoteTableProps {
  quotes: Quote[];
  parts: Part[];
  onUpdateQuote: (id: string, fields: Record<string, any>) => Promise<{ error: Error | null }>;
  onDeleteQuote: (id: string) => Promise<{ error: Error | null }>;
  onUpdatePart: (id: string, updates: Partial<Part>) => Promise<{ data: Part; error: Error | null }>;
  onUpdateMultipleParts: (updates: Array<{ id: string; updates: Partial<Part> }>) => Promise<void>;
  onMarkCompleted?: (id: string) => Promise<{ error: Error | null }>;
  onMarkAsOrdered?: (id: string, taxInvoiceNumber: string) => Promise<{ error: Error | null }>;
  onMarkAsOrderedWithParts?: (id: string, taxInvoiceNumber: string, partIds: string[]) => Promise<{ error: Error | null }>;
  showCompleted?: boolean;
  defaultFilter?: FilterType;
  isLoading?: boolean;
}

export type FilterType = 'all' | 'unpriced' | 'priced';

export type QuoteStatus = 'unpriced' | 'priced' | 'completed' | 'ordered' | 'delivered' | 'waiting_verification';

export interface QuoteTableState {
  filter: FilterType;
  searchTerm: string;
  expandedRows: Set<string>;
  editingQuote: string | null;
  editingParts: string | null;
  editData: Record<string, any>;
  partEditData: Record<string, Record<string, any>>;
  showDeleteConfirm: string | null;
  showOrderConfirm: string | null;
  taxInvoiceNumber: string;
  selectedPartIds: string[];
  currentTime: Date;
  quotePartsWithNotes: Record<string, Part[]>;
  editModalOpen: boolean;
  selectedQuoteForEdit: Quote | null;
}

export interface DeadlineInfo {
  isOverdue: boolean;
  isUrgent: boolean;
  daysRemaining: number;
  color: string;
  bgColor: string;
  priority: number;
} 