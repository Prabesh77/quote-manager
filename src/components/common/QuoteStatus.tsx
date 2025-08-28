'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, ShoppingCart, Package } from 'lucide-react';

export type QuoteStatus = 'unpriced' | 'priced' | 'completed' | 'ordered' | 'delivered' | 'waiting_verification';

interface QuoteStatusProps {
  status: QuoteStatus;
  className?: string;
}

export const getQuoteStatus = (quoteParts: any[], quoteStatus?: string): QuoteStatus => {
  // Prioritize database status over calculated status
  if (quoteStatus === 'delivered') return 'delivered';
  if (quoteStatus === 'ordered') return 'ordered';
  if (quoteStatus === 'completed') return 'completed';
  if (quoteStatus === 'priced') return 'priced';
  if (quoteStatus === 'waiting_verification') return 'waiting_verification';
  if (quoteStatus === 'unpriced') return 'unpriced';
  if (quoteStatus === 'active') {
    // Fallback to calculation for legacy quotes
    if (quoteParts.length === 0) return 'unpriced';
    // Since we're ignoring base part prices, we need to check variants
    // For now, assume unpriced if we can't determine from variants
    return 'unpriced';
  }
  return 'unpriced';
};

export const getStatusChip = (status: QuoteStatus) => {
  const statusConfig = {
    unpriced: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
      icon: AlertTriangle,
      label: 'Waiting for Price'
    },
    priced: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
      icon: CheckCircle,
      label: 'Priced'
    },
    completed: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200',
      icon: CheckCircle,
      label: 'Completed'
    },
    ordered: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      border: 'border-purple-200',
      icon: ShoppingCart,
      label: 'Ordered'
    },
    delivered: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-200',
      icon: Package,
      label: 'Delivered'
    },
    waiting_verification: {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-200',
      icon: AlertTriangle,
      label: 'Waiting for Verification'
    }
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${config.bg} ${config.text} ${config.border} shadow-sm whitespace-nowrap`}>
      <IconComponent className="h-4 w-4" />
      <span>{config.label}</span>
    </div>
  );
};

export const QuoteStatus: React.FC<QuoteStatusProps> = ({ status, className = '' }) => {
  return (
    <div className={className}>
      {getStatusChip(status)}
    </div>
  );
};
