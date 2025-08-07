'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Quote, Part } from '@/hooks/useOptimizedQuotes';

interface VirtualizedQuoteTableProps {
  quotes: Quote[];
  parts: Part[];
  height: number;
  itemHeight: number;
  onUpdateQuote: (id: string, fields: Record<string, any>) => Promise<{ error: Error | null }>;
  onDeleteQuote: (id: string) => Promise<{ error: Error | null }>;
}

const VirtualizedQuoteTable: React.FC<VirtualizedQuoteTableProps> = ({
  quotes,
  parts,
  height,
  itemHeight,
  onUpdateQuote,
  onDeleteQuote,
}) => {
  const [editingQuote, setEditingQuote] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});

  // Memoized quote data to prevent unnecessary re-renders
  const processedQuotes = useMemo(() => 
    quotes.map(quote => ({
      ...quote,
      parts: quote.partRequested?.split(',').map(id => 
        parts.find(part => part.id === id)
      ).filter(Boolean) || []
    })), [quotes, parts]
  );

  const QuoteRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const quote = processedQuotes[index];
    const isEditing = editingQuote === quote.id;

    const handleEdit = () => {
      setEditingQuote(quote.id);
      setEditData({
        quoteRef: quote.quoteRef,
        vin: quote.vin,
        make: quote.make,
        model: quote.model,
        customer: quote.customer,
        status: quote.status,
      });
    };

    const handleSave = async () => {
      await onUpdateQuote(quote.id, editData);
      setEditingQuote(null);
      setEditData({});
    };

    const handleCancel = () => {
      setEditingQuote(null);
      setEditData({});
    };

    return (
      <div style={style} className="border-b border-gray-200 hover:bg-gray-50">
        <div className="flex items-center p-4">
          {/* Quote Reference */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editData.quoteRef || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, quoteRef: e.target.value }))}
                className="w-full px-2 py-1 border border-gray-300 rounded"
              />
            ) : (
              <div className="font-medium text-gray-900">{quote.quoteRef}</div>
            )}
          </div>

          {/* VIN */}
          <div className="flex-1 min-w-0 px-4">
            {isEditing ? (
              <input
                type="text"
                value={editData.vin || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, vin: e.target.value }))}
                className="w-full px-2 py-1 border border-gray-300 rounded"
              />
            ) : (
              <div className="text-sm text-gray-600">{quote.vin}</div>
            )}
          </div>

          {/* Vehicle Info */}
          <div className="flex-1 min-w-0 px-4">
            <div className="text-sm text-gray-900">
              {quote.make} {quote.model}
            </div>
            <div className="text-xs text-gray-500">{quote.series}</div>
          </div>

          {/* Customer */}
          <div className="flex-1 min-w-0 px-4">
            {isEditing ? (
              <input
                type="text"
                value={editData.customer || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, customer: e.target.value }))}
                className="w-full px-2 py-1 border border-gray-300 rounded"
              />
            ) : (
              <div className="text-sm text-gray-600">{quote.customer || '-'}</div>
            )}
          </div>

          {/* Status */}
          <div className="flex-1 min-w-0 px-4">
            {isEditing ? (
              <select
                value={editData.status || quote.status}
                onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-2 py-1 border border-gray-300 rounded"
              >
                <option value="unpriced">Unpriced</option>
                <option value="priced">Priced</option>
                <option value="completed">Completed</option>
                <option value="ordered">Ordered</option>
                <option value="delivered">Delivered</option>
              </select>
            ) : (
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                quote.status === 'completed' ? 'bg-green-100 text-green-800' :
                quote.status === 'priced' ? 'bg-blue-100 text-blue-800' :
                quote.status === 'ordered' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {quote.status}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 px-4">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="p-1 text-green-600 hover:text-green-800"
                >
                  ✓
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  ✕
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                ✎
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }, [processedQuotes, editingQuote, editData, onUpdateQuote]);

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center text-sm font-medium text-gray-700">
          <div className="flex-1">Quote Ref</div>
          <div className="flex-1 px-4">VIN</div>
          <div className="flex-1 px-4">Vehicle</div>
          <div className="flex-1 px-4">Customer</div>
          <div className="flex-1 px-4">Status</div>
          <div className="px-4">Actions</div>
        </div>
      </div>

      {/* Virtualized List */}
      <List
        height={height}
        itemCount={processedQuotes.length}
        itemSize={itemHeight}
        width="100%"
      >
        {QuoteRow}
      </List>
    </div>
  );
};

export default VirtualizedQuoteTable; 