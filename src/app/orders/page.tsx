'use client';

import React, { useState } from 'react';
import QuoteTable from '@/components/ui/QuoteTable';
import { useQuotes } from '@/components/ui/useQuotes';

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'delivered'>('orders');
  
  const {
    quotes,
    parts,
    updateQuote,
    deleteQuote,
    updatePart,
    updateMultipleParts,
    markQuoteCompleted,
    markQuoteAsOrdered,
    markQuoteAsOrderedWithParts,
  } = useQuotes();

  // Filter quotes to show ordered and delivered quotes
  const orderedQuotes = quotes.filter(quote => quote.status === 'ordered');
  const deliveredQuotes = quotes.filter(quote => quote.status === 'delivered');

  // Wrapper functions to match QuoteTableProps interface
  const onUpdateQuote = async (id: string, fields: Record<string, any>) => {
    const result = await updateQuote(id, fields);
    return { error: result.error as Error | null };
  };

  const onDeleteQuote = async (id: string) => {
    const result = await deleteQuote(id);
    return { error: result.error as Error | null };
  };

  const onUpdatePart = async (id: string, updates: any) => {
    return await updatePart(id, updates);
  };

  const onUpdateMultipleParts = async (updates: any) => {
    await updateMultipleParts(updates);
  };

  const onMarkCompleted = async (id: string) => {
    const result = await markQuoteCompleted(id);
    return { error: result.error };
  };

  const onMarkAsOrdered = async (id: string, taxInvoiceNumber: string) => {
    const result = await markQuoteAsOrdered(id, taxInvoiceNumber);
    return { error: result.error };
  };

  const onMarkAsOrderedWithParts = async (id: string, taxInvoiceNumber: string, partIds: string[]) => {
    const result = await markQuoteAsOrderedWithParts(id, taxInvoiceNumber, partIds);
    return { error: result.error as Error | null };
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="relative">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders</h1>
          <p className="text-gray-600">Manage customer orders and fulfillment</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('orders')}
                className={`relative py-2 px-1 text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'orders'
                    ? 'text-red-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Orders
                <span className="text-xs text-gray-400 ml-2">({orderedQuotes.length})</span>
                {activeTab === 'orders' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full"></div>
                )}
              </button>
              <button
                onClick={() => setActiveTab('delivered')}
                className={`relative py-2 px-1 text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'delivered'
                    ? 'text-red-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Delivered
                <span className="text-xs text-gray-400 ml-2">({deliveredQuotes.length})</span>
                {activeTab === 'delivered' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full"></div>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'orders' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Active Orders</h2>
                <p className="text-sm text-gray-600">Orders waiting for delivery</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm text-gray-600">{orderedQuotes.length} orders</span>
              </div>
            </div>
            <QuoteTable
              quotes={orderedQuotes}
              parts={parts}
              onUpdateQuote={onUpdateQuote}
              onDeleteQuote={onDeleteQuote}
              onUpdatePart={onUpdatePart}
              onUpdateMultipleParts={onUpdateMultipleParts}
              onMarkCompleted={onMarkCompleted}
              onMarkAsOrdered={onMarkAsOrdered}
              onMarkAsOrderedWithParts={onMarkAsOrderedWithParts}
              showCompleted={false}
            />
          </div>
        )}

        {activeTab === 'delivered' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Delivered Orders</h2>
                <p className="text-sm text-gray-600">Orders that have been delivered</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600">{deliveredQuotes.length} delivered</span>
              </div>
            </div>
            <QuoteTable
              quotes={deliveredQuotes}
              parts={parts}
              onUpdateQuote={onUpdateQuote}
              onDeleteQuote={onDeleteQuote}
              onUpdatePart={onUpdatePart}
              onUpdateMultipleParts={onUpdateMultipleParts}
              onMarkCompleted={onMarkCompleted}
              onMarkAsOrdered={onMarkAsOrdered}
              onMarkAsOrderedWithParts={onMarkAsOrderedWithParts}
              showCompleted={false}
            />
          </div>
        )}
      </div>
    </div>
  );
} 