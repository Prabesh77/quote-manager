'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { ChevronDown, Edit, Save, X, Search, Copy, CheckCircle, AlertTriangle, ShoppingCart, Package, Plus, Info, MapPin, Send, Loader2, LayoutGrid, List, Eye, RefreshCw, MoreVertical } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import CopyButton from './CopyButton';

// Helper function to get display quote reference (without RC suffix) and check if it's from RepairConnection
const getQuoteRefDisplay = (quoteRef: string, source?: string) => {
  const isRepairConnection = source === 'repairconnection' || quoteRef.endsWith(' RC');
  const displayRef = isRepairConnection ? quoteRef.replace(' RC', '') : quoteRef;
  return { displayRef, isRepairConnection };
};

import { useQueryClient } from '@tanstack/react-query';
import { Quote, Part } from './useQuotes';

import { SkeletonLoader } from './SkeletonLoader';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import supabase from '@/utils/supabase';
import { getQuotePartsFromJson } from '@/utils/quotePartsHelpers';
import { QuoteEditModal } from './QuoteEditModal';
import QuickFillInput from './QuickFillInput';
import QuoteInfoPopup from '../QuoteInfoPopup';
import { useSnackbar } from '@/components/ui/Snackbar';
import RealtimeToggle from './RealtimeToggle';


interface QuoteTableProps {
  quotes: Quote[];
  parts: Part[];
  onUpdateQuote: (id: string, fields: Record<string, any>) => Promise<{ error: Error | null }>;
  onDeleteQuote: (id: string) => Promise<{ error: Error | null }>;
  onUpdatePart: (id: string, updates: Partial<Part>) => Promise<{ data: Part; error: Error | null }>;
  onUpdateMultipleParts: (updates: Array<{ id: string; updates: Partial<Part> }>, quoteId?: string, changeStatus?: boolean) => Promise<any>;
  onMarkCompleted?: (id: string) => Promise<{ error: Error | null }>;
  onMarkAsOrdered?: (id: string, taxInvoiceNumber: string) => Promise<{ error: Error | null }>;
  onMarkAsOrderedWithParts?: (id: string, taxInvoiceNumber: string, partIds: string[]) => Promise<{ error: Error | null }>;
  onMarkAsWrong?: (id: string) => Promise<{ error: Error | null }>;
  showCompleted?: boolean;
  defaultFilter?: FilterType;
  isLoading?: boolean;
  itemsPerPage?: number; // New prop for configurable pagination
  showPagination?: boolean; // New prop to control pagination display
  // Server-driven pagination (optional). If provided, component will not slice locally
  currentPage?: number;
  total?: number;
  totalPages?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  // Server-side search props
  searchTerm?: string;
  onSearchChange?: (searchTerm: string) => void;
  useServerSideSearch?: boolean;
  // Page identification
  currentPageName?: string; // 'pricing', 'verify-price', 'completed-quotes', etc.
}

type FilterType = 'all' | 'unpriced' | 'priced';

type QuoteStatus = 'unpriced' | 'priced' | 'completed' | 'ordered' | 'delivered' | 'waiting_verification' | 'wrong';

