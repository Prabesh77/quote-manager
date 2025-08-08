'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Quote } from '@/types/quote';
import { Part } from '@/types/part';
import { QuoteRow } from './QuoteRow';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface QuoteTableProps {
  quotes: Quote[];
  parts: Part[];
  onUpdateQuote: (id: string, fields: Record<string, any>) => Promise<{ error: Error | null }>;
  onDeleteQuote: (id: string) => Promise<{ error: Error | null }>;
  onUpdatePart: (id: string, updates: Partial<Part>) => Promise<{ data: Part; error: Error | null }>;
  onUpdateMultipleParts: (updates: Array<{ id: string; updates: Partial<Part> }>) => Promise<void>;
  onMarkCompleted?: (id: string) => Promise<{ error: Error | null }>;
  onMarkAsOrdered?: (id: string, taxInvoiceNumber: string) => Promise<{ error: Error | null }>;
  onMarkAsOrderedWithParts?: (id: string, taxInvoiceNumber: string, partIds: string[]) => Promise<{ error: Error | null }>;
  onVerifyPrice?: (id: string) => Promise<{ error: Error | null }>;
  showCompleted?: boolean;
  showVerifyAction?: boolean;
}

export default function QuoteTable({ 
  quotes, 
  parts, 
  onUpdateQuote, 
  onDeleteQuote, 
  onUpdatePart, 
  onUpdateMultipleParts, 
  onMarkCompleted, 
  onMarkAsOrdered, 
  onMarkAsOrderedWithParts, 
  onVerifyPrice,
  showCompleted = false, 
  showVerifyAction = false
}: QuoteTableProps) {
  const [editingQuote, setEditingQuote] = useState<string | null>(null);
  const [editingParts, setEditingParts] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [partEditData, setPartEditData] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showOrderConfirm, setShowOrderConfirm] = useState<string | null>(null);
  const [taxInvoiceNumber, setTaxInvoiceNumber] = useState('');
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingQuote(null);
        setEditingParts(null);
      }
      
      if (e.key === 'Enter' && (editingQuote || editingParts)) {
        handleSave();
      }
      
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingQuote, editingParts]);

  const handleSave = async () => {
    if (editingQuote) {
      await onUpdateQuote(editingQuote, editData);
      setEditingQuote(null);
      setEditData({});
    }
    if (editingParts) {
      const updates = Object.keys(partEditData).map(id => ({
        id,
        updates: partEditData[id]
      }));
      await onUpdateMultipleParts(updates);
      setEditingParts(null);
      setPartEditData({});
    }
  };

  const startEditingQuote = (quote: Quote) => {
    setEditingQuote(quote.id);
    setEditData({
      quoteRef: quote.quoteRef,
      vin: quote.vin,
      make: quote.make,
      model: quote.model,
      series: quote.series,
      auto: quote.auto,
      body: quote.body,
      mthyr: quote.mthyr,
      rego: quote.rego,
      requiredBy: quote.requiredBy,
      customer: quote.customer,
      address: quote.address,
      phone: quote.phone,
    });
  };

  const startEditingParts = (quoteParts: Part[], quoteId: string) => {
    setEditingParts(quoteId);
    const initialData: Record<string, any> = {};
    quoteParts.forEach(part => {
      initialData[part.id] = {
        name: part.name,
        number: part.number,
        price: part.price,
        note: part.note,
      };
    });
    setPartEditData(initialData);
  };

  const handleQuoteEditChange = (field: string, value: string | number | boolean) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handlePartEditChange = (partId: string, field: string, value: string | number | null) => {
    setPartEditData(prev => ({
      ...prev,
      [partId]: {
        ...prev[partId],
        [field]: value
      }
    }));
  };

  const getQuoteParts = (partRequested: string): Part[] => {
    if (!partRequested) return [];
    const partIds = partRequested.split(',').filter(id => id.trim());
    return parts.filter(part => partIds.includes(part.id));
  };

  const getQuoteStatus = (quoteParts: Part[], quoteStatus?: string): string => {
    if (quoteStatus === 'completed' || quoteStatus === 'ordered' || quoteStatus === 'delivered') {
      return quoteStatus;
    }
    
    // If quote status is explicitly set to waiting_verification or priced, use that
    if (quoteStatus === 'waiting_verification' || quoteStatus === 'priced') {
      return quoteStatus;
    }
    
    if (quoteParts.length === 0) return 'unpriced';
    
    const allPartsPriced = quoteParts.every(part => part.price && part.price > 0);
    return allPartsPriced ? 'waiting_verification' : 'unpriced';
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getVehicleLogo = (make: string) => {
    const makeLower = make.toLowerCase();
    
    if (makeLower.includes('toyota')) return '/car-logos/toyota.png';
    if (makeLower.includes('honda')) return '/car-logos/honda.png';
    if (makeLower.includes('ford')) return '/car-logos/ford.png';
    if (makeLower.includes('bmw')) return '/car-logos/bmw.png';
    if (makeLower.includes('audi')) return '/car-logos/audi.png';
    if (makeLower.includes('mercedes')) return '/car-logos/mercedes.png';
    if (makeLower.includes('volkswagen')) return '/car-logos/volkswagen.png';
    if (makeLower.includes('nissan')) return '/car-logos/nissan.png';
    if (makeLower.includes('mazda')) return '/car-logos/mazda.png';
    if (makeLower.includes('subaru')) return '/car-logos/subaru.png';
    if (makeLower.includes('hyundai')) return '/car-logos/hyundai.png';
    if (makeLower.includes('kia')) return '/car-logos/kia.png';
    if (makeLower.includes('lexus')) return '/car-logos/lexus.png';
    if (makeLower.includes('volvo')) return '/car-logos/volvo.png';
    if (makeLower.includes('land rover')) return '/car-logos/landrover.png';
    if (makeLower.includes('jaguar')) return '/car-logos/jaguar.png';
    if (makeLower.includes('jeep')) return '/car-logos/jeep.png';
    if (makeLower.includes('mini')) return '/car-logos/mini.png';
    if (makeLower.includes('peugeot')) return '/car-logos/peugeot.png';
    if (makeLower.includes('renault')) return '/car-logos/renault.png';
    if (makeLower.includes('skoda')) return '/car-logos/skoda.png';
    if (makeLower.includes('chevrolet')) return '/car-logos/chevrolet.png';
    if (makeLower.includes('infiniti')) return '/car-logos/infiniti.png';
    if (makeLower.includes('mitsubishi')) return '/car-logos/mitsubisi.png';
    if (makeLower.includes('mg')) return '/car-logos/mg.png';
    if (makeLower.includes('alfa romeo')) return '/car-logos/alfaromeo.png';
    
    return '/car-logos/default.png';
  };

  const getPartIcon = (partName: string): string | null => {
    const name = partName.toLowerCase();
    if (name.includes('radiator')) return '/part-icons/radiator.png';
    if (name.includes('condenser')) return '/part-icons/condenser.png';
    if (name.includes('fan')) return '/part-icons/fan.png';
    if (name.includes('headlight') && name.includes('left')) return '/part-icons/headlight-left.png';
    if (name.includes('headlight') && name.includes('right')) return '/part-icons/headlight-right.png';
    if (name.includes('sensor')) return '/part-icons/sensor.png';
    if (name.includes('intercooler')) return '/part-icons/intercooler.png';
    return null;
  };

  const handleDeleteWithConfirm = async (quoteId: string) => {
    setShowDeleteConfirm(quoteId);
  };

  const confirmDelete = async () => {
    if (showDeleteConfirm) {
      await onDeleteQuote(showDeleteConfirm);
      setShowDeleteConfirm(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const handleMarkAsOrder = (quoteId: string) => {
    setShowOrderConfirm(quoteId);
  };

  const confirmOrder = async () => {
    if (showOrderConfirm && taxInvoiceNumber.trim()) {
      if (onMarkAsOrderedWithParts && selectedPartIds.length > 0) {
        await onMarkAsOrderedWithParts(showOrderConfirm, taxInvoiceNumber.trim(), selectedPartIds);
      } else if (onMarkAsOrdered) {
        await onMarkAsOrdered(showOrderConfirm, taxInvoiceNumber.trim());
      }
      setShowOrderConfirm(null);
      setTaxInvoiceNumber('');
      setSelectedPartIds([]);
    }
  };

  const cancelOrder = () => {
    setShowOrderConfirm(null);
    setTaxInvoiceNumber('');
    setSelectedPartIds([]);
  };

  // Filter and sort quotes
  const filteredAndSortedQuotes = useMemo(() => {
    let filtered = [...quotes];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(quote => 
        quote.make?.toLowerCase().includes(searchLower) ||
        quote.model?.toLowerCase().includes(searchLower) ||
        quote.customer?.toLowerCase().includes(searchLower) ||
        quote.vin?.toLowerCase().includes(searchLower) ||
        quote.rego?.toLowerCase().includes(searchLower)
      );
    }

    // Sort by status priority and creation date
    return filtered.sort((a, b) => {
      const aParts = getQuoteParts(a.partRequested);
      const bParts = getQuoteParts(b.partRequested);
      const aStatus = getQuoteStatus(aParts, a.status);
      const bStatus = getQuoteStatus(bParts, b.status);
      
      // Sort by status priority
      const statusPriority = { 
        'unpriced': 0, 
        'waiting_verification': 1, 
        'priced': 2, 
        'completed': 3, 
        'ordered': 4, 
        'delivered': 5 
      };
      const aPriority = statusPriority[aStatus as keyof typeof statusPriority] || 0;
      const bPriority = statusPriority[bStatus as keyof typeof statusPriority] || 0;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // Then by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [quotes, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              id="search-input"
              type="text"
              placeholder="Search quotes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          
          {/* Removed filter buttons */}
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>Total: {filteredAndSortedQuotes.length}</span>
        </div>
      </div>

      {/* Quotes Accordion */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hidden lg:block">
        {filteredAndSortedQuotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-8">
              <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">No quotes found</h3>
            <p className="text-gray-600 text-center max-w-lg mb-8 text-lg">
              {/* Removed filter-specific messages */}
              {showCompleted ? 'No quotes have been completed yet.' :
               'Get started by adding your first quote to track parts and pricing.'}
            </p>
            <div className="flex items-center space-x-3 text-base text-gray-500">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Ready to get started</span>
            </div>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
              <div className="grid grid-cols-6 gap-4 px-6 py-4" style={{ gridTemplateColumns: '1fr 1fr 2fr 1fr 0.5fr 0.5fr' }}>
                <div className="font-semibold text-gray-900 min-w-[150px]">Quote Ref</div>
                <div className="font-semibold text-gray-900 min-w-[180px]">VIN</div>
                <div className="font-semibold text-gray-900">Vehicle</div>
                <div className="font-semibold text-gray-900">Status</div>
                <div className="font-semibold text-gray-900">Parts</div>
                <div className="font-semibold text-gray-900">Actions</div>
              </div>
            </div>

            {/* Quotes List */}
            <Accordion type="multiple" className="w-full">
              {filteredAndSortedQuotes.map((quote) => {
                const quoteParts = getQuoteParts(quote.partRequested);
                const status = getQuoteStatus(quoteParts, quote.status);
                const isEditing = editingQuote === quote.id;
                const isEditingParts = editingParts === quote.id;

                return (
                  <QuoteRow
                    key={quote.id}
                    quote={quote}
                    quoteParts={quoteParts}
                    isEditing={isEditing}
                    isEditingParts={isEditingParts}
                    editData={editData}
                    partEditData={partEditData}
                    onEdit={() => startEditingQuote(quote)}
                    onSave={handleSave}
                    onCancel={() => {
                      setEditingQuote(null);
                      setEditData({});
                    }}
                    onDelete={() => handleDeleteWithConfirm(quote.id)}
                    onMarkCompleted={onMarkCompleted ? () => onMarkCompleted(quote.id) : undefined}
                    onMarkAsOrdered={onMarkAsOrdered ? () => handleMarkAsOrder(quote.id) : undefined}
                    onVerifyPrice={onVerifyPrice ? () => onVerifyPrice(quote.id) : undefined}
                    onQuoteEditChange={handleQuoteEditChange}
                    onPartEditChange={handlePartEditChange}
                    onStartEditingParts={() => startEditingParts(quoteParts, quote.id)}
                    onSaveParts={handleSave}
                    onCancelParts={() => {
                      setEditingParts(null);
                      setPartEditData({});
                    }}
                    status={status}
                    showCompleted={showCompleted}
                    showVerifyAction={showVerifyAction}
                    copyToClipboard={copyToClipboard}
                    getVehicleLogo={getVehicleLogo}
                    getPartIcon={getPartIcon}
                  />
                );
              })}
            </Accordion>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this quote? This action cannot be undone.</p>
            <div className="flex space-x-3">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={cancelDelete}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmation Modal */}
      {showOrderConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Mark as Ordered</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax Invoice Number
                </label>
                <input
                  type="text"
                  value={taxInvoiceNumber}
                  onChange={(e) => setTaxInvoiceNumber(e.target.value)}
                  placeholder="Enter tax invoice number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={confirmOrder}
                  disabled={!taxInvoiceNumber.trim()}
                  className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Confirm Order
                </button>
                <button
                  onClick={cancelOrder}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 