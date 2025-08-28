import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import supabase from '@/utils/supabase';
import { queryKeys } from '@/hooks/queries/useQuotesQuery';

export const useQuotesRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🔌 Setting up realtime subscriptions...');

    // Subscribe to quotes table changes
    const quotesChannel = supabase
      .channel('quotes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'quotes'
        },
        (payload) => {
          console.log('📡 Quotes realtime event:', payload.eventType, payload.new?.id || payload.old?.id);
          
          // Invalidate quotes queries to trigger refetch
          queryClient.invalidateQueries({ queryKey: queryKeys.quotesBase });
          
          // If it's a specific quote update, also invalidate that quote's parts
          if (payload.new?.id) {
            const partsKey = [...queryKeys.quotesBase, 'json-parts', payload.new.id];
            queryClient.invalidateQueries({ queryKey: partsKey });
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Quotes channel status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Quotes realtime subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Quotes realtime subscription failed');
        }
      });

    // Subscribe to parts table changes
    const partsChannel = supabase
      .channel('parts-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'parts'
        },
        (payload) => {
          console.log('📡 Parts realtime event:', payload.eventType, payload.new?.id || payload.old?.id);
          
          // Invalidate parts queries and quotes (since parts affect quotes)
          queryClient.invalidateQueries({ queryKey: queryKeys.parts });
          queryClient.invalidateQueries({ queryKey: queryKeys.quotesBase });
        }
      )
      .subscribe((status) => {
        console.log('📡 Parts channel status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Parts realtime subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Parts realtime subscription failed');
        }
      });

    // Subscribe to vehicles table changes
    const vehiclesChannel = supabase
      .channel('vehicles-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'vehicles'
        },
        (payload) => {
          console.log('📡 Vehicles realtime event:', payload.eventType, payload.new?.id || payload.old?.id);
          
          // Invalidate quotes since vehicle changes affect quote display
          queryClient.invalidateQueries({ queryKey: queryKeys.quotesBase });
        }
      )
      .subscribe((status) => {
        console.log('📡 Vehicles channel status:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ Vehicles realtime subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Vehicles realtime subscription failed');
        }
      });

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up realtime subscriptions...');
      quotesChannel.unsubscribe();
      partsChannel.unsubscribe();
      vehiclesChannel.unsubscribe();
    };
  }, [queryClient]);
};
