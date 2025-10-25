import { useState, useEffect } from 'react';
import { Quote } from '@/components/ui/useQuotes';

interface UseServerSideAccordionProps {
  quotes: Quote[];
  currentPageName?: string;
}

interface UseServerSideAccordionReturn {
  expandedRows: Set<string>;
  setExpandedRows: React.Dispatch<React.SetStateAction<Set<string>>>;
  quotesOpenByOthers: Set<string>;
  handleAccordionChange: (quoteId: string, isOpen: boolean) => Promise<void>;
}

export const useServerSideAccordion = ({ 
  quotes, 
  currentPageName 
}: UseServerSideAccordionProps): UseServerSideAccordionReturn => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [quotesOpenByOthers, setQuotesOpenByOthers] = useState<Set<string>>(new Set());

  // Only enable server-side accordion for /priced page
  const isServerSideAccordionEnabled = currentPageName === 'priced';

  // Sync client state with server state when quotes change
  useEffect(() => {
    if (!isServerSideAccordionEnabled) return;

    const serverExpandedRows = new Set(quotes.filter(quote => quote.isOpen).map(quote => quote.id));
    setExpandedRows(serverExpandedRows);
    
    // Initialize quotes open by others based on current data
    const openByOthers = new Set(
      quotes
        .filter(quote => quote.isOpen && quote.openedBy)
        .map(quote => quote.id)
    );
    setQuotesOpenByOthers(openByOthers);
  }, [quotes, isServerSideAccordionEnabled]);

  // Real-time subscription for isOpen changes from OTHER users only
  useEffect(() => {
    if (!isServerSideAccordionEnabled) return;

    let channel: any = null;
    
    const setupRealtime = async () => {
      try {
        const { default: supabase } = await import('@/utils/supabase');
        
        // Get current user ID to filter out our own changes
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id;

        // Listen to quote changes
        channel = supabase
          .channel('quotes-realtime-accordion')
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'quotes'
            },
            (payload) => {
              // Check if isOpen field changed
              const wasOpen = (payload.old as any)?.is_open;
              const isNowOpen = (payload.new as any)?.is_open;
              const openedBy = (payload.new as any)?.opened_by;
              
              // Process UPDATE events for isOpen changes
              if (payload.eventType === 'UPDATE') {
                // Always check current state and update accordingly
                if (isNowOpen) {
                  // If opened by someone else, only add visual indicators (don't expand)
                  if (openedBy && openedBy !== currentUserId) {
                    setQuotesOpenByOthers(prev => new Set([...prev, payload.new.id]));
                    // DON'T expand the accordion for other users
                  } else if (openedBy === currentUserId) {
                    // Only expand if it's our own action
                    setExpandedRows(prev => new Set([...prev, payload.new.id]));
                  }
                } else {
                  // Always remove visual indicators when quote is closed
                  setQuotesOpenByOthers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(payload.new.id);
                    return newSet;
                  });
                  
                  // Check who had it open before (from old data) to determine accordion behavior
                  const previouslyOpenedBy = (payload.old as any)?.opened_by;
                  
                  // Only collapse accordion if it was our own quote
                  if (previouslyOpenedBy === currentUserId) {
                    setExpandedRows(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(payload.new.id);
                      return newSet;
                    });
                  }
                }
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Real-time accordion subscription is active!');
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ Real-time accordion subscription failed!');
            }
          });
      } catch (error) {
        console.error('❌ Error setting up real-time accordion subscription:', error);
      }
    };

    setupRealtime();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [isServerSideAccordionEnabled]);

  // Function to handle accordion open/close with server-side tracking
  const handleAccordionChange = async (quoteId: string, isOpen: boolean) => {
    if (!isServerSideAccordionEnabled) return;

    try {
      // Import supabase client for direct update
      const supabase = (await import('@/utils/supabase')).default;
      
      // Get current user ID
      const { data: { user } } = await supabase.auth.getUser();
      const currentUserId = user?.id;
      
      // Update the quote's isOpen status on the server
      const { error } = await supabase
        .from('quotes')
        .update({ 
          is_open: isOpen,
          opened_by: isOpen ? currentUserId : null,
          opened_at: isOpen ? new Date().toISOString() : null
        })
        .eq('id', quoteId);
      
      if (error) {
        console.error('❌ Error updating quote accordion state:', error);
        // Revert client state on error
        setExpandedRows(prev => {
          const newSet = new Set(prev);
          if (isOpen) {
            newSet.delete(quoteId);
          } else {
            newSet.add(quoteId);
          }
          return newSet;
        });
        return;
      }
      
    } catch (error) {
      console.error('❌ Error updating quote accordion state:', error);
      // Revert client state on error
      setExpandedRows(prev => {
        const newSet = new Set(prev);
        if (isOpen) {
          newSet.delete(quoteId);
        } else {
          newSet.add(quoteId);
        }
        return newSet;
      });
    }
  };

  return {
    expandedRows,
    setExpandedRows,
    quotesOpenByOthers,
    handleAccordionChange
  };
};
