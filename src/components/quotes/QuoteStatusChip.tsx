'use client';

import React from 'react';
import { AlertTriangle, CheckCircle, ShoppingCart, Package, Clock, Eye } from 'lucide-react';
import { QuoteStatus } from '@/types/common';

interface QuoteStatusChipProps {
  status: QuoteStatus;
  className?: string;
}

export const QuoteStatusChip = ({ status, className = '' }: QuoteStatusChipProps) => {
  const statusConfig = {
    active: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200',
      icon: Clock,
      label: 'Active'
    },
    unpriced: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
      icon: AlertTriangle,
      label: 'Waiting for Price'
    },
    waiting_verification: {
      bg: 'bg-orange-100',
      text: 'text-orange-800',
      border: 'border-orange-200',
      icon: Eye,
      label: 'Waiting Verification'
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
    }
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${config.bg} ${config.text} ${config.border} shadow-sm whitespace-nowrap ${className}`}>
      <IconComponent className="h-4 w-4" />
      <span>{config.label}</span>
    </div>
  );
}; 