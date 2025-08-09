import { useState, useEffect, useMemo } from 'react';
import { Quote, Part } from '../useQuotes';
import { QuoteTableState, FilterType } from './types';
import { getQuotePartsFromJson } from '@/utils/quotePartsHelpers';
import { getQuoteParts, getDeadlinePriority } from './utils';
import supabase from '@/utils/supabase';

export const useQuoteTableData = (
  quotes: Quote[],
  parts: Part[],
  defaultFilter: FilterType = 'all'
) => {
  const [state, setState] = useState<Partial<QuoteTableState>>({
    filter: defaultFilter,
    searchTerm: '',
    expandedRows: new Set<string>(),
    editingQuote: null,
    editingParts: null,
    editData: {},
    partEditData: {},
    showDeleteConfirm: null,
    showOrderConfirm: null,
    taxInvoiceNumber: '',
    selectedPartIds: [],
    currentTime: new Date(),
    quotePartsWithNotes: {},
    editModalOpen: false,
    selectedQuoteForEdit: null,
  });

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setState(prev => ({ ...prev, currentTime: new Date() }));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setState(prev => ({
          ...prev,
          editingQuote: null,
          editingParts: null,
          showDeleteConfirm: null,
          showOrderConfirm: null,
          editModalOpen: false,
        }));
      }
      
      if (e.key === 'Enter' && (state.editingQuote || state.editingParts)) {
        // Handle save - this will be passed from parent
      }
      
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.editingQuote, state.editingParts]);

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
        return getQuoteParts(partRequested, parts); // Fallback to basic parts
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
      
      return getQuoteParts(partRequested, parts);
      
    } catch (error) {
      console.error('Error fetching quote parts:', error);
      return getQuoteParts(partRequested, parts); // Fallback to basic parts
    }
  };

  // Function to get parts with notes for a specific quote (synchronous)
  const getQuotePartsWithNotesSync = (quoteId: string): Part[] => {
    // First try to find the quote with JSON structure
    const quote = quotes.find(q => q.id === quoteId);
    if (quote && quote.partsRequested && Array.isArray(quote.partsRequested)) {
      // Use new JSON structure - this is much faster as it's synchronous
      return getQuotePartsFromJson(quote, parts);
    }
    
    // Fallback to basic parts parsing
    const partRequested = quote?.partRequested || '';
    return getQuoteParts(partRequested, parts);
  };

  // Load quote parts with notes for all quotes
  useEffect(() => {
    const loadQuotePartsWithNotes = async () => {
      const newQuotePartsWithNotes: Record<string, Part[]> = {};
      
      for (const quote of quotes) {
        try {
          const quoteParts = await getQuotePartsWithNotes(quote.id, quote.partRequested);
          newQuotePartsWithNotes[quote.id] = quoteParts;
        } catch (error) {
          console.error('Error loading quote parts for quote', quote.id, error);
          newQuotePartsWithNotes[quote.id] = [];
        }
      }
      
      setState(prev => ({ ...prev, quotePartsWithNotes: newQuotePartsWithNotes }));
    };

    if (quotes.length > 0) {
      loadQuotePartsWithNotes();
    }
  }, [quotes, parts]);

  // Filtered quotes based on search and filter
  const filteredQuotes = useMemo(() => {
    return quotes.filter(quote => {
      // Search filter
      if (state.searchTerm) {
        const searchLower = state.searchTerm.toLowerCase();
        const matchesSearch = 
          quote.quoteRef?.toLowerCase().includes(searchLower) ||
          quote.vin?.toLowerCase().includes(searchLower) ||
          quote.make?.toLowerCase().includes(searchLower) ||
          quote.model?.toLowerCase().includes(searchLower) ||
          quote.customer?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }
      
      // Status filter (this would need to be implemented based on your specific filtering needs)
      // For now, returning all quotes that pass search
      return true;
    }).sort((a, b) => {
      // Sort by deadline priority first, then by creation date
      const priorityA = getDeadlinePriority(a);
      const priorityB = getDeadlinePriority(b);
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [quotes, state.searchTerm, state.filter]);

  return {
    state,
    setState,
    filteredQuotes,
    getQuotePartsWithNotes,
    getQuotePartsWithNotesSync,
  };
}; 