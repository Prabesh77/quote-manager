'use client';

import React from 'react';
import { useQuotesRealtime } from '@/hooks/useQuotesRealtime';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  // Initialize quotes realtime subscription
  useQuotesRealtime();
  
  return <>{children}</>;
}
