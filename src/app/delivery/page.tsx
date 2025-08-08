'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useQuotes } from '@/hooks/quotes/useQuotes';
import { useDelivery } from '@/components/ui/useDelivery';
import { Part } from '@/types/part';

export default function DeliveryPage() {
  const { quotes, parts, updateQuote } = useQuotes();
  const { deliveries, addDelivery } = useDelivery();
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);

  // Filter quotes that are ready for delivery (ordered status)
  const readyForDelivery = quotes.filter(quote => quote.status === 'ordered');

  const handleQuoteSelect = (quoteId: string) => {
    setSelectedQuotes(prev => 
      prev.includes(quoteId) 
        ? prev.filter(id => id !== quoteId)
        : [...prev, quoteId]
    );
  };

  const handleCreateDelivery = async () => {
    if (selectedQuotes.length === 0) return;

    // For now, create a simple delivery record
    // In a real app, you'd want a proper delivery creation flow
    const result = await addDelivery({
      customerName: 'Bulk Delivery',
      taxInvoiceNumber: `BULK-${Date.now()}`,
      receiverName: 'Receiver',
      photoProof: '',
      signature: '',
      status: 'delivered'
    });

    if (!result.error) {
      // Mark quotes as delivered
      for (const quoteId of selectedQuotes) {
        await updateQuote(quoteId, { status: 'delivered' });
      }
      setSelectedQuotes([]);
    }
  };

  const getQuoteParts = (partRequested: string): Part[] => {
    if (!partRequested) return [];
    const partIds = partRequested.split(',').filter(id => id.trim());
    return parts.filter(part => partIds.includes(part.id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Delivery Management</h1>
        <p className="mt-2 text-gray-600">Create deliveries and track order fulfillment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ready for Delivery */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Ready for Delivery</h2>
              <p className="text-sm text-gray-600">Select quotes to create a delivery</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">{readyForDelivery.length} quotes</span>
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {readyForDelivery.map((quote) => {
              const quoteParts = getQuoteParts(quote.partRequested);
              const isSelected = selectedQuotes.includes(quote.id);
              
              return (
                <div
                  key={quote.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleQuoteSelect(quote.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{quote.quoteRef}</span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-600">{quote.customer}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {quote.make} {quote.model} • {quoteParts.length} parts
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-500' 
                        : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                          <path d="M6.564.75l-3.59 3.612-1.538-1.55L0 4.26l2.974 2.99L8 2.193z"/>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {readyForDelivery.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4-4-4m0 0V3" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes ready</h3>
                <p className="text-gray-600">No orders are currently ready for delivery.</p>
              </div>
            )}
          </div>

          {selectedQuotes.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedQuotes.length} quote{selectedQuotes.length > 1 ? 's' : ''} selected
                </span>
                <Button onClick={handleCreateDelivery} className="bg-blue-600 hover:bg-blue-700">
                  Create Delivery
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Deliveries */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recent Deliveries</h2>
              <p className="text-sm text-gray-600">Track delivery status and history</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">{deliveries.length} deliveries</span>
            </div>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {deliveries.slice(0, 10).map((delivery) => (
              <div key={delivery.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{delivery.customerName}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    delivery.status === 'delivered' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {delivery.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Tax Invoice: {delivery.taxInvoiceNumber}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(delivery.deliveredAt).toLocaleDateString()}
                </div>
              </div>
            ))}

            {deliveries.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries yet</h3>
                <p className="text-gray-600">Create your first delivery to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 