export default function QuoteTable({ quotes, parts, onUpdateQuote, onDeleteQuote, onUpdatePart, onUpdateMultipleParts, onMarkCompleted, onMarkAsOrdered, onMarkAsOrderedWithParts, onMarkAsWrong, showCompleted = false, defaultFilter = 'all', isLoading = false, itemsPerPage = 10, showPagination = true, currentPage: externalCurrentPage, total: externalTotal, totalPages: externalTotalPages, pageSize: externalPageSize, onPageChange, onPageSizeChange, searchTerm: externalSearchTerm, onSearchChange, useServerSideSearch = false, currentPageName }: QuoteTableProps) {
  const { showSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // Safety checks for undefined props
  if (!quotes || !Array.isArray(quotes)) {
    console.warn('QuoteTable: quotes prop is undefined or not an array, using empty array');
    quotes = [];
  }

  if (!parts || !Array.isArray(parts)) {
    console.warn('QuoteTable: parts prop is undefined or not an array, using empty array');
    parts = [];
  }

  const [filter, setFilter] = useState<FilterType>(defaultFilter);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [singleQuoteMode, setSingleQuoteMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('single-quote-mode');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Use external search term when server-side search is enabled
  const effectiveSearchTerm = useServerSideSearch ? externalSearchTerm || '' : searchTerm;

  // Initialize expanded rows - only expand the first quote in the list
  useEffect(() => {
    const newExpandedRows = new Set<string>();

    // Only expand the first quote in the list to reduce clutter
    if (quotes.length > 0) {
      newExpandedRows.add(quotes[0].id);
    }

    setExpandedRows(newExpandedRows);
  }, [quotes]);

  // Auto-expand single quote when in single quote mode
  useEffect(() => {
    if (singleQuoteMode && quotes.length > 0) {
      // In single quote mode, expand the first quote
      setExpandedRows(new Set([quotes[0].id]));
    }
  }, [singleQuoteMode, quotes]);

  // Listen for realtime toggle events to refresh data
  useEffect(() => {
    const handleRefreshQuotes = () => {
      // Trigger a manual refresh of quotes data using TanStack Query
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['parts'] });
    };

    window.addEventListener('refresh-quotes-data', handleRefreshQuotes);

    return () => {
      window.removeEventListener('refresh-quotes-data', handleRefreshQuotes);
    };
  }, [queryClient]);
  const [editingQuote, setEditingQuote] = useState<string | null>(null);
  const [editingParts, setEditingParts] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [partEditData, setPartEditData] = useState<Record<string, Record<string, any>>>({});
  const [quoteNotesEditData, setQuoteNotesEditData] = useState<Record<string, string>>({});
  const [isQuickFillSelecting, setIsQuickFillSelecting] = useState(false);
  const [quoteNotesLoading, setQuoteNotesLoading] = useState<Record<string, boolean>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [focusField, setFocusField] = useState<string | null>(null);
  const focusRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [sendForReviewLoading, setSendForReviewLoading] = useState<string | null>(null);
  const [showOrderConfirm, setShowOrderConfirm] = useState<string | null>(null);
  const [taxInvoiceNumber, setTaxInvoiceNumber] = useState('');
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [quotePartsWithNotes, setQuotePartsWithNotes] = useState<Record<string, Part[]>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Quote edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedQuoteForEdit, setSelectedQuoteForEdit] = useState<Quote | null>(null);

  // Local quotes state for variant management
  const [localQuotes, setLocalQuotes] = useState<Quote[]>(quotes);



  // Pagination state (used only when server-driven props are not provided)
  const [currentPage, setCurrentPage] = useState(1);


  // Helper functions for variant management
  const generateVariantId = () => `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Determine if we are using server-driven pagination
  const isServerPaginated = !!onPageChange && typeof externalCurrentPage === 'number' && typeof externalTotalPages === 'number' && typeof externalTotal === 'number' && typeof externalPageSize === 'number';

  // Effective pagination values for UI
  const effectiveItemsPerPage = singleQuoteMode ? 1 : itemsPerPage;
  const uiPageSize = isServerPaginated ? (externalPageSize as number) : effectiveItemsPerPage;
  const uiCurrentPage = isServerPaginated ? (externalCurrentPage as number) : currentPage;
  const totalPages = isServerPaginated ? (externalTotalPages as number) : Math.ceil(quotes.length / effectiveItemsPerPage);
  const totalCount = isServerPaginated ? (externalTotal as number) : quotes.length;

  // Start/End indices purely for display purposes
  const startIndex = (uiCurrentPage - 1) * uiPageSize;
  const endIndex = Math.min(startIndex + (isServerPaginated ? quotes.length : uiPageSize), totalCount);

  // For server pagination, do not slice; quotes already reflect the current page
  const paginatedQuotes = isServerPaginated ? quotes : quotes.slice(startIndex, startIndex + uiPageSize);

  // Reset local page to first when data set changes in client-mode only
  useEffect(() => {
    if (!isServerPaginated) {
      setCurrentPage(1);
    }
  }, [quotes.length, isServerPaginated]);

  // Pagination handlers
  const goToPage = (page: number) => {
    if (isServerPaginated && onPageChange) {
      onPageChange(page);
    } else {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    const next = uiCurrentPage + 1;
    if (uiCurrentPage < totalPages) {
      if (isServerPaginated && onPageChange) {
        onPageChange(next);
      } else {
        setCurrentPage(next);
      }
    }
  };

  const goToPrevPage = () => {
    const prev = uiCurrentPage - 1;
    if (uiCurrentPage > 1) {
      if (isServerPaginated && onPageChange) {
        onPageChange(prev);
      } else {
        setCurrentPage(prev);
      }
    }
  };

  const addVariantToPart = (quoteId: string, partId: string) => {
    // Only add to local state, don't save to database yet
    const newVariantId = generateVariantId();

    console.log('➕ Adding new variant:', { quoteId, partId, newVariantId });

    // CRITICAL FIX: When adding a new variant, we must ensure ALL existing variants 
    // are also tracked in partEditData to ensure they get sent in the payload
    setPartEditData(prev => {
      const quote = localQuotes.find(q => q.id === quoteId);
      const quotePart = quote?.partsRequested?.find(p => p.part_id === partId);
      const existingVariants = quotePart?.variants || [];
      
      const existingPartData = prev[partId] || {};
      
      // Build the new part data structure that includes ALL variants
      const newPartData: any = { ...existingPartData };
      
      // Get the part to access the number field
      const actualPart = parts.find(p => p.id === partId);
      
      // FIRST: Ensure ALL existing variants are in partEditData
      // This is crucial - if they're not being edited, they won't be in partEditData,
      // and won't be sent to the backend
      existingVariants.forEach(variant => {
        if (!newPartData[variant.id]) {
          // CRITICAL: Add existing variant data INCLUDING number field to ensure it's included in payload
          newPartData[variant.id] = {
            number: variant.number || actualPart?.number || '',
            note: variant.note || '',
            final_price: variant.final_price,
            list_price: variant.list_price,
            af: variant.af || false
          };
          console.log('📝 Adding existing variant to partEditData:', { 
            partId, 
            variantId: variant.id,
            hasNumber: !!(variant.number || actualPart?.number)
          });
        }
      });
      
      // THEN: Add the new variant (with number field)
      newPartData[newVariantId] = { 
        number: actualPart?.number || '',
        note: '', 
        final_price: null, 
        list_price: null, 
        af: false 
      };

      return {
        ...prev,
        [partId]: newPartData
      };
    });

    // Add to local quote state for display - use functional update for consistency
    setLocalQuotes(prev => {
      const updatedQuotes = prev.map(q =>
        q.id === quoteId
          ? {
            ...q,
            partsRequested: q.partsRequested.map(p =>
              p.part_id === partId
                ? {
                  ...p,
                  variants: [
                    ...(p.variants || []),
                    {
                      id: newVariantId,
                      note: '',
                      final_price: null,
                      list_price: null,
                      af: false,
                      created_at: new Date().toISOString(),
                      is_default: false
                    }
                  ]
                }
                : p
            )
          }
          : q
      );

      return updatedQuotes;
    });

    // Always ensure editing state is set for this quote
    setEditingParts(quoteId);
    
    console.log('✅ Variant added successfully');
  };

  const removeVariantFromPart = (quoteId: string, partId: string, variantId: string) => {
    // Only update local state, don't save to database yet

    // Update local quote state
    setLocalQuotes(prev => prev.map(q =>
      q.id === quoteId
        ? {
          ...q,
          partsRequested: q.partsRequested.map(p =>
            p.part_id === partId
              ? {
                ...p,
                variants: p.variants.filter(v => v.id !== variantId)
              }
              : p
          )
        }
        : q
    ));

    // Ensure at least one variant remains
    setLocalQuotes(prev => prev.map(q =>
      q.id === quoteId
        ? {
          ...q,
          partsRequested: q.partsRequested.map(p =>
            p.part_id === partId
              ? {
                ...p,
                variants: p.variants.length === 0 ? [{
                  id: generateVariantId(),
                  note: '',
                  final_price: null,
                  list_price: null,
                  af: false,
                  created_at: new Date().toISOString(),
                  is_default: true
                }] : p.variants
              }
              : p
          )
        }
        : q
    ));

    // Clear edit data for removed variant
    setPartEditData(prev => {
      const newData = { ...prev };
      if (newData[partId]) {
        delete newData[partId][variantId];
        if (Object.keys(newData[partId]).length === 0) {
          delete newData[partId];
        }
      }
      return newData;
    });
  };



  // Function to get parts with their quote-specific notes merged in
  const getQuotePartsWithNotes = async (quoteId: string, partRequested: string): Promise<Part[]> => {
    // First try to find the quote with JSON structure
    const quote = quotes.find(q => q.id === quoteId);
    if (quote && quote.partsRequested && Array.isArray(quote.partsRequested)) {
      // Use new JSON structure - much faster and more reliable
      return getQuotePartsFromJson(quote, parts);
    }

    // If no JSON structure found, fetch the quote directly from database
    try {
      const { data: freshQuote, error: quoteError } = await supabase
        .from('quotes')
        .select('parts_requested')
        .eq('id', quoteId)
        .single();

      if (quoteError) {
        console.error('Error fetching quote:', quoteError);
        return getQuoteParts(partRequested); // Fallback to basic parts
      }

      if (freshQuote?.parts_requested && Array.isArray(freshQuote.parts_requested)) {
        // Create a temporary quote object for the helper function
        const tempQuote = {
          ...quote,
          id: quoteId,
          partsRequested: freshQuote.parts_requested
        } as any;
        return getQuotePartsFromJson(tempQuote, parts);
      }

      return getQuoteParts(partRequested);

    } catch (error) {
      console.error('Error fetching quote parts:', error);
      return getQuoteParts(partRequested); // Fallback to basic parts
    }
  };

  // Helper function to combine quote notes with part notes
  const getCombinedNotes = (quoteNotes: string | undefined, partNote: string | undefined): string => {
    if (!quoteNotes) return partNote || '';
    if (!partNote) return quoteNotes;
    // If both exist, combine them with a separator
    return `${quoteNotes} | ${partNote}`;
  };

  // Function to get parts with notes for a specific quote (synchronous)
  const getQuotePartsWithNotesSync = (quoteId: string): Part[] => {
    // First try to find the quote with JSON structure
    const quote = quotes.find(q => q.id === quoteId);
    if (quote && quote.partsRequested && Array.isArray(quote.partsRequested)) {
      // Use new JSON structure - this is much faster as it's synchronous
      return getQuotePartsFromJson(quote, parts);
    }

    // Fallback to cached data or basic parts lookup
    const cachedParts = quotePartsWithNotes[quoteId];
    if (cachedParts && cachedParts.length > 0) {
      return cachedParts;
    }

    // Last resort - basic parts without quote-specific data
    return getQuoteParts(quote?.partRequested || '');
  };

  const getQuoteParts = (partRequested: string): Part[] => {
    if (!partRequested) {
      return [];
    }

    const partIds = partRequested.split(',').map(id => id.trim());

    const foundParts = parts.filter(part => {
      const isFound = partIds.includes(String(part.id));
      return isFound;
    });

    // TODO: This legacy function returns parts without quote-specific notes
    // The new JSON structure in getQuotePartsFromJson() includes notes

    return foundParts;
  };

  // Brand colors
  const brandRed = '#d0202d';
  const brandColors = {
    primary: brandRed,
    secondary: '#1f2937',
    accent: '#f3f4f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: brandRed,
  };

  // Update current time every minute for deadline indicators
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingQuote(null);
        setEditingParts(null);
        setQuoteNotesEditData({});
        setFocusField(null);
      }

      if (e.key === 'Enter' && (editingQuote || editingParts)) {
        handleSave();
      }

      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingQuote, editingParts]);


  // Synchronize localQuotes with quotes prop
  useEffect(() => {
    // Only update if localQuotes is empty (first mount) or if there are new quotes
    // that don't exist in localQuotes yet
    if (localQuotes.length === 0) {
      setLocalQuotes(quotes);
    } else {
      // Check if there are new quotes that don't exist in localQuotes
      const newQuotes = quotes.filter(quote =>
        !localQuotes.find(localQuote => localQuote.id === quote.id)
      );

      if (newQuotes.length > 0) {
        setLocalQuotes(prev => [...prev, ...newQuotes]);
      }

      // Only update existing quotes if there are actual non-variant changes
      // This prevents overwriting local variant changes when quotes prop changes
      const hasNonVariantChanges = quotes.some(quote => {
        const localQuote = localQuotes.find(lq => lq.id === quote.id);
        if (!localQuote) return false;

        // Check if any non-variant fields have changed
        return (
          localQuote.status !== quote.status ||
          localQuote.vin !== quote.vin ||
          localQuote.make !== quote.make ||
          localQuote.model !== quote.model ||
          localQuote.series !== quote.series ||
          localQuote.auto !== quote.auto ||
          localQuote.body !== quote.body ||
          localQuote.year !== quote.year ||
          localQuote.color !== quote.color ||
          localQuote.notes !== quote.notes ||
          localQuote.requiredBy !== quote.requiredBy ||
          localQuote.quoteRef !== quote.quoteRef ||
          localQuote.createdAt !== quote.createdAt
        );
      });

      if (hasNonVariantChanges) {
        // Only update the specific quotes that have non-variant changes
        setLocalQuotes(prev => prev.map(localQuote => {
          const updatedQuote = quotes.find(q => q.id === localQuote.id);
          if (updatedQuote) {
            // Check if this specific quote has non-variant changes
            const hasChanges = (
              localQuote.status !== updatedQuote.status ||
              localQuote.vin !== updatedQuote.vin ||
              localQuote.make !== updatedQuote.make ||
              localQuote.model !== updatedQuote.model ||
              localQuote.series !== updatedQuote.series ||
              localQuote.auto !== updatedQuote.auto ||
              localQuote.body !== updatedQuote.body ||
              localQuote.year !== updatedQuote.year ||
              localQuote.color !== updatedQuote.color ||
              localQuote.notes !== updatedQuote.notes ||
              localQuote.requiredBy !== updatedQuote.requiredBy ||
              localQuote.quoteRef !== updatedQuote.quoteRef ||
              localQuote.createdAt !== updatedQuote.createdAt
            );

            if (hasChanges) {
              // Preserve local variant changes but update other fields
              return {
                ...updatedQuote,
                partsRequested: localQuote.partsRequested || updatedQuote.partsRequested
              };
            }
          }
          return localQuote;
        }));
      }
    }
  }, [quotes]); // Restore quotes dependency but with better logic

  const handleSendForReview = async (quoteId: string) => {
    const quote = localQuotes.find(q => q.id === quoteId);
    if (!quote) return;

    setSendForReviewLoading(quoteId);

    try {
      let updates: Array<{ id: string; updates: Partial<Part> }> = [];

      if (editingParts === quoteId) {
        // We're in editing mode, use the current edit data
        const quoteParts = getQuotePartsWithNotesSync(quoteId);

        // Check if there are any prices in the current edit data
        const hasAnyPriceInEditData = quoteParts.some(part => {
          const editData = partEditData[part.id];
          if (editData) {
            // Check both variant and part-level prices
            const hasVariantPrice = Object.values(editData).some((variantData: any) =>
              (variantData.final_price && variantData.final_price > 0) ||
              (variantData.list_price && variantData.list_price > 0)
            );
            const hasPartPrice = (editData.price && editData.price > 0) ||
              (editData.list_price && editData.list_price > 0);
            return hasVariantPrice || hasPartPrice;
          }
          return part.price && part.price > 0;
        });

        if (!hasAnyPriceInEditData) {
          showSnackbar('Please add prices to at least one part before sending for review', 'warning');
          setSendForReviewLoading(null);
          return;
        }

        // Build updates from edit data
        updates = quoteParts.map(part => {
          const editData = partEditData[part.id];
          if (editData) {
            // Check if editData has variant structure (object with variant IDs as keys)
            const hasVariantStructure = Object.keys(editData).some(key =>
              key !== 'note' && key !== 'price' && key !== 'list_price' && key !== 'af' && key !== 'number'
            );

            if (hasVariantStructure) {
              // For parts with variants, use the first variant's data
              const variantId = Object.keys(editData).find(key =>
                key !== 'note' && key !== 'price' && key !== 'list_price' && key !== 'af' && key !== 'number'
              );
              const variantData = variantId ? editData[variantId] : {};

              return {
                id: part.id,
                updates: {
                  variantId: variantId || 'default',
                  note: (variantData.note ?? part.note) || '',
                  price: (variantData.final_price ?? part.price) || null,
                  list_price: (variantData.list_price ?? part.list_price) || null,
                  af: (variantData.af ?? part.af) || false,
                  number: part.number || ''
                }
              };
            } else {
              // For parts without variants, use part-level data
              return {
                id: part.id,
                updates: {
                  note: (editData.note ?? part.note) || '',
                  price: (editData.price ?? part.price) || null,
                  list_price: (editData.list_price ?? part.list_price) || null,
                  af: (editData.af ?? part.af) || false,
                  number: (editData.number ?? part.number) || ''
                }
              };
            }
          }

          // No edit data, use existing part data
          return {
            id: part.id,
            updates: {
              note: part.note || '',
              price: part.price || null,
              list_price: part.list_price || null,
              af: part.af || false,
              number: part.number || ''
            }
          };
        });
      } else {
        // Not in editing mode, use existing data
        const quoteParts = getQuotePartsWithNotesSync(quoteId);
        const hasAnyPrice = quoteParts.some(part => part.price && part.price > 0);

        if (!hasAnyPrice) {
          showSnackbar('Please add prices to at least one part before sending for review', 'warning');
          setSendForReviewLoading(null);
          return;
        }

        updates = quoteParts.map(part => ({
          id: part.id,
          updates: {
            variantId: 'default',
            note: part.note || '',
            price: part.price || null,
            list_price: part.list_price || null,
            af: part.af || false,
            number: part.number || ''
          }
        }));
      }

      // Use the comprehensive batch mutation that handles both parts and status
      await onUpdateMultipleParts(updates, quoteId, true); // Pass true to change status

      // Track PRICED action
      try {
        const { QuoteActionsService } = await import('@/services/quoteActions/quoteActionsService');
        await QuoteActionsService.trackQuoteAction(quoteId, 'PRICED');
        console.log('✅ PRICED: Successfully tracked pricing action for quote:', quoteId);
      } catch (trackingError) {
        console.warn('⚠️ PRICED: Failed to track pricing action:', trackingError);
      }

      // If we were in editing mode, exit it
      if (editingParts === quoteId) {
        setEditingParts(null);
        setPartEditData({});
        setQuoteNotesEditData({});
        setFocusField(null);
      }

      showSnackbar('Quote sent for review successfully!', 'success');
    } catch (error) {
      console.error('Error sending quote for review:', error);
      showSnackbar('Error sending quote for review', 'error');
    } finally {
      setSendForReviewLoading(null);
    }
  };

  // Handle direct click to start editing
  const handleDirectEdit = (quoteId: string, fieldToFocus?: string) => {
    if (editingParts !== quoteId) {
      setEditingParts(quoteId);
      setPartEditData({});
    }

    // Set focus field for the specific input that was clicked
    if (fieldToFocus) {
      setFocusField(fieldToFocus);
    }
  };

  // Focus the appropriate field when focusField changes
  useEffect(() => {
    if (focusField && editingParts) {
      const timeoutId = setTimeout(() => {
        const element = focusRefs.current[focusField];
        if (element) {
          element.focus();
        }
      }, 10);

      return () => clearTimeout(timeoutId);
    }
  }, [focusField, editingParts]);

  const handleSend = async () => {
    if (editingQuote) {
      await onUpdateQuote(editingQuote, editData);
      setEditingQuote(null);
      setEditData({});
    }
    if (editingParts) {
      const quote = localQuotes.find(q => q.id === editingParts);
      if (quote) {

        // Prepare the local state update function for after successful backend save
        const updateLocalState = () => {
          setLocalQuotes(prev => prev.map(q =>
            q.id === editingParts
              ? {
                ...q,
                // Update quote status if any part has a price
                status: (() => {
                  const hasAnyPrice = Object.keys(partEditData).some(partId => {
                    const partEditDataForPart = partEditData[partId];
                    return Object.keys(partEditDataForPart).some(variantId => {
                      const variantEditData = partEditDataForPart[variantId];
                      return variantEditData.final_price && variantEditData.final_price > 0;
                    });
                  });

                  // If any part has a price and current status is unpriced, change to waiting_verification
                  if (hasAnyPrice && q.status === 'unpriced') {
                    return 'waiting_verification';
                  }
                  return q.status;
                })(),
                partsRequested: (q.partsRequested ?? []).map(p => {
                  const partEditDataForPart = partEditData[p.part_id];
                  if (partEditDataForPart) {
                    // Update all variants for this part
                    const updatedVariants = (Array.isArray(p.variants) ? p.variants : []).map(variant => {
                      const variantEditData = partEditDataForPart[variant.id];
                      if (variantEditData) {
                        return {
                          ...variant,
                          note: variantEditData.note !== undefined ? variantEditData.note : variant.note,
                          final_price: variantEditData.final_price !== undefined ? variantEditData.final_price : variant.final_price,
                          list_price: variantEditData.list_price !== undefined ? variantEditData.list_price : variant.list_price,
                          af: variantEditData.af !== undefined ? variantEditData.af : variant.af
                        };
                      }
                      return variant;
                    });

                    return {
                      ...p,
                      variants: updatedVariants
                    };
                  }
                  return p;
                })
              }
              : q
          ));
        };

        // Then, save the default variant to the backend (for compatibility with current schema)
        const updates: Array<{ id: string; updates: Partial<Part> & { variantId?: string; list_price?: number | null; af?: boolean; _removedVariantIds?: string[]; _currentVariants?: any[] } }> = [];

        // Only process parts that have actual changes to avoid unnecessary updates
        Object.keys(partEditData).forEach(partId => {
          const partEditDataForPart = partEditData[partId];
          if (partEditDataForPart) {
            // CRITICAL FIX: Use ORIGINAL quote from database (quotes prop), not local state
            // This ensures we correctly detect new variants that don't exist in DB yet
            const originalQuote = quotes.find(q => q.id === editingParts);
            const originalQuotePart = originalQuote?.partsRequested?.find(qp => qp.part_id === partId);
            const existingVariants = originalQuotePart?.variants || [];
            
            // Also get current local state for comparison
            const localQuotePart = quote.partsRequested?.find(qp => qp.part_id === partId);
            const currentVariants = localQuotePart?.variants || [];
            
            const actualPart = parts.find(p => p.id === partId); // Find the actual Part object

            let hasActualChanges = false;

            // Handle part-level changes (like number) that don't have a variant ID
            const partLevelNumber = partEditDataForPart.number;
            console.log('🔍 Part number change check:', {
              partId,
              partLevelNumber,
              actualPartNumber: actualPart?.number,
              isDifferent: partLevelNumber !== actualPart?.number,
              hasValue: partLevelNumber !== undefined && typeof partLevelNumber === 'string'
            });

            if (partLevelNumber !== undefined && typeof partLevelNumber === 'string' && partLevelNumber !== actualPart?.number) {
              hasActualChanges = true;
              console.log('✅ Part number change detected, adding to updates');
              // Apply part-level number change to the first variant (default variant)
              if (existingVariants.length > 0) {
                const defaultVariant = existingVariants[0];
                updates.push({
                  id: partId,
                  updates: {
                    variantId: defaultVariant.id,
                    number: partLevelNumber
                  }
                });
              }
            }

            // Process all existing variants and check for actual changes
            existingVariants.forEach(variant => {
              const variantEditData = partEditDataForPart[variant.id];
              if (variantEditData) {
                // Check if there are actual changes compared to current values
                const hasChanges = (
                  (variantEditData.note !== undefined && variantEditData.note !== variant.note) ||
                  (variantEditData.final_price !== undefined && variantEditData.final_price !== variant.final_price) ||
                  (variantEditData.list_price !== undefined && variantEditData.list_price !== variant.list_price) ||
                  (variantEditData.af !== undefined && variantEditData.af !== variant.af) ||
                  (variantEditData.number !== undefined && variantEditData.number !== actualPart?.number)
                );

                console.log('🔍 Variant change check:', {
                  partId,
                  variantId: variant.id,
                  variantEditDataNumber: variantEditData.number,
                  actualPartNumber: actualPart?.number,
                  hasNumberChange: variantEditData.number !== undefined && variantEditData.number !== actualPart?.number,
                  hasChanges
                });

                if (hasChanges) {
                  hasActualChanges = true;
                  updates.push({
                    id: partId,
                    updates: {
                      variantId: variant.id,
                      number: variantEditData.number !== undefined ? variantEditData.number : actualPart?.number || '',
                      note: variantEditData.note !== undefined ? variantEditData.note : variant.note,
                      price: variantEditData.final_price !== undefined ? variantEditData.final_price : variant.final_price,
                      list_price: variantEditData.list_price !== undefined ? variantEditData.list_price : variant.list_price,
                      af: variantEditData.af !== undefined ? variantEditData.af : variant.af
                    }
                  });
                }
              }
            });

            // IMPORTANT FIX: Process new variants that don't exist in DB yet
            // By using originalQuote above, existingVariants only contains DB variants
            // Any variant in partEditDataForPart that's not in existingVariants is NEW
            const newVariants: string[] = [];
            Object.keys(partEditDataForPart).forEach(variantId => {
              // Skip non-variant keys and variants we already processed
              if (variantId === 'number') return; // Skip part-level number field
              
              const alreadyProcessed = existingVariants.some(v => v.id === variantId);
              if (!alreadyProcessed) {
                newVariants.push(variantId);
                const variantEditData = partEditDataForPart[variantId];
                // For new variants, save them even if fields are empty (to create the variant)
                if (variantEditData) {
                  console.log('🆕 New variant detected:', { partId, variantId, variantEditData });
                  hasActualChanges = true;
                  updates.push({
                    id: partId,
                    updates: {
                      variantId: variantId,
                      number: variantEditData.number !== undefined ? variantEditData.number : actualPart?.number || '',
                      note: variantEditData.note !== undefined ? variantEditData.note : '',
                      price: variantEditData.final_price !== undefined ? variantEditData.final_price : null,
                      list_price: variantEditData.list_price !== undefined ? variantEditData.list_price : null,
                      af: variantEditData.af !== undefined ? variantEditData.af : false
                    }
                  });
                }
              }
            });

            // CRITICAL FIX: If new variants were added, we MUST also save all existing variants
            // from the current local state, even if they weren't edited
            // This ensures the complete variant list is sent to the backend
            if (newVariants.length > 0 && currentVariants.length > 0) {
              console.log('🔄 New variants detected, ensuring ALL variants are sent:', {
                partId,
                newVariants,
                currentVariants: currentVariants.length,
                existingVariants: existingVariants.length
              });
              
              // Process ALL current variants to ensure they're all in the updates
              currentVariants.forEach(variant => {
                // Skip if we already added this variant
                const alreadyInUpdates = updates.some(u => u.id === partId && u.updates.variantId === variant.id);
                if (!alreadyInUpdates) {
                  console.log('➕ Adding existing variant to ensure it is saved:', { partId, variantId: variant.id });
                  hasActualChanges = true;
                  updates.push({
                    id: partId,
                    updates: {
                      variantId: variant.id,
                      number: actualPart?.number || '',
                      note: variant.note || '',
                      price: variant.final_price,
                      list_price: variant.list_price,
                      af: variant.af || false
                    }
                  });
                }
              });
            }
          }
        });

        console.log('📊 Final payload preview:', { 
          totalUpdates: updates.length, 
          updates: updates.map(u => ({ 
            partId: u.id, 
            variantId: u.updates.variantId,
            hasPrice: u.updates.price !== undefined, 
            hasNote: u.updates.note !== undefined 
          })) 
        });

        if (updates.length > 0) {
          console.log('📤 Send button: Sending updates for', updates.length, 'parts:', updates.map(u => ({ id: u.id, hasPrice: u.updates.price !== undefined, hasNote: u.updates.note !== undefined, hasListPrice: u.updates.list_price !== undefined, hasNumber: u.updates.number !== undefined })));
          try {
            const result = await onUpdateMultipleParts(updates, quote.id, true); // Change status for send button
            
            // CRITICAL FIX: Instantly update localQuotes with the fresh data from the server
            if (result?.updatedQuote) {
              console.log('✅ Instantly updating localQuotes with fresh variant data (Send button)');
              setLocalQuotes(prev => prev.map(q => 
                q.id === quote.id 
                  ? { ...q, partsRequested: result.updatedQuote.parts_requested, status: result.updatedQuote.status }
                  : q
              ));
            }
            
            updateLocalState();
            setEditingParts(null);
            setPartEditData({});
            setFocusField(null);
          } catch (error) {
            console.error('Error saving parts:', error);
          }
        } else {
          // No updates to save, just close editing mode
          setEditingParts(null);
          setPartEditData({});
          setFocusField(null);
        }
      }
    }
  };

  const handleSave = async (forceSave: boolean = false) => {
    if (editingQuote) {
      await onUpdateQuote(editingQuote, editData);
      setEditingQuote(null);
      setEditData({});
    }
    if (editingParts) {
      const quote = localQuotes.find(q => q.id === editingParts);
      if (quote) {

        // Prepare the local state update function for after successful backend save
        // Save button does NOT change status - only updates part details
        const updateLocalState = () => {
          setLocalQuotes(prev => prev.map(q =>
            q.id === editingParts
              ? {
                ...q,
                // Keep the same status - no status changes for save button
                status: q.status,
                partsRequested: (q.partsRequested ?? []).map(p => {
                  const partEditDataForPart = partEditData[p.part_id];
                  if (partEditDataForPart) {
                    // Update all variants for this part
                    const updatedVariants = (Array.isArray(p.variants) ? p.variants : []).map(variant => {
                      const variantEditData = partEditDataForPart[variant.id];
                      if (variantEditData) {
                        return {
                          ...variant,
                          note: variantEditData.note !== undefined ? variantEditData.note : variant.note,
                          final_price: variantEditData.final_price !== undefined ? variantEditData.final_price : variant.final_price,
                          list_price: variantEditData.list_price !== undefined ? variantEditData.list_price : variant.list_price,
                          af: variantEditData.af !== undefined ? variantEditData.af : variant.af
                        };
                      }
                      return variant;
                    });

                    return {
                      ...p,
                      variants: updatedVariants
                    };
                  }
                  return p;
                })
              }
              : q
          ));
        };

        // Then, save the default variant to the backend (for compatibility with current schema)
        const updates: Array<{ id: string; updates: Partial<Part> & { variantId?: string; list_price?: number | null; af?: boolean; _removedVariantIds?: string[]; _currentVariants?: any[] } }> = [];

        // Only process parts that have actual changes to avoid unnecessary updates
        Object.keys(partEditData).forEach(partId => {
          const partEditDataForPart = partEditData[partId];
          if (partEditDataForPart) {
            // CRITICAL FIX: Use ORIGINAL quote from database (quotes prop), not local state
            // This ensures we correctly detect new variants that don't exist in DB yet
            const originalQuote = quotes.find(q => q.id === editingParts);
            const originalQuotePart = originalQuote?.partsRequested?.find(qp => qp.part_id === partId);
            const existingVariants = originalQuotePart?.variants || [];
            
            // Also get current local state for comparison
            const localQuotePart = quote.partsRequested?.find(qp => qp.part_id === partId);
            const currentVariants = localQuotePart?.variants || [];
            
            const actualPart = parts.find(p => p.id === partId); // Find the actual Part object

            let hasActualChanges = false;

            // Handle part-level changes (like number) that don't have a variant ID
            const partLevelNumber = partEditDataForPart.number;
            console.log('🔍 Part number change check:', {
              partId,
              partLevelNumber,
              actualPartNumber: actualPart?.number,
              isDifferent: partLevelNumber !== actualPart?.number,
              hasValue: partLevelNumber !== undefined && typeof partLevelNumber === 'string'
            });

            if (partLevelNumber !== undefined && typeof partLevelNumber === 'string' && partLevelNumber !== actualPart?.number) {
              hasActualChanges = true;
              console.log('✅ Part number change detected, adding to updates');
              // Apply part-level number change to the first variant (default variant)
              if (existingVariants.length > 0) {
                const defaultVariant = existingVariants[0];
                updates.push({
                  id: partId,
                  updates: {
                    variantId: defaultVariant.id,
                    number: partLevelNumber
                  }
                });
              }
            }

            // Process all existing variants and check for actual changes
            existingVariants.forEach(variant => {
              const variantEditData = partEditDataForPart[variant.id];
              if (variantEditData) {
                // Check if there are actual changes compared to current values
                const hasChanges = (
                  (variantEditData.note !== undefined && variantEditData.note !== variant.note) ||
                  (variantEditData.final_price !== undefined && variantEditData.final_price !== variant.final_price) ||
                  (variantEditData.list_price !== undefined && variantEditData.list_price !== variant.list_price) ||
                  (variantEditData.af !== undefined && variantEditData.af !== variant.af) ||
                  (variantEditData.number !== undefined && variantEditData.number !== actualPart?.number)
                );

                console.log('🔍 Variant change check:', {
                  partId,
                  variantId: variant.id,
                  variantEditDataNumber: variantEditData.number,
                  actualPartNumber: actualPart?.number,
                  hasNumberChange: variantEditData.number !== undefined && variantEditData.number !== actualPart?.number,
                  hasChanges
                });

                if (hasChanges) {
                  hasActualChanges = true;
                  updates.push({
                    id: partId,
                    updates: {
                      variantId: variant.id,
                      number: variantEditData.number !== undefined ? variantEditData.number : actualPart?.number || '',
                      note: variantEditData.note !== undefined ? variantEditData.note : variant.note,
                      price: variantEditData.final_price !== undefined ? variantEditData.final_price : variant.final_price,
                      list_price: variantEditData.list_price !== undefined ? variantEditData.list_price : variant.list_price,
                      af: variantEditData.af !== undefined ? variantEditData.af : variant.af
                    }
                  });
                }
              }
            });

            // IMPORTANT FIX: Process new variants that don't exist in DB yet
            // By using originalQuote above, existingVariants only contains DB variants
            // Any variant in partEditDataForPart that's not in existingVariants is NEW
            const newVariants: string[] = [];
            Object.keys(partEditDataForPart).forEach(variantId => {
              // Skip non-variant keys and variants we already processed
              if (variantId === 'number') return; // Skip part-level number field
              
              const alreadyProcessed = existingVariants.some(v => v.id === variantId);
              if (!alreadyProcessed) {
                newVariants.push(variantId);
                const variantEditData = partEditDataForPart[variantId];
                // For new variants, save them even if fields are empty (to create the variant)
                if (variantEditData) {
                  console.log('🆕 New variant detected:', { partId, variantId, variantEditData });
                  hasActualChanges = true;
                  updates.push({
                    id: partId,
                    updates: {
                      variantId: variantId,
                      number: variantEditData.number !== undefined ? variantEditData.number : actualPart?.number || '',
                      note: variantEditData.note !== undefined ? variantEditData.note : '',
                      price: variantEditData.final_price !== undefined ? variantEditData.final_price : null,
                      list_price: variantEditData.list_price !== undefined ? variantEditData.list_price : null,
                      af: variantEditData.af !== undefined ? variantEditData.af : false
                    }
                  });
                }
              }
            });

            // CRITICAL FIX: If new variants were added, we MUST also save all existing variants
            // from the current local state, even if they weren't edited
            // This ensures the complete variant list is sent to the backend
            if (newVariants.length > 0 && currentVariants.length > 0) {
              console.log('🔄 New variants detected, ensuring ALL variants are sent:', {
                partId,
                newVariants,
                currentVariants: currentVariants.length,
                existingVariants: existingVariants.length
              });
              
              // Process ALL current variants to ensure they're all in the updates
              currentVariants.forEach(variant => {
                // Skip if we already added this variant
                const alreadyInUpdates = updates.some(u => u.id === partId && u.updates.variantId === variant.id);
                if (!alreadyInUpdates) {
                  console.log('➕ Adding existing variant to ensure it is saved:', { partId, variantId: variant.id });
                  hasActualChanges = true;
                  updates.push({
                    id: partId,
                    updates: {
                      variantId: variant.id,
                      number: actualPart?.number || '',
                      note: variant.note || '',
                      price: variant.final_price,
                      list_price: variant.list_price,
                      af: variant.af || false
                    }
                  });
                }
              });
            }
          }
        });

        console.log('📊 Final payload preview:', { 
          totalUpdates: updates.length, 
          updates: updates.map(u => ({ 
            partId: u.id, 
            variantId: u.updates.variantId,
            hasPrice: u.updates.price !== undefined, 
            hasNote: u.updates.note !== undefined 
          })) 
        });

        // Check for variant removals - compare current state with original database state
        quote.partsRequested?.forEach(partItem => {
          const partId = partItem.part_id;
          const currentVariants = partItem.variants || [];

          // Find the original quote from the database (not local state)
          const originalQuote = quotes.find(q => q.id === editingParts);
          const originalPart = originalQuote?.partsRequested?.find(qp => qp.part_id === partId);
          const originalVariants = originalPart?.variants || [];

          // Check if any variants were removed
          const removedVariants = originalVariants.filter(originalVariant =>
            !currentVariants.some(currentVariant => currentVariant.id === originalVariant.id)
          );

          if (removedVariants.length > 0) {
            // Send an update to remove the variants from the database
            updates.push({
              id: partId,
              updates: {
                variantId: 'variant-removal',
                _removedVariantIds: removedVariants.map(v => v.id),
                _currentVariants: currentVariants,
                // Include variant data to ensure the update is processed
                note: currentVariants.length > 0 ? currentVariants[0].note : '',
                price: currentVariants.length > 0 ? currentVariants[0].final_price : null,
                list_price: currentVariants.length > 0 ? currentVariants[0].list_price : null,
                af: currentVariants.length > 0 ? currentVariants[0].af : false,
                number: parts.find(p => p.id === partId)?.number || ''
              }
            });
          }
        });

        // Debug: Log the current state of all variants for this quote
        const currentQuote = localQuotes.find(q => q.id === editingParts);

        // Note: JSON structure updates are now handled by the mutation

        if (updates.length > 0 || forceSave) {
          if (forceSave && updates.length === 0) {
            // If force save is true but no updates, create dummy updates for all parts to ensure save happens
            const quoteParts = getQuotePartsWithNotesSync(editingParts);
            const dummyUpdates = quoteParts.map(part => ({
              id: part.id,
              updates: {
                variantId: 'default',
                note: part.note || '',
                price: part.price || null,
                list_price: part.list_price || null,
                af: part.af || false,
                number: part.number || ''
              }
            }));
            console.log('💾 Force Save: Sending dummy updates for', dummyUpdates.length, 'parts');
            try {
              await onUpdateMultipleParts(dummyUpdates, editingParts, false); // Don't change status for save button
              updateLocalState();
            } catch (error) {
              console.error('Error force saving parts to backend:', error);
            }
          } else {
            console.log('💾 Save button: Sending updates for', updates.length, 'parts:', updates.map(u => ({ id: u.id, hasPrice: u.updates.price !== undefined, hasNote: u.updates.note !== undefined, hasListPrice: u.updates.list_price !== undefined, hasNumber: u.updates.number !== undefined })));
            try {
              // Pass the quote ID to onUpdateMultipleParts for more reliable lookup
              const result = await onUpdateMultipleParts(updates, editingParts, false); // Don't change status for save button

              // CRITICAL FIX: Instantly update localQuotes with the fresh data from the server
              if (result?.updatedQuote) {
                console.log('✅ Instantly updating localQuotes with fresh variant data');
                setLocalQuotes(prev => prev.map(q => 
                  q.id === editingParts 
                    ? { ...q, partsRequested: result.updatedQuote.parts_requested }
                    : q
                ));
              }

              // Update local state after successful backend save
              updateLocalState();

            } catch (error) {
              console.error('Error saving parts to backend:', error);
              // Don't update local state if backend save failed
            }
          }
        }
      }

      setEditingParts(null);
      setPartEditData({});
      setFocusField(null);
    }
  };

  const startEditingParts = (quoteParts: Part[], quoteId: string) => {
    const newPartEditData: Record<string, Record<string, any>> = {};
    const localQuote = localQuotes.find(q => q.id === quoteId);

    if (localQuote) {
      quoteParts.forEach(part => {
        const quotePart = localQuote.partsRequested?.find(qp => qp.part_id === part.id);
        if (quotePart && quotePart.variants && quotePart.variants.length > 0) {
          // Initialize edit data for all existing variants
          quotePart.variants.forEach(variant => {
            if (!newPartEditData[part.id]) {
              newPartEditData[part.id] = {};
            }
            newPartEditData[part.id][variant.id] = {
              note: variant.note || '',
              final_price: variant.final_price || null,
              list_price: variant.list_price || null,
              af: variant.af || false
            };
          });
        } else {
          // Only create default variant for parts that truly have no variants
          // This should only happen for unpriced quotes with legacy data
          newPartEditData[part.id] = {
            'default': {
              note: part.note || '',
              final_price: part.price || null,
              list_price: part.list_price || null,
              af: part.af || false
            }
          };
        }
      });
    }

    setPartEditData(newPartEditData);
    setEditingParts(quoteId);
  };

  const handleQuoteEditChange = (field: string, value: string | number | boolean) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleQuoteNotesChange = (quoteId: string, notes: string) => {
    // Store notes in local state for immediate UI updates
    setQuoteNotesEditData(prev => ({
      ...prev,
      [quoteId]: notes
    }));
  };


  const handleQuickFillSelect = () => {
    // Set flag to prevent blur save when quick fill selection is happening
    setIsQuickFillSelecting(true);
    // Reset the flag after a longer delay to ensure the popup close event has time to process
    setTimeout(() => {
      setIsQuickFillSelecting(false);
    }, 200);
  };

  const handleQuoteNotesSave = async (quoteId: string) => {
    // Save quote notes when input loses focus or popup closes
    if (quoteNotesEditData[quoteId] !== undefined) {
      try {
        // Set loading state
        setQuoteNotesLoading(prev => ({ ...prev, [quoteId]: true }));

        const result = await onUpdateQuote(quoteId, { notes: quoteNotesEditData[quoteId] });

        // Update local quotes state with the new notes
        setLocalQuotes(prev => prev.map(q =>
          q.id === quoteId
            ? { ...q, notes: quoteNotesEditData[quoteId] }
            : q
        ));

        // Clear the edit data after successful save
        setQuoteNotesEditData(prev => {
          const newData = { ...prev };
          delete newData[quoteId];
          return newData;
        });
      } catch (error) {
        console.error('Error saving quote notes:', error);
        showSnackbar('Failed to save quote notes', 'error');
      } finally {
        // Clear loading state
        setQuoteNotesLoading(prev => ({ ...prev, [quoteId]: false }));
      }
    }
  };

  const handlePartEditChange = (partId: string, field: string, value: string | number | boolean | null) => {
    setPartEditData(prev => ({
      ...prev,
      [partId]: {
        ...prev[partId],
        [field]: value
      }
    }));
  };

  const handleVariantEditChange = (partId: string, variantId: string, field: string, value: string | number | boolean | null) => {
    setPartEditData(prev => ({
      ...prev,
      [partId]: {
        ...prev[partId],
        [variantId]: {
          ...prev[partId]?.[variantId],
          [field]: value
        }
      }
    }));
  };

  const getQuoteStatus = (quoteParts: Part[], quoteStatus?: string): QuoteStatus => {
    // Prioritize database status over calculated status
    if (quoteStatus === 'delivered') return 'delivered';
    if (quoteStatus === 'ordered') return 'ordered';
    if (quoteStatus === 'completed') return 'completed';
    if (quoteStatus === 'priced') return 'priced';
    if (quoteStatus === 'waiting_verification') return 'waiting_verification';
    if (quoteStatus === 'unpriced') return 'unpriced';
    if (quoteStatus === 'wrong') return 'wrong';
    if (quoteStatus === 'active') {
      // Fallback to calculation for legacy quotes
      if (quoteParts.length === 0) return 'unpriced';
      // Since we're ignoring base part prices, we need to check variants
      // For now, assume unpriced if we can't determine from variants
      return 'unpriced';
    }
    return 'unpriced';
  };


  const getVehicleLogo = (make: string) => {
    const logos: Record<string, string> = {
      'default': '/car-logos/default.png',
      'toyota': '/car-logos/toyota.png',
      'honda': '/car-logos/honda.png',
      'ford': '/car-logos/ford.png',
      'bmw': '/car-logos/bmw.png',
      'mercedes': '/car-logos/mercedes.png',
      'audi': '/car-logos/audi.png',
      'volkswagen': '/car-logos/volkswagen.png',
      'nissan': '/car-logos/nissan.png',
      'hyundai': '/car-logos/hyundai.png',
      'kia': '/car-logos/kia.png',
      'chevrolet': '/car-logos/chevrolet.png',
      'mazda': '/car-logos/mazda.png',
      'lexus': '/car-logos/lexus.png',
      'volvo': '/car-logos/volvo.png',
      'subaru': '/car-logos/subaru.png',
      'land rover': '/car-logos/landrover.png',
      'jaguar': '/car-logos/jaguar.png',
      'mini': '/car-logos/mini.png',
      'peugeot': '/car-logos/peugeot.png',
      'renault': '/car-logos/renault.png',
      'skoda': '/car-logos/skoda.png',
      'alfa romeo': '/car-logos/alfaromeo.png',
      'infiniti': '/car-logos/infiniti.png',
      'jeep': '/car-logos/jeep.png',
      'mg': '/car-logos/mg.png',
      'mitsubishi': '/car-logos/mitsubisi.png',
      'isuzu': '/car-logos/isuzu.png',
      'haval': '/car-logos/haval.png',
    };
    return logos[make?.toLowerCase()] || '/car-logos/default.png'; // Default to Toyota if make not found
  };

  const getPartIcon = (partName: string): string | null => {
    const iconMap: Record<string, string> = {
      'Radiator': '/part-icons/radiator.png',
      'Left Headlamp': '/part-icons/headlight-left.png',
      'Right Headlamp': '/part-icons/headlight-right.png',
      'Condenser': '/part-icons/condenser.png',
      'Radar Sensor': '/part-icons/sensor.png',
      'Fan Assembly': '/part-icons/fa.png',
      'Intercooler': '/part-icons/intercooler.png',
      'Oil Cooler': '/part-icons/oilcooler.png',
      'Auxiliary Radiator': '/part-icons/aux.png',
      'Left DayLight': '/part-icons/lh.png',
      'Right DayLight': '/part-icons/rh.png',
      'Left Rear Lamp': '/part-icons/headlight-left.png',
      'Right Rear Lamp': '/part-icons/headlight-right.png',
    };

    return iconMap[partName] || null;
  };

  const getDeadlineIndicator = (requiredBy: string | undefined) => {
    if (!requiredBy) return null;

    try {
      // Check if it's an ISO timestamp (contains 'T')
      if (requiredBy.includes('T')) {
        // ISO timestamp format
        const deadline = new Date(requiredBy);
        const now = new Date(); // Use current time for accurate comparison

        const diffMs = deadline.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));

        let color = 'border-green-500 text-green-600 bg-green-50';
        let animation = '';

        if (diffMins < 0) {
          // Overdue
          color = 'border-red-500 text-red-600 bg-red-50';
          animation = '';
        } else if (diffMins < 10) {
          // Less than 15 minutes
          color = 'border-red-500 text-red-600 bg-red-50';
          animation = '';
        } else if (diffMins < 30) {
          // Less than 30 minutes
          color = 'border-yellow-500 text-yellow-600 bg-yellow-50';
          animation = '';
        } else {
          // More than 30 minutes
          color = 'border-green-500 text-green-600 bg-green-50';
        }

        // Format the time display
        let timeDisplay = '';
        if (diffMins < 0) {
          // Overdue - show negative time
          const absMins = Math.abs(diffMins);
          if (absMins < 60) {
            timeDisplay = `-${absMins}m`;
          } else if (absMins < 1440) { // Less than 24 hours
            const hours = Math.floor(absMins / 60);
            const mins = absMins % 60;
            timeDisplay = `-${hours}h ${mins}m`;
          } else if (absMins < 10080) { // Less than 7 days
            const days = Math.floor(absMins / 1440);
            const remainingMins = absMins % 1440;
            const hours = Math.floor(remainingMins / 60);
            const mins = remainingMins % 60;
            timeDisplay = `-${days}d ${hours}h ${mins}m`;
          } else {
            const weeks = Math.floor(absMins / 10080);
            const remainingMins = absMins % 10080;
            const days = Math.floor(remainingMins / 1440);
            const hours = Math.floor((remainingMins % 1440) / 60);
            const mins = remainingMins % 60;
            timeDisplay = `-${weeks}wk ${days}d ${hours}h ${mins}m`;
          }
        } else if (diffMins < 60) {
          // Less than 1 hour
          timeDisplay = `${diffMins}m`;
        } else if (diffMins < 1440) { // Less than 24 hours
          const hours = Math.floor(diffMins / 60);
          const mins = diffMins % 60;
          timeDisplay = `${hours}h ${mins}m`;
        } else if (diffMins < 10080) { // Less than 7 days
          const days = Math.floor(diffMins / 1440);
          const remainingMins = diffMins % 1440;
          const hours = Math.floor(remainingMins / 60);
          const mins = remainingMins % 60;
          timeDisplay = `${days}d ${hours}h ${mins}m`;
        } else {
          // More than 7 days
          const weeks = Math.floor(diffMins / 10080);
          const remainingMins = diffMins % 10080;
          const days = Math.floor(remainingMins / 1440);
          const hours = Math.floor((remainingMins % 1440) / 60);
          const mins = remainingMins % 60;
          timeDisplay = `${weeks}wk ${days}d ${hours}h ${mins}m`;
        }

        return { color, animation, timeDisplay };
      }

      // Legacy format (date and time as string) - Australian dd/mm/yyyy format
      const [datePart, timePart] = requiredBy.split(' ');
      const [day, month, year] = datePart.split('/');
      const timeStr = timePart.toLowerCase();

      let hours = 0;
      let minutes = 0;

      if (timeStr.includes('pm')) {
        const time = timeStr.replace('pm', '');
        if (time.includes(':')) {
          const [h, m] = time.split(':');
          const hour = parseInt(h);
          // 12 PM should be 12, not 24
          hours = hour === 12 ? 12 : hour + 12;
          minutes = parseInt(m || '0');
        } else {
          // Handle format like "1200pm"
          const timeNum = parseInt(time);
          const hour = Math.floor(timeNum / 100);
          // 12 PM should be 12, not 24
          hours = hour === 12 ? 12 : hour + 12;
          minutes = timeNum % 100;
        }
      } else if (timeStr.includes('am')) {
        const time = timeStr.replace('am', '');
        if (time.includes(':')) {
          const [h, m] = time.split(':');
          hours = parseInt(h);
          minutes = parseInt(m || '0');
        } else {
          // Handle format like "1200am"
          const timeNum = parseInt(time);
          hours = Math.floor(timeNum / 100);
          minutes = timeNum % 100;
        }
      }

      const deadline = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hours, minutes);
      const now = new Date(); // Use current time for accurate comparison
      const diffMs = deadline.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));

      let color = 'border-green-500 text-green-600 bg-green-50';
      let animation = '';

      if (diffMins < 0) {
        // Overdue
        color = 'border-red-500 text-red-600 bg-red-50';
        animation = '';
      } else if (diffMins < 15) {
        // Less than 15 minutes
        color = 'border-red-500 text-red-600 bg-red-50';
        animation = '';
      } else if (diffMins < 30) {
        // Less than 30 minutes
        color = 'border-yellow-500 text-yellow-600 bg-yellow-50';
        animation = '';
      } else {
        // More than 30 minutes
        color = 'border-green-500 text-green-600 bg-green-50';
      }

      // Format the time display
      let timeDisplay = '';
      if (diffMins < 0) {
        // Overdue - show negative time
        const absMins = Math.abs(diffMins);
        if (absMins < 60) {
          timeDisplay = `-${absMins}m`;
        } else if (absMins < 1440) { // Less than 24 hours
          const hours = Math.floor(absMins / 60);
          const mins = absMins % 60;
          timeDisplay = `-${hours}h ${mins}m`;
        } else if (absMins < 10080) { // Less than 7 days
          const days = Math.floor(absMins / 1440);
          const remainingMins = absMins % 1440;
          const hours = Math.floor(remainingMins / 60);
          const mins = remainingMins % 60;
          timeDisplay = `-${days}d ${hours}h ${mins}m`;
        } else {
          const weeks = Math.floor(absMins / 10080);
          const remainingMins = absMins % 10080;
          const days = Math.floor(remainingMins / 1440);
          const hours = Math.floor((remainingMins % 1440) / 60);
          const mins = remainingMins % 60;
          timeDisplay = `-${weeks}wk ${days}d ${hours}h ${mins}m`;
        }
      } else if (diffMins < 60) {
        // Less than 1 hour
        timeDisplay = `${diffMins}m`;
      } else if (diffMins < 1440) { // Less than 24 hours
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        timeDisplay = `${hours}h ${mins}m`;
      } else if (diffMins < 10080) { // Less than 7 days
        const days = Math.floor(diffMins / 1440);
        const remainingMins = diffMins % 1440;
        const hours = Math.floor(remainingMins / 60);
        const mins = remainingMins % 60;
        timeDisplay = `${days}d ${hours}h ${mins}m`;
      } else {
        // More than 7 days
        const weeks = Math.floor(diffMins / 10080);
        const remainingMins = diffMins % 10080;
        const days = Math.floor(remainingMins / 1440);
        const hours = Math.floor((remainingMins % 1440) / 60);
        const mins = remainingMins % 60;
        timeDisplay = `${weeks}wk ${days}d ${hours}h ${mins}m`;
      }

      return { color, animation, timeDisplay };
    } catch (error) {
      return null;
    }
  };

  // Function to handle quote verification confirmation
  const handleVerifyQuote = async (quoteId: string) => {
    try {
      let updates: Array<{ id: string; updates: Partial<Part> }> = [];

      if (editingParts === quoteId) {
        // We're in editing mode, use the current edit data
        const quoteParts = getQuotePartsWithNotesSync(quoteId);

        // Build updates from edit data
        updates = quoteParts.map(part => {
          const editData = partEditData[part.id];
          if (editData) {
            // Check if editData has variant structure (object with variant IDs as keys)
            const hasVariantStructure = Object.keys(editData).some(key =>
              key !== 'note' && key !== 'price' && key !== 'list_price' && key !== 'af' && key !== 'number'
            );

            if (hasVariantStructure) {
              // For parts with variants, use the first variant's data
              const variantId = Object.keys(editData).find(key =>
                key !== 'note' && key !== 'price' && key !== 'list_price' && key !== 'af' && key !== 'number'
              );
              const variantData = variantId ? editData[variantId] : {};

              return {
                id: part.id,
                updates: {
                  variantId: variantId || 'default',
                  note: (variantData.note ?? part.note) || '',
                  price: (variantData.final_price ?? part.price) || null,
                  list_price: (variantData.list_price ?? part.list_price) || null,
                  af: (variantData.af ?? part.af) || false,
                  number: part.number || ''
                }
              };
            } else {
              // For parts without variants, use part-level data
              return {
                id: part.id,
                updates: {
                  note: (editData.note ?? part.note) || '',
                  price: (editData.price ?? part.price) || null,
                  list_price: (editData.list_price ?? part.list_price) || null,
                  af: (editData.af ?? part.af) || false,
                  number: (editData.number ?? part.number) || ''
                }
              };
            }
          }

          // No edit data, use existing part data
          return {
            id: part.id,
            updates: {
              note: part.note || '',
              price: part.price || null,
              list_price: part.list_price || null,
              af: part.af || false,
              number: part.number || ''
            }
          };
        });
      }

      // If we have updates to save, save them first
      if (updates.length > 0) {
        await onUpdateMultipleParts(updates, quoteId, false); // Don't change status yet
      }

      // Now update the quote status to 'priced'
      const result = await onUpdateQuote(quoteId, { status: 'priced' });

      if (result.error) {
        console.error('❌ Error verifying quote:', result.error);
        showSnackbar('Error verifying quote', 'error');
        return;
      }

      // Track VERIFIED action
      try {
        const { QuoteActionsService } = await import('@/services/quoteActions/quoteActionsService');
        await QuoteActionsService.trackQuoteAction(quoteId, 'VERIFIED');
        console.log('✅ VERIFIED: Successfully tracked verification action for quote:', quoteId);
      } catch (trackingError) {
        console.warn('⚠️ VERIFIED: Failed to track verification action:', trackingError);
      }

      // If we were in editing mode, exit it
      if (editingParts === quoteId) {
        setEditingParts(null);
        setPartEditData({});
        setQuoteNotesEditData({});
        setFocusField(null);
      }

      showSnackbar('Quote verified successfully!', 'success');
    } catch (error) {
      console.error('❌ Error verifying quote:', error);
      showSnackbar('Error verifying quote', 'error');
    }
  };

  const getStatusChip = (status: QuoteStatus) => {
    const statusConfig = {
      unpriced: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        icon: AlertTriangle,
        label: 'Waiting for Price'
      },
      priced: {
        bg: 'bg-blue-500',
        text: 'text-white',
        icon: CheckCircle,
        label: 'Priced'
      },
      completed: {
        bg: 'bg-green-100',
        text: 'text-green-600',
        icon: CheckCircle,
        label: 'Completed'
      },
      ordered: {
        bg: 'bg-purple-100',
        text: 'text-purple-600',
        icon: ShoppingCart,
        label: 'Ordered'
      },
      delivered: {
        bg: 'bg-orange-100',
        text: 'text-orange-600',
        icon: Package,
        label: 'Delivered'
      },
      waiting_verification: {
        bg: 'bg-orange-100',
        text: 'text-orange-600',
        icon: AlertTriangle,
        label: 'Waiting for Verification'
      },
      wrong: {
        bg: 'bg-red-100',
        text: 'text-red-600',
        icon: X,
        label: 'Wrong'
      }
    };

    const config = statusConfig[status];
    const IconComponent = config.icon;

    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text} whitespace-nowrap`}>
        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${config.bg === 'bg-blue-500' ? 'bg-blue-500' : config.bg}`}>
          <IconComponent className={`h-2.5 w-2.5 ${config.text}`} />
        </div>
        <span>{config.label}</span>
      </div>
    );
  };


  // Function to check if quote ref contains special characters
  const hasSpecialCharacters = (quoteRef: string) => {
    return quoteRef && (quoteRef.includes('.') || quoteRef.includes('/') || quoteRef.includes('#'));
  };

  // Quotes are now sorted by the database (required_by ascending)
  // For completed quotes, we still need client-side sorting by creation date
  const sortedQuotes = useMemo(() => {
    if (showCompleted) {
      // For completed quotes, sort by creation date (newest first)
      return [...quotes].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    }

    // For active quotes, database already sorts by deadline, so use as-is
    return quotes;
  }, [quotes, showCompleted]);

  const filteredQuotes = sortedQuotes.filter(quote => {
    const quoteParts = getQuotePartsWithNotesSync(quote.id);
    const status = getQuoteStatus(quoteParts, quote.status);

    // Filter by completion status
    if (showCompleted) {
      // When showCompleted is true, show completed, ordered, and delivered quotes
      if (quote.status !== 'completed' && quote.status !== 'ordered' && quote.status !== 'delivered') return false;
    } else {
      // When showCompleted is false, hide completed, ordered, and delivered quotes
      if (quote.status === 'completed' || quote.status === 'ordered' || quote.status === 'delivered') return false;
    }

    // Apply search filter only for client-side search
    if (useServerSideSearch) {
      // Server-side search is handled by the query, so no client-side filtering needed
      return true;
    }

    const matchesSearch =
      quote.quoteRef?.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      quote.vin?.toLowerCase().includes(effectiveSearchTerm.toLowerCase()) ||
      quote.make?.toLowerCase().includes(effectiveSearchTerm.toLowerCase());

    return matchesSearch;
  });

  // Memoize the array of IDs so it doesn't change on every render
  const allQuoteIds = useMemo(() => filteredQuotes.map(q => q.id), [filteredQuotes]);

  // Use paginated quotes for display
  const quotesLoading = isLoading || false;



  const handleDeleteWithConfirm = async (quoteId: string) => {
    setShowDeleteConfirm(quoteId);
  };

  const handleMarkAsWrong = async (quoteId: string) => {
    if (onMarkAsWrong) {
      await onMarkAsWrong(quoteId);
    }
  };

  const confirmDelete = async (quoteId: string) => {
    await onDeleteQuote(quoteId);
    setShowDeleteConfirm(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const handleMarkAsOrder = (quoteId: string) => {
    setShowOrderConfirm(quoteId);
    setTaxInvoiceNumber('');

    // Auto-select all orderable parts (parts with price > 0)
    const quote = quotes.find(q => q.id === quoteId);
    if (quote) {
      const quoteParts = getQuotePartsWithNotesSync(quote.id);
      const orderableParts = quoteParts.filter(part => part.price && part.price > 0);
      const orderablePartIds = orderableParts.map(part => part.id);
      setSelectedPartIds(orderablePartIds);
    } else {
      setSelectedPartIds([]);
    }
  };

  const confirmOrder = async () => {
    if (!showOrderConfirm || !taxInvoiceNumber.trim()) return;

    let result: { error: Error | null } = { error: null };

    // Use onMarkAsOrderedWithParts if available (with part selection)
    if (onMarkAsOrderedWithParts) {
      // Validate that at least one part is selected
      if (selectedPartIds.length === 0) {
        alert('Please select at least one part to order');
        return;
      }

      result = await onMarkAsOrderedWithParts(
        showOrderConfirm,
        taxInvoiceNumber.trim(),
        selectedPartIds
      );
    }
    // Fall back to onMarkAsOrdered (simple case without part selection)
    else if (onMarkAsOrdered) {
      result = await onMarkAsOrdered(
        showOrderConfirm,
        taxInvoiceNumber.trim()
      );
    }
    else {
      // Neither function is available
      return;
    }

    if (!result.error) {
      setShowOrderConfirm(null);
      setTaxInvoiceNumber('');
      setSelectedPartIds([]);
    } else {
      console.error('❌ Error confirming order:', result.error);
    }
  };

  const cancelOrder = () => {
    setShowOrderConfirm(null);
    setTaxInvoiceNumber('');
    setSelectedPartIds([]);
  };

  // Timer to update deadline indicators every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Load parts with notes for all quotes
  useEffect(() => {
    const loadQuotePartsWithNotes = async () => {
      const quotePartsMap: Record<string, Part[]> = {};

      for (const quote of quotes) {
        if (quote.partRequested) {
          const partsWithNotes = await getQuotePartsWithNotes(quote.id, quote.partRequested);
          quotePartsMap[quote.id] = partsWithNotes;
        }
      }

      setQuotePartsWithNotes(quotePartsMap);
    };

    if (quotes.length > 0) {
      loadQuotePartsWithNotes();
    }
  }, [quotes, parts]);



  // Quote edit modal handlers
  const handleEditQuote = (quote: Quote) => {
    setSelectedQuoteForEdit(quote);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedQuoteForEdit(null);
  };

  const handleSaveQuoteEdit = async (quoteId: string, updates: Record<string, any>) => {
    await onUpdateQuote(quoteId, updates);
    // Modal will close automatically after successful save
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Trigger a manual refresh of quotes data using TanStack Query
      await queryClient.invalidateQueries({ queryKey: ['quotes'] });
      await queryClient.invalidateQueries({ queryKey: ['parts'] });
      showSnackbar('Data refreshed successfully', 'success');
    } catch (error) {
      console.error('Error refreshing data:', error);
      showSnackbar('Failed to refresh data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              id="search-input"
              type="text"
              placeholder="Search quotes..."
              value={effectiveSearchTerm}
              onChange={(e) => {
                if (useServerSideSearch && onSearchChange) {
                  onSearchChange(e.target.value);
                } else {
                  setSearchTerm(e.target.value);
                }
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* View Options and Realtime Toggle */}
        <div className="flex items-center space-x-3">
          {/* Single Quote Toggle */}
          <button
            onClick={() => {
              const newSingleMode = !singleQuoteMode;
              setSingleQuoteMode(newSingleMode);

              // Persist the setting to localStorage
              localStorage.setItem('single-quote-mode', JSON.stringify(newSingleMode));

              // Notify parent component to change page size
              if (onPageSizeChange) {
                onPageSizeChange(newSingleMode ? 1 : 10);
              }

              // Dispatch event to refresh quote data (same as RealtimeToggle)
              window.dispatchEvent(new CustomEvent('refresh-quotes-data'));
            }}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${singleQuoteMode
              ? 'bg-purple-100 text-purple-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            title={singleQuoteMode ? "Show multiple quotes (10 per page)" : "Show one quote at a time"}
          >
            {singleQuoteMode ? (
              <LayoutGrid className="w-4 h-4" />
            ) : (
              <List className="w-4 h-4" />
            )}
            <span>{singleQuoteMode ? 'Multiple' : 'Single'}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isRefreshing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {/* Realtime Toggle */}
          <RealtimeToggle />
        </div>

      </div>

      {/* Quotes Accordion */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hidden md:block relative">


        {quotesLoading && paginatedQuotes.length === 0 ? (
          <>
            {/* Table Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
              <div className="grid grid-cols-4 px-6 py-4" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                <div className="font-semibold text-gray-900">Quote</div>
                <div className="font-semibold text-gray-900">Customer</div>
                <div className="font-semibold text-gray-900">Vehicle</div>
                <div className="font-semibold text-gray-900">Status</div>
              </div>
            </div>
            <SkeletonLoader count={5} />
          </>
        ) : paginatedQuotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-8">
              <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">No quotes found</h3>
            <p className="text-gray-600 text-center max-w-lg mb-8 text-lg">
              {defaultFilter === 'unpriced' ? 'No quotes are waiting for pricing at the moment.' :
                defaultFilter === 'priced' ? 'No quotes have been priced yet.' :
                  showCompleted ? 'No quotes have been completed yet.' :
                    'Get started by adding your first quote to track parts and pricing.'}
            </p>
            <div className="flex items-center space-x-3 text-base text-gray-500">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Ready to get started</span>
            </div>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
              <div className="grid grid-cols-4 px-6 py-4 gap-2" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                <div className="font-semibold text-gray-900">Quote</div>
                <div className="font-semibold text-gray-900">Customer</div>
                <div className="font-semibold text-gray-900">Vehicle</div>
                <div className="font-semibold text-gray-900">Status</div>
              </div>
            </div>

            {/* Quotes List */}
            <Accordion
              type="multiple"
              className="w-full"
              value={Array.from(expandedRows)}
              onValueChange={(values) => setExpandedRows(new Set(values))}
            >
              {paginatedQuotes.map((quote) => {
                const quoteParts = getQuotePartsWithNotesSync(quote.id);
                const status = getQuoteStatus(quoteParts, quote.status);

                return (
                  <AccordionItem key={quote.id} value={quote.id} className={`border-b border-gray-100 last:border-b-0 relative transition-all duration-300 ${expandedRows.has(quote.id) ? 'bg-white z-10' : ''}`}>


                    {/* Info Icon - Top Right Corner */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-0 right-0 p-1 text-green-600 hover:text-green-400 hover:bg-blue-50 rounded-full transition-colors cursor-pointer z-10"
                          title="View quote history"
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="end">
                        <QuoteInfoPopup
                          quoteId={quote.id}
                          isOpen={true}
                          onClose={() => {}}
                        />
                      </PopoverContent>
                    </Popover>

                    <AccordionTrigger className="py-2 grid grid-cols-4 gap-4 w-full px-3 hover:bg-gray-50 transition-colors cursor-pointer" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}>
                      {/* Column 1: Quote Details (Ref + VIN) */}
                      <div className="flex flex-col space-y-1 ml-4">

                        <div className="flex items-center  w-full space-x-2">
                          {/* RC Indicator or Time Indicator */}
                          {(() => {
                            const { isRepairConnection } = getQuoteRefDisplay(quote.quoteRef || '', quote.source);
                            
                            // Show RC indicator if quote is from RepairConnection
                            if (isRepairConnection) {
                              return (
                                <div className="px-2 py-0.5 text-xs font-semibold border shadow-sm rounded bg-purple-100 text-purple-700 border-purple-200">
                                  RC
                                </div>
                              );
                            }
                            
                            // Show time indicator for non-RC quotes (existing logic)
                            if (quote.status !== 'completed' && quote.status !== 'ordered' && quote.status !== 'delivered') {
                              const deadlineInfo = getDeadlineIndicator(quote.requiredBy);
                              if (!deadlineInfo) return null;

                              return (
                                <div className={`px-1 py-0.5 text-xs font-semibold border shadow-sm rounded ${deadlineInfo.color} relative`}>
                                  {deadlineInfo.timeDisplay}
                                  {/* Small ping circle in top-right corner */}
                                  {deadlineInfo.animation === '' && (deadlineInfo.color.includes('red')) && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-300 rounded-full animate-ping shadow-lg border border-red-600"></div>
                                  )}
                                </div>
                              );
                            }
                            
                            return null;
                          })()}
                          <div className="flex items-center space-x-2">
                            <>
                               {(() => {
                                 const { displayRef } = getQuoteRefDisplay(quote.quoteRef || '', quote.source);
                                 return (
                                   <span className={`text-[15px] font-semibold ${hasSpecialCharacters(quote.quoteRef || '') ? 'text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200 shadow-sm' : 'text-gray-900'}`}>
                                     {displayRef}
                                   </span>
                                 );
                               })()}
                              <CopyButton
                                text={quote.quoteRef || ''}
                                title="Copy quote ref"
                                size="md"
                                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </>
                          </div>


                        </div>

                        {/* VIN below Quote Ref */}
                        <div className="flex items-center space-x-2">
                          <>
                            <span className="font-mono text-sm text-gray-600">{quote.vin || '-'}</span>
                            <CopyButton
                              text={quote.vin || ''}
                              title="Copy VIN"
                              size="sm"
                              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </>
                        </div>

                        {/* Tax Invoice Number for Ordered Quotes */}
                        {quote.status === 'ordered' && quote.taxInvoiceNumber && (
                          <div className="flex items-center space-x-1 ml-6">
                            <div className="flex items-center space-x-1 px-2 py-1 bg-purple-100 border border-purple-200 rounded text-xs">
                              <span className="text-purple-800 font-medium text-xs">Invoice:</span>
                              <span className="text-purple-900 font-mono text-[12px]">{quote.taxInvoiceNumber}</span>
                              <CopyButton
                                text={quote.taxInvoiceNumber || ''}
                                title="Copy tax invoice number"
                                size="sm"
                                className="p-0.5 text-purple-600 hover:text-purple-700 hover:bg-purple-200 rounded transition-colors cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Column 2: Customer Details */}
                      <div className="flex flex-col space-y-1 max-w-64">
                        {/* Customer Name and Address */}
                        <div className="flex items-start">
                          <span className="font-medium text-sm text-gray-900 text-left capitalize" title={quote.customer || 'Unknown Customer'}>
                            {quote.customer || 'Unknown Customer'}
                            {quote.settlement && Number(quote.settlement) > 0 ? (
                              <span className="text-blue-600 font-medium"> ({quote.settlement}%)</span>
                            ): null}
                          </span>
                        </div>
                        {quote.address && (
                          <div className="flex items-start space-x-1 text-xs">
                            <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-600 text-left capitalize leading-tight flex-1" title={quote.address}>
                              {quote.address}
                            </span>
                            {typeof window !== 'undefined' && window.location.pathname === '/pricing' && (
                              <CopyButton 
                                text={quote.address}
                                title="Copy address"
                                size="sm"
                                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                              />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Column 3: Vehicle Details */}
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center space-x-2">

                          <div className="flex flex-col space-y-1">
                            <span className="font-medium text-gray-900 text-sm text-left">{quote?.make} • {quote.model?.split(' ')[0]}</span>
                            <div className="flex items-center space-x-1 text-xs text-gray-600">
                              <span>{quote.mthyr || '-'}</span>
                              {quote.series && (
                                <>
                                  <span>•</span>
                                  <span>{quote.series}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>{quote.body || '-'}</span>
                              {quote.auto !== undefined && (
                                <>
                                  <span>•</span>
                                  <span>{quote.auto ? 'Auto' : 'Manual'}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Column 4: Status & Parts Count */}
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between pr-4">
                          {/* Parts Count below Status */}
                          <div className="flex items-center space-x-2 ">
                            <div className="flex items-center justify-between">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {quoteParts.length}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              {getStatusChip(status)}
                              {/* Kebab Menu for Actions */}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                                    title="Actions"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-2" align="end">
                                  <div className="space-y-1">
                                    <button
                                      onClick={() => {
                                        const currentQuote = quotes.find(q => q.id === quote.id);
                                        if (currentQuote) {
                                          handleEditQuote(currentQuote);
                                        }
                                      }}
                                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                                    >
                                      <Edit className="h-4 w-4" />
                                      <span>Edit Quote</span>
                                    </button>
                                    
                                    <button
                                      onClick={() => {
                                        handleDeleteWithConfirm(quote.id);
                                      }}
                                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                    >
                                      <X className="h-4 w-4" />
                                      <span>Delete Quote</span>
                                    </button>
                                    
                                    <button
                                      onClick={() => {
                                        handleMarkAsWrong(quote.id);
                                      }}
                                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded transition-colors cursor-pointer"
                                    >
                                      <AlertTriangle className="h-4 w-4" />
                                      <span>Mark as Wrong</span>
                                    </button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>

                          {/* Action buttons */}
                          {(quote.status !== 'completed' || showCompleted) && (
                            <div className="flex items-center space-x-1">
                              {editingQuote === quote.id ? (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSave();
                                    }}
                                    className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors cursor-pointer"
                                    title="Save changes"
                                  >
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingQuote(null);
                                      setEditData({});
                                    }}
                                    className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                                    title="Cancel editing"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </>
                              ) : null}

                              {/* Confirmation button for waiting_verification status */}
                              {status === 'waiting_verification' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVerifyQuote(quote.id);
                                  }}
                                  className="p-1 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors cursor-pointer"
                                  title="Confirm pricing and move to priced status"
                                >
                                  <CheckCircle className="h-5 w-5 font-bold" />
                                </button>
                              )}

                              {status === 'priced' && onMarkCompleted && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkCompleted(quote.id);
                                  }}
                                  className="p-1 ml-4 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors cursor-pointer"
                                  title="Mark as completed"
                                >
                                  <CheckCircle className="h-5 w-5" />
                                </button>
                              )}

                              {status === 'completed' && (onMarkAsOrdered || onMarkAsOrderedWithParts) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsOrder(quote.id);
                                  }}
                                  className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded transition-colors cursor-pointer"
                                  title="Mark as order"
                                >
                                  <ShoppingCart className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>


                      </div>

                    </AccordionTrigger>

                    <AccordionContent className="px-6 py-4 bg-gray-50">
                      <div className="animate-in slide-in-from-top-2 duration-300">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                                <span>Parts Details ({quoteParts.length})</span>
                              </h4>
                              {/* Quote Notes Field */}
                              <div className="flex items-center">
                                <label className="flex items-center space-x-1">
                                  <img src="/icons/notepad.png" height={20} width={20} alt="Notes" />
                                  <p>Note:</p>
                                </label>
                                <QuickFillInput
                                  value={quoteNotesEditData[quote.id] !== undefined ? quoteNotesEditData[quote.id] : (quote.notes || '')}
                                  onChange={(value) => handleQuoteNotesChange(quote.id, value)}
                                  onQuickFillSelect={handleQuickFillSelect}
                                  onPopupClose={() => handleQuoteNotesSave(quote.id)}
                                  className="min-w-[200px]"
                                  placeholder="Enter notes for all parts..."
                                  textMode={true}
                                  loading={quoteNotesLoading[quote.id] || false}
                                />
                              </div>
                            </div>
                            {quoteParts.length === 0 && (
                              <span className="text-sm text-gray-500">No parts linked to this quote</span>
                            )}
                            {quoteParts.length > 0 && editingParts !== quote.id && quote.status !== 'completed' && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditingParts(quoteParts, quote.id);
                                  }}
                                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors cursor-pointer flex items-center space-x-1"
                                  title="Edit all parts in this quote"
                                >
                                  <Edit className="h-3 w-3" />
                                  <span>Edit Parts</span>
                                </button>
                                {currentPageName === 'pricing' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSendForReview(quote.id);
                                    }}
                                    disabled={sendForReviewLoading === quote.id}
                                    className={`px-3 py-1 text-xs rounded transition-colors flex items-center space-x-1 ${sendForReviewLoading === quote.id
                                      ? 'bg-green-500 text-white cursor-not-allowed opacity-70'
                                      : 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                                      }`}
                                    title="Send for review"
                                  >
                                    {sendForReviewLoading === quote.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Send className="h-3 w-3" />
                                    )}
                                    <span>Send for Review</span>
                                  </button>
                                )}
                              </div>
                            )}
                            {editingParts === quote.id && (
                              <div className="flex space-x-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSave();
                                  }}
                                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer flex items-center space-x-1"
                                  title="Save all part changes"
                                >
                                  <Save className="h-3 w-3" />
                                  <span>Save All</span>
                                </button>
                                {currentPageName === 'pricing' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSendForReview(quote.id);
                                    }}
                                    disabled={sendForReviewLoading === quote.id}
                                    className={`px-3 py-1 text-xs rounded transition-colors flex items-center space-x-1 ${sendForReviewLoading === quote.id
                                      ? 'bg-blue-500 text-white cursor-not-allowed opacity-70'
                                      : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                                      }`}
                                    title="Save and send for review"
                                  >
                                    {sendForReviewLoading === quote.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Send className="h-3 w-3" />
                                    )}
                                    <span>Send for Review</span>
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingParts(null);
                                    setPartEditData({});
                                    setQuoteNotesEditData({});
                                    setFocusField(null);
                                  }}
                                  className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors cursor-pointer flex items-center space-x-1"
                                  title="Cancel editing and discard changes"
                                >
                                  <X className="h-3 w-3" />
                                  <span>Cancel</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {quoteParts.length > 0 && (
                            <>
                              {/* Desktop Table View */}
                              <div className="hidden md:block">
                                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                  <table className="w-full">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                      <tr>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/5">Part & Variants</th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/5">Part Number</th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sm:w-1/8 lg:w-1/10">List Price</th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sm:w-1/8 lg:w-1/10">Price</th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-1/12">AM</th>
                                        <th className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-2/5">Notes</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {quoteParts.map((part) => {
                                        const isPartEditing = editingParts === quote.id;
                                        const localQuote = localQuotes.find(q => q.id === quote.id);
                                        const quotePart = localQuote?.partsRequested?.find(qp => qp.part_id === part.id);
                                        // Get variants from localQuotes if available, otherwise fallback to part data
                                        // Also consider variants from partEditData for immediate UI updates
                                        let variants = quotePart?.variants && quotePart.variants.length > 0
                                          ? quotePart.variants
                                          : [{
                                            id: 'default',
                                            note: part.note,
                                            final_price: part.price, // Use part.price as fallback
                                            list_price: part.list_price, // Include list_price from part
                                            af: part.af, // Include af from part
                                            is_default: true,
                                          }];

                                        // If we're editing and have partEditData, merge any new variants
                                        if (isPartEditing && partEditData[part.id]) {
                                          const editDataVariants = Object.keys(partEditData[part.id])
                                            .filter(variantId => !variants.find(v => v.id === variantId))
                                            .map(variantId => ({
                                              id: variantId,
                                              note: partEditData[part.id][variantId]?.note || '',
                                              final_price: partEditData[part.id][variantId]?.final_price || null,
                                              list_price: partEditData[part.id][variantId]?.list_price || null,
                                              af: partEditData[part.id][variantId]?.af || false,
                                              created_at: new Date().toISOString(),
                                              is_default: false
                                            })) as any[];

                                          variants = [...variants, ...editDataVariants];
                                        }

                                        // Debug logging removed - issue resolved

                                        return (
                                          <React.Fragment key={`part_${part.id}`}>
                                            {/* Primary Variant Row */}
                                            {variants.map((variant: any, index: number) => (
                                              <tr key={`${part.id}_${variant.id}`} className={`${index === 0 ? (variant.final_price && variant.final_price < 10 ? 'bg-red-50 border-b border-red-100' : 'bg-white border-b border-gray-100') : (variant.final_price && variant.final_price < 10 ? 'bg-red-50/50 border-b border-red-100/50' : 'bg-gray-50/50 border-b border-gray-100/50')}`}>
                                                <td className="px-4 py-1">
                                                  <div className="flex items-center space-x-3">
                                                    {index === 0 ? (
                                                      <>
                                                        {getPartIcon(part.name) && (
                                                          <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg p-1.5 shadow-md border border-gray-200 hover:border-gray-300 transition-all duration-200">
                                                            <img src={getPartIcon(part.name)!} alt={part.name} className="w-full h-full object-contain filter contrast-125 brightness-110" />
                                                          </div>
                                                        )}
                                                        <div className="flex-1">
                                                          <span className={`text-sm font-semibold ${variant.final_price && variant.final_price < 10 ? 'text-red-600 line-through' : 'text-gray-900'}`}>{part.name}</span>

                                                        </div>
                                                      </>
                                                    ) : (
                                                      <div className="flex items-center space-x-3 ml-11">
                                                        <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-purple-50 to-pink-100 rounded-full p-1.5 shadow-sm border border-purple-200">
                                                          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                                                            <span className="text-xs font-semibold text-white">{index}</span>
                                                          </div>
                                                        </div>
                                                        <div className="flex-1">
                                                          <div className="text-sm font-medium text-gray-700">Variant {index + 1}</div>
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                </td>
                                                <td className="px-4 py-1">
                                                  {index === 0 ? (
                                                    <div className="flex items-center space-x-1">
                                                      {isPartEditing ? (
                                                        <input
                                                          type="text"
                                                          value={partEditData[part.id]?.[variant.id]?.number ?? part.number ?? ''}
                                                          onChange={(e) => handleVariantEditChange(part.id, variant.id, 'number', e.target.value)}
                                                          className="w-full px-2 py-1 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                                        />
                                                      ) : (
                                                        <>
                                                          {part.number && part.number.includes(',') ? (
                                                            // Multiple part numbers - show each with its own copy button
                                                            <div className="flex flex-wrap items-center gap-1">
                                                              {part.number.split(',').map((pn, pnIndex) => (
                                                                <div key={pnIndex} className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                                                                  <span className="text-sm font-medium text-gray-900 font-mono">{pn.trim()}</span>
                                                                  <CopyButton
                                                                    text={pn.trim()}
                                                                    title={`Copy ${pn.trim()} to clipboard`}
                                                                    size="sm"
                                                                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all duration-200 cursor-pointer"
                                                                  />
                                                                </div>
                                                              ))}
                                                            </div>
                                                          ) : (
                                                            // Single part number - show with same box styling as multiple
                                                            <div className="flex items-center space-x-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                                                              <span className="text-sm font-medium text-gray-900 font-mono">{part.number || '-'}</span>
                                                              <CopyButton
                                                                text={part.number || ''}
                                                                title="Copy to clipboard"
                                                                size="sm"
                                                                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-all duration-200 cursor-pointer"
                                                              />
                                                            </div>
                                                          )}
                                                        </>
                                                      )}
                                                    </div>
                                                  ) : (
                                                    <div className="flex items-center justify-center">
                                                      <span className="text-xs text-gray-500">Variant {index + 1}</span>
                                                    </div>
                                                  )}
                                                </td>
                                                <td className="px-4 py-1">
                                                  <div className="flex items-center space-x-1">
                                                    {isPartEditing ? (
                                                      <input
                                                        ref={(el) => { focusRefs.current['list_price'] = el; }}
                                                        type="number"
                                                        step="5"
                                                        value={partEditData[part.id]?.[variant.id]?.list_price !== undefined ? partEditData[part.id][variant.id].list_price : (variant.list_price ?? '')}
                                                        onChange={(e) => handleVariantEditChange(part.id, variant.id, 'list_price', e.target.value ? Number(e.target.value) : null)}
                                                        className={`w-full px-2 py-1 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${index === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                                        placeholder="$"
                                                      />
                                                    ) : (
                                                      <>
                                                        <span
                                                          className={`text-sm font-medium cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors ${variant.list_price ? (variant.list_price < 10 ? 'text-red-600 line-through' : 'text-gray-900') : 'text-gray-400'}`}
                                                          onClick={() => handleDirectEdit(quote.id, 'list_price')}
                                                          title={variant.list_price && variant.list_price < 10 ? "Part not available" : "Click to edit"}
                                                        >
                                                          {variant.list_price ? (variant.list_price < 10 ? 'N/A' : `$${variant.list_price.toFixed(2)}`) : 'Not set'}
                                                        </span>
                                                        {variant.list_price && variant.list_price >= 10 && (
                                                          <CopyButton
                                                            text={variant.list_price.toString()}
                                                            title="Copy to clipboard"
                                                            size="md"
                                                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200 cursor-pointer"
                                                            iconClassName="h-3.5 w-3.5"
                                                          />
                                                        )}
                                                      </>
                                                    )}
                                                  </div>
                                                </td>
                                                <td className="px-4 py-1">
                                                  <div className="flex items-center space-x-1">
                                                    {isPartEditing ? (
                                                      <input
                                                        ref={(el) => { focusRefs.current['final_price'] = el; }}
                                                        type="number"
                                                        step="5"
                                                        value={partEditData[part.id]?.[variant.id]?.final_price !== undefined ? partEditData[part.id][variant.id].final_price : (variant.final_price ?? '')}
                                                        onChange={(e) => handleVariantEditChange(part.id, variant.id, 'final_price', e.target.value ? Number(e.target.value) : null)}
                                                        className={`w-full px-2 py-1 border border-gray-300 rounded-sm text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${index === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                                        placeholder="$"
                                                      />
                                                    ) : (
                                                      <>
                                                        <span
                                                          className={`text-sm font-medium cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors ${variant.final_price ? (variant.final_price < 10 ? 'text-red-600 line-through' : 'text-gray-900') : 'text-gray-400'}`}
                                                          onClick={() => handleDirectEdit(quote.id, 'final_price')}
                                                          title={variant.final_price && variant.final_price < 10 ? "Part not available" : "Click to edit"}
                                                        >
                                                          {variant.final_price ? (variant.final_price < 10 ? 'N/A' : `$${variant.final_price.toFixed(2)}`) : 'Not set'}
                                                        </span>
                                                        {variant.final_price && variant.final_price >= 10 && (
                                                          <CopyButton
                                                            text={variant.final_price.toString()}
                                                            title="Copy to clipboard"
                                                            size="md"
                                                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200 cursor-pointer"
                                                            iconClassName="h-3.5 w-3.5"
                                                          />
                                                        )}
                                                      </>
                                                    )}
                                                  </div>
                                                </td>
                                                <td className="px-4 py-1">
                                                  <div className="flex items-start justify-start">
                                                    {isPartEditing ? (
                                                      <input
                                                        ref={(el) => { focusRefs.current['af'] = el; }}
                                                        type="checkbox"
                                                        checked={partEditData[part.id]?.[variant.id]?.af ?? variant.af ?? false}
                                                        onChange={(e) => handleVariantEditChange(part.id, variant.id, 'af', e.target.checked)}
                                                        className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 focus:ring-2 ${index === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                                        title="Aftermarket Flag"
                                                      />
                                                    ) : (
                                                      <span
                                                        className={`text-sm cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors ${variant.af ? 'text-green-600 font-medium' : 'text-gray-400'}`}
                                                        onClick={() => handleDirectEdit(quote.id, 'af')}
                                                        title="Click to edit"
                                                      >
                                                        {variant.af ? (
                                                          <span className='bg-green-500 text-white rounded-full px-2 py-1 text-xs font-bold shadow-md border-2 border-green-600'>
                                                            AM
                                                          </span>
                                                        ) : (
                                                          <span className='text-gray-400 text-sm'>OEM</span>
                                                        )}
                                                      </span>
                                                    )}
                                                  </div>
                                                </td>
                                                <td className="px-4 py-1 min-w-0">
                                                  <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-1 flex-1 min-w-0">
                                                      {isPartEditing ? (
                                                        <QuickFillInput
                                                          ref={(el) => { focusRefs.current['note'] = el; }}
                                                          value={getCombinedNotes(quote.notes, partEditData[part.id]?.[variant.id]?.note ?? variant.note)}
                                                          onChange={(value) => handleVariantEditChange(part.id, variant.id, 'note', value)}
                                                          placeholder="Add notes..."
                                                          className={`flex-1 ${index === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                                        />
                                                      ) : (
                                                        <>
                                                          {(() => {
                                                            const combinedNote = getCombinedNotes(quote.notes, variant.note);
                                                            return (
                                                              <>
                                                                <span
                                                                  className={`text-sm cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors ${combinedNote ? 'text-gray-700' : 'text-gray-400'}`}
                                                                  onClick={() => handleDirectEdit(quote.id, 'note')}
                                                                  title="Click to edit"
                                                                >
                                                                  {combinedNote || 'No notes'}
                                                                </span>
                                                                {combinedNote && (
                                                                  <CopyButton
                                                                    text={combinedNote}
                                                                    title="Copy to clipboard"
                                                                    size="md"
                                                                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-all duration-200 cursor-pointer"
                                                                    iconClassName="h-3.5 w-3.5"
                                                                  />
                                                                )}
                                                              </>
                                                            );
                                                          })()}
                                                        </>
                                                      )}
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex items-center space-x-1 ml-2">
                                                      {isPartEditing ? (
                                                        <>
                                                          {index === 0 ? (
                                                            <button
                                                              onClick={() => addVariantToPart(quote.id, part.id)}
                                                              className="w-8 h-8 bg-gradient-to-r from-blue-50 to-blue-100 rounded-full flex items-center justify-center hover:from-blue-100 hover:to-blue-200 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md border border-blue-200"
                                                              title="Add variant"
                                                            >
                                                              <Plus className="h-4 w-4 text-blue-600" />
                                                            </button>
                                                          ) : (
                                                            <button
                                                              onClick={() => removeVariantFromPart(quote.id, part.id, variant.id)}
                                                              className="w-8 h-8 bg-gradient-to-r from-red-50 to-red-100 rounded-full flex items-center justify-center hover:from-red-100 hover:to-red-200 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md border border-red-200"
                                                              title="Remove variant"
                                                            >
                                                              <X className="h-4 w-4 text-red-600" />
                                                            </button>
                                                          )}
                                                        </>
                                                      ) : null}
                                                    </div>
                                                  </div>
                                                </td>

                                              </tr>
                                            ))}
                                          </React.Fragment>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </>
        )}
      </div>


      <div className="md:hidden space-y-4 p-1">
        {filteredQuotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No quotes found</h3>
            <p className="text-gray-600 text-center max-w-md mb-6">
              {defaultFilter === 'unpriced' ? 'No quotes are waiting for pricing at the moment.' :
                defaultFilter === 'priced' ? 'No quotes have been priced yet.' :
                  showCompleted ? 'No quotes have been completed yet.' :
                    'Get started by adding your first quote to track parts and pricing.'}
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Ready to get started</span>
            </div>
          </div>
        ) : (
          <Accordion
            type="multiple"
            className="w-full"
            value={Array.from(expandedRows)}
            onValueChange={(values) => setExpandedRows(new Set(values))}
          >
            {paginatedQuotes.map((quote) => {
              const quoteParts = getQuotePartsWithNotesSync(quote.id);
              const status = getQuoteStatus(quoteParts, quote.status);

              return (
                <AccordionItem key={quote.id} value={quote.id} className={`bg-white rounded-lg border border-gray-200 shadow-sm transition-all duration-300 ${expandedRows.has(quote.id) ? 'shadow-lg z-10' : ''}`}>
                  <AccordionTrigger className="py-2 p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="grid grid-cols-2 gap-4 w-full">
                      {/* Column 1: Quote & Customer Details */}
                      <div className="flex flex-col space-y-3">
                        {/* Quote Details */}
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center w-full">

                            {/* RC Indicator or Time Indicator for mobile */}
                            {(() => {
                              const { isRepairConnection } = getQuoteRefDisplay(quote.quoteRef || '', quote.source);
                              
                              // Show RC indicator if quote is from RepairConnection
                              if (isRepairConnection) {
                                return (
                                  <div className="px-2 py-1 text-xs font-semibold border shadow-sm rounded bg-purple-100 text-purple-700 border-purple-200 mr-2">
                                    RC
                                  </div>
                                );
                              }
                              
                              // Show time indicator for non-RC quotes (existing logic)
                              if (quote.status !== 'completed' && quote.status !== 'ordered' && quote.status !== 'delivered') {
                                const deadlineInfo = getDeadlineIndicator(quote.requiredBy);
                                if (!deadlineInfo) return null;

                                return (
                                  <div className={`px-1 py-0.5 text-xs font-semibold border shadow-sm rounded ${deadlineInfo.color} relative mr-2`}>
                                    {deadlineInfo.timeDisplay}
                                    {/* Small ping circle in top-right corner */}
                                    {deadlineInfo.animation === '' && (deadlineInfo.color.includes('red') || deadlineInfo.color.includes('yellow')) && (
                                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-300 rounded-full animate-ping shadow-lg border border-red-600"></div>
                                    )}
                                  </div>
                                );
                              }
                              
                              return null;
                            })()}

                            <div className="flex items-center space-x-2">
                              <div className="flex flex-col">
                                <span className="text-xs font-medium text-gray-500 text-left">Quote Ref</span>
                                 {(() => {
                                   const { displayRef } = getQuoteRefDisplay(quote.quoteRef || '', quote.source);
                                   return (
                                     <span className={`text-sm font-bold text-left ${hasSpecialCharacters(quote.quoteRef || '') ? 'text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200 shadow-sm' : 'text-gray-900'}`}>
                                       {displayRef}
                                     </span>
                                   );
                                 })()}
                              </div>
                              <CopyButton
                                text={quote.quoteRef || ''}
                                title="Copy quote ref"
                                size="sm"
                                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 md:ml-6">
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-gray-500 text-left">VIN</span>
                              <span className="text-xs font-mono text-gray-600 text-left">{quote.vin || '-'}</span>
                            </div>
                            <CopyButton
                              text={quote.vin || ''}
                              title="Copy VIN"
                              size="sm"
                              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>

                        {/* Customer Details */}
                        <div className="flex flex-col space-y-1 w-48">
                          <div className="flex items-start">
                            <span className="font-medium text-gray-900 text-left capitalize leading-tight" title={quote.customer || 'Unknown Customer'}>
                              {quote.customer || 'Unknown Customer'}
                              {quote.settlement && Number(quote.settlement) > 0 ? (
                                <span className="text-blue-600 font-medium"> ({quote.settlement}%)</span>
                              ):null}
                            </span>
                          </div>
                          {quote.address && (
                            <div className="flex items-start space-x-1 text-xs">
                              <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-600 text-left capitalize leading-tight flex-1" title={quote.address}>
                                {quote.address}
                              </span>
                              {typeof window !== 'undefined' && window.location.pathname === '/pricing' && (
                                <CopyButton 
                                  text={quote.address}
                                  title="Copy address"
                                  size="sm"
                                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Column 2: Vehicle & Status Details */}
                      <div className="flex flex-col space-y-3">
                        {/* Vehicle Details */}
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center space-x-2">
                            <div className="flex flex-col space-y-1">
                              <span className="text-xs font-medium text-gray-500 text-left">Vehicle</span>
                              <span className="font-medium text-gray-900 text-sm text-left">{quote?.make} • {quote.model?.split(' ')[0]}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 text-xs">
                            <span className="text-left">{quote.mthyr || '-'}</span>
                            {quote.series && (
                              <>
                                <span>•</span>
                                <span className="text-left">{quote.series}</span>
                              </>
                            )}
                            <span>•</span>
                            <span className="text-left">{quote.body || '-'}</span>
                          </div>
                        </div>

                        {/* Status & Parts */}
                        <div className="flex flex-col space-y-2">
                          <div className="flex flex-col items-end space-y-2">
                            {/* Parts Count */}
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {quoteParts.length} {quoteParts.length === 1 ? 'part' : 'parts'}
                            </span>

                            {/* Status */}
                            <div className="flex items-center justify-end space-x-1">
                              {getStatusChip(status)}
                              {/* Kebab Menu for Actions */}
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                                    title="Actions"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-2" align="end">
                                  <div className="space-y-1">
                                    <button
                                      onClick={() => {
                                        const currentQuote = quotes.find(q => q.id === quote.id);
                                        if (currentQuote) {
                                          handleEditQuote(currentQuote);
                                        }
                                      }}
                                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                                    >
                                      <Edit className="h-4 w-4" />
                                      <span>Edit Quote</span>
                                    </button>
                                    
                                    <button
                                      onClick={() => {
                                        handleDeleteWithConfirm(quote.id);
                                      }}
                                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                    >
                                      <X className="h-4 w-4" />
                                      <span>Delete Quote</span>
                                    </button>
                                    
                                    <button
                                      onClick={() => {
                                        handleMarkAsWrong(quote.id);
                                      }}
                                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded transition-colors cursor-pointer"
                                    >
                                      <AlertTriangle className="h-4 w-4" />
                                      <span>Mark as Wrong</span>
                                    </button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>

                            {/* Action buttons for mobile */}
                            {(quote.status !== 'completed' || showCompleted) && (
                              <div className="flex items-center space-x-1">
                                {editingQuote === quote.id ? (
                                  <>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSave();
                                      }}
                                      className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors cursor-pointer"
                                      title="Save changes"
                                    >
                                      <Save className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingQuote(null);
                                        setEditData({});
                                      }}
                                      className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                                      title="Cancel editing"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </>
                                ) : null}

                                {/* Confirmation button for waiting_verification status */}
                                {status === 'waiting_verification' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleVerifyQuote(quote.id);
                                    }}
                                    className="p-1 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors cursor-pointer"
                                    title="Confirm pricing and move to priced status"
                                  >
                                    <CheckCircle className="h-4 w-4 font-bold" />
                                  </button>
                                )}

                                {status === 'priced' && onMarkCompleted && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onMarkCompleted(quote.id);
                                    }}
                                    className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors cursor-pointer"
                                    title="Mark as completed"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                )}

                                {status === 'completed' && (onMarkAsOrdered || onMarkAsOrderedWithParts) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMarkAsOrder(quote.id);
                                    }}
                                    className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded transition-colors cursor-pointer"
                                    title="Mark as order"
                                  >
                                    <ShoppingCart className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-4 pb-4 bg-gray-50">
                    <div className="animate-in slide-in-from-top-2 duration-300">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col space-y-2">
                            <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                              <span>Parts ({quoteParts.length})</span>
                            </h4>
                            {/* Quote Notes Field - Mobile */}
                            <div className="flex flex-col space-y-1">
                              <label className="text-xs font-medium text-gray-500">Quote Notes:</label>
                              <QuickFillInput
                                value={quoteNotesEditData[quote.id] !== undefined ? quoteNotesEditData[quote.id] : (quote.notes || '')}
                                onChange={(value) => handleQuoteNotesChange(quote.id, value)}
                                onQuickFillSelect={handleQuickFillSelect}
                                onPopupClose={() => handleQuoteNotesSave(quote.id)}
                                className="w-full"
                                placeholder="Enter notes for all parts..."
                                textMode={true}
                                loading={quoteNotesLoading[quote.id] || false}
                              />
                            </div>
                          </div>
                          {quoteParts.length === 0 && (
                            <span className="text-sm text-gray-500">No parts linked to this quote</span>
                          )}
                          {quoteParts.length > 0 && editingParts !== quote.id && quote.status !== 'completed' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingParts(quoteParts, quote.id);
                                }}
                                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors cursor-pointer flex items-center space-x-1"
                                title="Edit all parts in this quote"
                              >
                                <Edit className="h-3 w-3" />
                                <span>Edit Parts</span>
                              </button>
                              {currentPageName === 'pricing' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendForReview(quote.id);
                                  }}
                                  disabled={sendForReviewLoading === quote.id}
                                  className={`px-3 py-1 text-xs rounded transition-colors flex items-center space-x-1 ${sendForReviewLoading === quote.id
                                    ? 'bg-green-500 text-white cursor-not-allowed opacity-70'
                                    : 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                                    }`}
                                  title="Send for review"
                                >
                                  {sendForReviewLoading === quote.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Send className="h-3 w-3" />
                                  )}
                                  <span>Send for Review</span>
                                </button>
                              )}
                            </div>
                          )}
                          {editingParts === quote.id && (
                            <div className="flex space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSave();
                                }}
                                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer flex items-center space-x-1"
                                title="Save all part changes"
                              >
                                <Save className="h-3 w-3" />
                                <span>Save All</span>
                              </button>
                              {currentPageName === 'pricing' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSendForReview(quote.id);
                                  }}
                                  disabled={sendForReviewLoading === quote.id}
                                  className={`px-3 py-1 text-xs rounded transition-colors flex items-center space-x-1 ${sendForReviewLoading === quote.id
                                    ? 'bg-blue-500 text-white cursor-not-allowed opacity-70'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                                    }`}
                                  title="Save and send for review"
                                >
                                  {sendForReviewLoading === quote.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Send className="h-3 w-3" />
                                  )}
                                  <span>Send for Review</span>
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingParts(null);
                                  setPartEditData({});
                                  setQuoteNotesEditData({});
                                  setFocusField(null);
                                }}
                                className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors cursor-pointer flex items-center space-x-1"
                                title="Cancel editing and discard changes"
                              >
                                <X className="h-3 w-3" />
                                <span>Cancel</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {quoteParts.length > 0 && (
                          <div className="space-y-3">
                            {quoteParts.map((part) => {
                              const isPartEditing = editingParts === quote.id;

                              return (
                                <div key={part.id} className={`${part.price && part.price < 10 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'} rounded-lg border p-3 shadow-sm`}>
                                  <div className="relative">
                                    {getPartIcon(part.name) && (
                                      <div className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md border border-gray-200 hover:border-gray-300 transition-all duration-200">
                                        <img src={getPartIcon(part.name)!} alt={part.name} className="h-6 w-6 object-contain filter contrast-125 brightness-110" />
                                      </div>
                                    )}
                                    <div className="space-y-3 pr-12">
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-500 mb-1">Part Name</label>
                                          {/* Part name is always non-editable */}
                                          <span className={`text-sm font-medium ${part.price && part.price < 10 ? 'text-red-600 line-through' : 'text-gray-900'}`}>{part.name}</span>
                                        </div>

                                        <div>
                                          <label className="block text-xs font-medium text-gray-500 mb-1">Part Number</label>
                                          <div className="flex items-center space-x-1">
                                            {isPartEditing ? (
                                              <input
                                                type="text"
                                                value={partEditData[part.id]?.number ?? part.number ?? ''}
                                                onChange={(e) => handlePartEditChange(part.id, 'number', e.target.value)}
                                                className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                              />
                                            ) : (
                                              <>
                                                {part.number && part.number.includes(',') ? (
                                                  // Multiple part numbers - show each with its own copy button
                                                  <div className="flex flex-wrap items-center gap-1">
                                                    {part.number.split(',').map((pn, pnIndex) => (
                                                      <div key={pnIndex} className="flex items-center space-x-1 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                                                        <span className="text-xs text-gray-600 font-mono">{pn.trim()}</span>
                                                        <CopyButton
                                                          text={pn.trim()}
                                                          title={`Copy ${pn.trim()} to clipboard`}
                                                          size="sm"
                                                          className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                                                          iconClassName="h-2.5 w-2.5"
                                                        />
                                                      </div>
                                                    ))}
                                                  </div>
                                                ) : (
                                                  // Single part number - show with same box styling as multiple
                                                  <div className="flex items-center space-x-1 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200">
                                                    <span className="text-xs text-gray-600 font-mono">{part.number || '-'}</span>
                                                    <CopyButton
                                                      text={part.number || ''}
                                                      title="Copy to clipboard"
                                                      size="sm"
                                                      className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                                                      iconClassName="h-2.5 w-2.5"
                                                    />
                                                  </div>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-500 mb-1">List Price</label>
                                          <div className="flex items-center space-x-1">
                                            {isPartEditing ? (
                                              <input
                                                ref={(el) => { focusRefs.current['list_price_mobile'] = el; }}
                                                type="number"
                                                step="5"
                                                value={partEditData[part.id]?.list_price !== undefined ? partEditData[part.id].list_price : ''}
                                                onChange={(e) => handlePartEditChange(part.id, 'list_price', e.target.value ? Number(e.target.value) : null)}
                                                className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                              />
                                            ) : (
                                              <>
                                                <span
                                                  className={`text-sm font-medium cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors ${part.list_price ? (part.list_price < 10 ? 'text-red-600 line-through' : 'text-gray-900') : 'text-gray-400'}`}
                                                  onClick={() => handleDirectEdit(quote.id, 'list_price_mobile')}
                                                  title={part.list_price && part.list_price < 10 ? "Part not available" : "Click to edit"}
                                                >
                                                  {part.list_price ? (part.list_price < 10 ? 'N/A' : `$${part.list_price.toFixed(2)}`) : '-'}
                                                </span>
                                                {part.list_price && part.list_price >= 10 && (
                                                  <CopyButton
                                                    text={part.list_price ? part.list_price.toString() : ''}
                                                    title="Copy to clipboard"
                                                    size="sm"
                                                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                                  />
                                                )}
                                              </>
                                            )}
                                          </div>
                                        </div>

                                        <div>
                                          <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
                                          <div className="flex items-center space-x-1">
                                            {isPartEditing ? (
                                              <input
                                                ref={(el) => { focusRefs.current['price_mobile'] = el; }}
                                                type="number"
                                                step="5"
                                                value={partEditData[part.id]?.price ?? ''}
                                                onChange={(e) => handlePartEditChange(part.id, 'price', e.target.value ? Number(e.target.value) : null)}
                                                className="flex-1 px-2 py-1 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                              />
                                            ) : (
                                              <>
                                                <span
                                                  className={`text-sm font-medium cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors ${part.price ? (part.price < 10 ? 'text-red-600 line-through' : 'text-gray-900') : 'text-gray-400'}`}
                                                  onClick={() => handleDirectEdit(quote.id, 'price_mobile')}
                                                  title={part.price && part.price < 10 ? "Part not available" : "Click to edit"}
                                                >
                                                  {part.price ? (part.price < 10 ? 'N/A' : `$${part.price.toFixed(2)}`) : '-'}
                                                </span>
                                                {part.price && part.price >= 10 && (
                                                  <CopyButton
                                                    text={part.price ? part.price.toString() : ''}
                                                    title="Copy to clipboard"
                                                    size="sm"
                                                    className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                                  />
                                                )}
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-500 mb-1">AM (Aftermarket)</label>
                                          <div className="flex items-center space-x-1">
                                            {isPartEditing ? (
                                              <input
                                                ref={(el) => { focusRefs.current['af_mobile'] = el; }}
                                                type="checkbox"
                                                checked={partEditData[part.id]?.af || false}
                                                onChange={(e) => handlePartEditChange(part.id, 'af', e.target.checked)}
                                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                                title="Aftermarket Flag"
                                              />
                                            ) : (
                                              <span
                                                className={`text-sm cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors ${part.af ? 'text-green-600 font-medium' : 'text-gray-400'}`}
                                                onClick={() => handleDirectEdit(quote.id, 'af_mobile')}
                                                title="Click to edit"
                                              >
                                                {part.af ? (
                                                  <span className='bg-green-500 text-white rounded-full px-2 py-1 text-xs font-bold shadow-md border-2 border-green-600'>
                                                    ✓ AM
                                                  </span>
                                                ) : (
                                                  <span className='text-gray-400 text-sm'>○ OEM</span>
                                                )}
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        <div>
                                          <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                                          <div className="flex items-center space-x-1 min-w-0">
                                            {isPartEditing ? (
                                              <QuickFillInput
                                                ref={(el) => { focusRefs.current['note_mobile'] = el; }}
                                                value={partEditData[part.id]?.note ?? ''}
                                                onChange={(value) => handlePartEditChange(part.id, 'note', value)}
                                                className="flex-1"
                                              />
                                            ) : (
                                              <>
                                                <span
                                                  className="text-sm text-gray-600 cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded transition-colors"
                                                  onClick={() => handleDirectEdit(quote.id, 'note_mobile')}
                                                  title="Click to edit"
                                                >
                                                  {part.note || '-'}
                                                </span>
                                                <CopyButton
                                                  text={part.note || ''}
                                                  title="Copy to clipboard"
                                                  size="sm"
                                                  className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                                />
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={cancelDelete}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 transform transition-all">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Quote</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this quote? This will permanently remove the quote and all associated parts.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Delete Quote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmation Modal */}
      {showOrderConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={cancelOrder}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 transform transition-all max-h-[90vh] overflow-y-auto">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Mark as Order</h3>
                <p className="text-sm text-gray-500">Convert quote to order</p>
              </div>
            </div>

            {/* Tax Invoice Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Invoice Number *
              </label>
              <input
                type="text"
                value={taxInvoiceNumber}
                onChange={(e) => setTaxInvoiceNumber(e.target.value)}
                placeholder="Enter tax invoice number"
                className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              />
            </div>

            {/* Parts Selection */}
            {(() => {
              const quote = quotes.find(q => q.id === showOrderConfirm);
              if (!quote) return null;
              const quoteParts = getQuotePartsWithNotesSync(quote.id);

              // Filter out parts with no price or zero price
              const orderableParts = quoteParts.filter(part => {
                // Check if any variant has a price
                const localQuote = localQuotes.find(q => q.id === quote.id);
                const quotePart = localQuote?.partsRequested?.find(qp => qp.part_id === part.id);
                return quotePart?.variants?.some(variant => variant.final_price && variant.final_price > 0);
              });
              const nonOrderableParts = quoteParts.filter(part => {
                // Check if no variants have a price
                const localQuote = localQuotes.find(q => q.id === quote.id);
                const quotePart = localQuote?.partsRequested?.find(qp => qp.part_id === part.id);
                return !quotePart?.variants?.some(variant => variant.final_price && variant.final_price > 0);
              });

              return (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Parts to Order *
                  </label>

                  {/* Orderable Parts */}
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {orderableParts.map((part) => (
                      <label key={part.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPartIds.includes(part.id)}
                          onChange={(e) => {
                            const newSelected = [...selectedPartIds];
                            if (e.target.checked) {
                              newSelected.push(part.id);
                            } else {
                              newSelected.splice(newSelected.indexOf(part.id), 1);
                            }
                            setSelectedPartIds(newSelected);
                          }}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className={`font-medium ${part.price && part.price < 10 ? 'text-red-600 line-through' : 'text-gray-900'}`}>{part.name}</div>
                          <div className="text-sm text-gray-500">
                            {part.number} • {part.price && part.price < 10 ? <span className="text-red-600 line-through">N/A</span> : `$${part.price?.toFixed(2) || 0}`}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Non-Orderable Parts Warning */}
                  {nonOrderableParts.length > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">!</span>
                        </div>
                        <span className="text-sm font-medium text-yellow-800">
                          Parts with no price cannot be ordered
                        </span>
                      </div>
                      <div className="text-xs text-yellow-700 space-y-1">
                        {nonOrderableParts.map((part) => (
                          <div key={part.id} className="flex items-center space-x-2">
                            <span>•</span>
                            <span className={`${part.price && part.price < 10 ? 'text-red-600 line-through' : ''}`}>{part.name} ({part.number})</span>
                            <span className="text-yellow-600">
                              {!part.price ? 'No price set' : 'Price is $0'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 mt-2">
                    Selected {selectedPartIds.length} of {orderableParts.length} orderable parts
                  </p>
                </div>
              );
            })()}

            <div className="flex space-x-3">
              <button
                onClick={cancelOrder}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmOrder()}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Mark as Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {showPagination && quotes.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, quotes.length)} of {quotes.length} quotes
            </div>

            <div className="flex items-center space-x-2">
              {/* Previous Page Button */}
              <button
                onClick={goToPrevPage}
                disabled={uiCurrentPage === 1}
                className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${uiCurrentPage === 1
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}
              >
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${page === uiCurrentPage
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                        }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              {/* Next Page Button */}
              <button
                onClick={goToNextPage}
                disabled={uiCurrentPage === totalPages}
                className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${uiCurrentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                  }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quote Edit Modal */}
      <QuoteEditModal
        quote={selectedQuoteForEdit}
        isOpen={editModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveQuoteEdit}
      />

    </div>
  );
}
