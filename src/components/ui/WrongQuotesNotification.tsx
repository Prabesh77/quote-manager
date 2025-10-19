'use client';

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface WrongQuotesNotificationProps {
  userId: string;
}

export default function WrongQuotesNotification({ userId }: WrongQuotesNotificationProps) {
  const [wrongQuotesCount, setWrongQuotesCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!userId) return;

    const fetchWrongQuotesCount = async () => {
      try {
        // Fetch count of quotes with 'wrong' status created by the current user
        const { count, error } = await supabase
          .from('quotes')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'wrong')
          .eq('created_by', userId);

        if (error) {
          console.error('Error fetching wrong quotes count:', error);
          return;
        }

        setWrongQuotesCount(count || 0);
      } catch (error) {
        console.error('Error in fetchWrongQuotesCount:', error);
      }
    };

    fetchWrongQuotesCount();

    // Set up real-time subscription for wrong quotes
    const subscription = supabase
      .channel('wrong_quotes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quotes',
          filter: `created_by=eq.${userId}`,
        },
        () => {
          fetchWrongQuotesCount();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userId]);

  const handleNotificationClick = () => {
    router.push('/wrong-quotes');
  };

  if (wrongQuotesCount === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={handleNotificationClick}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        title={`${wrongQuotesCount} wrong quotes need attention`}
      >
        <Bell className="h-5 w-5" />
        {wrongQuotesCount > 0 && (
          <span className="absolute -top-1 -right-1">
            <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
            <span className="relative inline-flex items-center justify-center bg-red-500 text-white text-xs rounded-full h-5 w-5 font-bold">
              {wrongQuotesCount > 9 ? '9+' : wrongQuotesCount}
            </span>
          </span>
        )}
      </button>
    </div>
  );
}
