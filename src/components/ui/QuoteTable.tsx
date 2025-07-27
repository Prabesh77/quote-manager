'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, Edit, Trash2, Save, X, Search, Eye, Copy, Car, CheckCircle, AlertTriangle, ShoppingCart } from 'lucide-react';
import { Quote, Part } from './useQuotes';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface QuoteTableProps {
  quotes: Quote[];
  parts: Part[];
  onUpdateQuote: (id: string, fields: Record<string, any>) => Promise<{ error: any }>;
  onDeleteQuote: (id: string) => Promise<{ error: any }>;
  onUpdatePart: (id: string, updates: Partial<Part>) => Promise<{ data: any; error: any }>;
  onUpdateMultipleParts: (updates: Array<{ id: string; updates: Partial<Part> }>) => Promise<void>;
  onMarkCompleted?: (id: string) => Promise<{ error: any }>;
  onMarkAsOrdered?: (id: string, taxInvoiceNumber: string) => Promise<{ error: any }>;
  onMarkAsOrderedWithParts?: (id: string, taxInvoiceNumber: string, partIds: string[]) => Promise<{ error: any }>;
  showCompleted?: boolean;
  defaultFilter?: FilterType;
}

type FilterType = 'all' | 'unpriced' | 'priced';

type QuoteStatus = 'unpriced' | 'priced' | 'completed' | 'ordered';

export default function QuoteTable({ quotes, parts, onUpdateQuote, onDeleteQuote, onUpdatePart, onUpdateMultipleParts, onMarkCompleted, onMarkAsOrdered, onMarkAsOrderedWithParts, showCompleted = false, defaultFilter = 'all' }: QuoteTableProps) {
  const [editingQuote, setEditingQuote] = useState<string | null>(null);
  const [editingParts, setEditingParts] = useState<Set<string>>(new Set());
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [partsEditData, setPartsEditData] = useState<Record<string, Record<string, any>>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>(defaultFilter);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showOrderModal, setShowOrderModal] = useState<string | null>(null);
  const [taxInvoiceNumber, setTaxInvoiceNumber] = useState('');
  const [selectedPartsForOrder, setSelectedPartsForOrder] = useState<Set<string>>(new Set());

  // Brand colors
  const brandRed = '#d0202d';
  const brandColors = {
    primary: brandRed,
    secondary: '#1f2937',
    accent: '#f3f4f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: brandRed,
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingQuote(null);
        setEditingParts(new Set());
      }
      
      if (e.key === 'Enter' && (editingQuote || editingParts.size > 0)) {
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
    if (editingParts.size > 0) {
      const updates = Array.from(editingParts).map(id => ({
        id,
        updates: partsEditData[id] || {}
      }));
      await onUpdateMultipleParts(updates);
      setEditingParts(new Set());
      setPartsEditData({});
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
    });
  };

  const startEditingParts = (quoteParts: Part[]) => {
    const newEditingParts = new Set<string>();
    const newPartsEditData: Record<string, Record<string, any>> = {};
    
    quoteParts.forEach(part => {
      newEditingParts.add(part.id);
      newPartsEditData[part.id] = {
        name: part.name,
        number: part.number,
        price: part.price,
        note: part.note,
      };
    });
    
    setEditingParts(newEditingParts);
    setPartsEditData(newPartsEditData);
  };

  const handleQuoteEditChange = (field: string, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handlePartEditChange = (partId: string, field: string, value: string | number | null) => {
    setPartsEditData(prev => ({
      ...prev,
      [partId]: {
        ...prev[partId],
        [field]: value
      }
    }));
  };

  const getQuoteParts = (partRequested: string): Part[] => {
    if (!partRequested) {
      return [];
    }
    
    const partIds = partRequested.split(',').map(id => id.trim());
    
    const foundParts = parts.filter(part => {
      const isFound = partIds.includes(String(part.id));
      return isFound;
    });
    
    return foundParts;
  };

  const getQuoteStatus = (quoteParts: Part[], quoteStatus?: string): QuoteStatus => {
    // Prioritize database status over calculated status
    if (quoteStatus === 'ordered') return 'ordered';
    if (quoteStatus === 'completed') return 'completed';
    if (quoteStatus === 'priced') return 'priced';
    if (quoteStatus === 'unpriced') return 'unpriced';
    if (quoteStatus === 'active') {
      // Fallback to calculation for legacy quotes
      if (quoteParts.length === 0) return 'unpriced';
      const hasPricedParts = quoteParts.some(part => part.price && part.price > 0);
      return hasPricedParts ? 'priced' : 'unpriced';
    }
    return 'unpriced';
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getVehicleLogo = (make: string) => {
    const makeLower = make.toLowerCase();
    // You can add more vehicle logos here
    const logos: Record<string, string> = {
      'toyota': '🚗',
      'honda': '🚗',
      'ford': '🚗',
      'bmw': '🚗',
      'mercedes': '🚗',
      'audi': '🚗',
    };
    return logos[makeLower] || '🚗';
  };

  const getStatusChip = (status: QuoteStatus) => {
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
      }
    };

    const config = statusConfig[status];
    const IconComponent = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${config.bg} ${config.text} ${config.border} shadow-sm`}>
        <IconComponent className="h-4 w-4" />
        <span>{config.label}</span>
      </div>
    );
  };

  const filteredQuotes = quotes.filter(quote => {
    const quoteParts = getQuoteParts(quote.partRequested);
    const status = getQuoteStatus(quoteParts, quote.status);
    
    // Filter by completion status
    if (showCompleted && quote.status !== 'completed') return false;
    if (!showCompleted && quote.status === 'completed') return false;
    
    // Apply status filter (only for active quotes page)
    if (!showCompleted) {
      if (activeFilter === 'unpriced' && status !== 'unpriced') return false;
      if (activeFilter === 'priced' && status !== 'priced') return false;
    }
    
    // Apply search filter
    const matchesSearch = 
      quote.quoteRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.vin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.make?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }).sort((a, b) => {
    // Sort by date - latest first for completed quotes, oldest first for active quotes
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return showCompleted ? dateB - dateA : dateA - dateB;
  });

  // Memoize the array of IDs so it doesn't change on every render
  const allQuoteIds = useMemo(() => filteredQuotes.map(q => q.id), [filteredQuotes]);

  const handleDeleteWithConfirm = async (quoteId: string) => {
    setShowDeleteConfirm(quoteId);
  };

  const confirmDelete = async (quoteId: string) => {
    await onDeleteQuote(quoteId);
    setShowDeleteConfirm(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const handleMarkAsOrder = (quoteId: string) => {
    setShowOrderModal(quoteId);
    setTaxInvoiceNumber('');
    // Get the quote and its parts
    const quote = quotes.find(q => q.id === quoteId);
    if (quote) {
      const quoteParts = getQuoteParts(quote.partRequested);
      // Initialize with all parts selected
      setSelectedPartsForOrder(new Set(quoteParts.map(part => part.id)));
    }
  };

  const confirmOrder = async (quoteId: string) => {
    if (!taxInvoiceNumber.trim()) {
      alert('Please enter a Tax Invoice Number');
      return;
    }
    
    // Get the quote and its parts
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return;
    
    const quoteParts = getQuoteParts(quote.partRequested);
    const selectedParts = quoteParts.filter(part => selectedPartsForOrder.has(part.id));
    
    if (selectedParts.length === 0) {
      alert('Please select at least one part to order');
      return;
    }
    
    console.log('Ordering quote:', quoteId, 'with tax invoice:', taxInvoiceNumber);
    console.log('Selected parts:', selectedParts.map(p => p.name));
    
    if (onMarkAsOrderedWithParts) {
      await onMarkAsOrderedWithParts(quoteId, taxInvoiceNumber, selectedParts.map(p => p.id));
    } else {
      console.log('Marking quote as ordered:', quoteId, 'with tax invoice:', taxInvoiceNumber);
    }
    setShowOrderModal(null);
    setTaxInvoiceNumber('');
    setSelectedPartsForOrder(new Set());
  };

  const cancelOrder = () => {
    setShowOrderModal(null);
    setTaxInvoiceNumber('');
    setSelectedPartsForOrder(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              id="search-input"
              type="text"
              placeholder="Search quotes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
        
        {/* Filter Chips */}
        <div className="flex items-center space-x-2">
          {(showCompleted ? ['all'] : ['all', 'unpriced', 'priced']).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter as FilterType)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                activeFilter === filter
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter === 'all' ? 'All' : filter === 'unpriced' ? 'Unpriced' : filter === 'priced' ? 'Priced' : 'Completed'}
            </button>
          ))}
        </div>
      </div>

      {/* Quotes Accordion */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-6 py-3">
            <div className="grid grid-cols-6 gap-2 items-center" style={{ gridTemplateColumns: '1fr 1fr 2fr 1fr 0.5fr 0.5fr' }}>
              <div className="w-40">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Quote Ref</span>
              </div>
              <div className="w-40">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">VIN</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Vehicle</span>
              </div>
              <div className="w-36">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</span>
              </div>
              <div className="w-24">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Parts</span>
              </div>
              <div className="">
                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">Actions</span>
              </div>
            </div>
          </div>
        </div>

        <Accordion type="multiple" className="w-full" defaultValue={allQuoteIds}>
          {filteredQuotes.map((quote) => {
            const quoteParts = getQuoteParts(quote.partRequested);
            const isEditing = editingQuote === quote.id;
            const status = getQuoteStatus(quoteParts, quote.status);

            return (
              <AccordionItem key={quote.id} value={quote.id} className="border-b border-gray-200 last:border-b-0">
                <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
                  <div className="grid grid-cols-6 gap-2 items-center w-full" style={{ gridTemplateColumns: '1fr 1fr 2fr 1fr 0.5fr 0.5fr' }}>
                    {/* Quote Ref */}
                    <div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.quoteRef || ''}
                          onChange={(e) => handleQuoteEditChange('quoteRef', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div>
                        <div className="flex items-center space-x-2 pb-1">
                          <span className="font-semibold text-gray-900">{quote.quoteRef}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(quote.quoteRef || '');
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            title="Copy quote ref"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                         {/* Tax Invoice Number for Ordered Quotes - Main Row Display */}
                         {quote.status === 'ordered' && quote.taxInvoiceNumber && (
                          <div className="flex items-center border-t border-gray-100">
                            <div className="flex items-center space-x-1  py-1 text-xs">
                              <span className="text-purple-800 font-medium text-sm">Invoice:</span>
                              <span className="text-purple-900 font-mono text-[15px]">{quote.taxInvoiceNumber}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(quote.taxInvoiceNumber || '');
                                }}
                                className="p-0.5 text-purple-600 hover:text-purple-700 hover:bg-purple-200 rounded transition-colors cursor-pointer"
                                title="Copy tax invoice number"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                        </div>
                      )}
                    </div>

                    {/* VIN */}
                    <div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.vin || ''}
                          onChange={(e) => handleQuoteEditChange('vin', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-900 font-mono">{quote.vin || '-'}</span>
                          {quote.vin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(quote.vin || '');
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                              title="Copy VIN"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Vehicle */}
                    <div>
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editData.make || ''}
                            onChange={(e) => handleQuoteEditChange('make', e.target.value)}
                            placeholder="Make"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <input
                            type="text"
                            value={editData.model || ''}
                            onChange={(e) => handleQuoteEditChange('model', e.target.value)}
                            placeholder="Model"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <span className="text-lg">{getVehicleLogo(quote.make)}</span>
                            <span className="text-sm font-medium text-gray-900">{quote.make}</span>
                          </div>
                          <span className="text-sm text-gray-600">•</span>
                          <span className="text-sm text-gray-900">{quote.model}</span>
                          {quote.series && (
                            <>
                              <span className="text-sm text-gray-600">•</span>
                              <span className="text-sm text-gray-900">{quote.series}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div>
                      <div className="flex space-y-1">
                        {getStatusChip(status)}
                      </div>
                    </div>

                    {/* Parts */}
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {quoteParts.length} {quoteParts.length === 1 ? 'part' : 'parts'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-1 action-buttons">
                      {(quote.status !== 'completed' || showCompleted) && (
                        <>
                          {isEditing ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSave();
                                }}
                                className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors cursor-pointer"
                                title="Save (Enter)"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingQuote(null);
                                  setEditData({});
                                }}
                                className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
                                title="Cancel (Esc)"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditingQuote(quote);
                                }}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              {!showCompleted && status === 'priced' && onMarkCompleted && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onMarkCompleted(quote.id);
                                  }}
                                  className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors cursor-pointer"
                                  title="Mark as Completed"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              )}
                              {status === 'completed' && onMarkAsOrdered && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkAsOrder(quote.id);
                                  }}
                                  className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors cursor-pointer"
                                  title="Mark as Order"
                                >
                                  <ShoppingCart className="h-4 w-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteWithConfirm(quote.id);
                                }}
                                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-6 py-4 bg-gray-50">
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    {/* Tax Invoice Number for Ordered Quotes */}
                    {quote.status === 'ordered' && quote.taxInvoiceNumber && (
                      <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                              <ShoppingCart className="h-3 w-3 text-purple-600" />
                            </div>
                            <span className="text-sm font-medium text-purple-800">Tax Invoice Number</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono text-purple-900 bg-purple-100 px-2 py-1 rounded">
                              {quote.taxInvoiceNumber}
                            </span>
                            <button
                              onClick={() => copyToClipboard(quote.taxInvoiceNumber || '')}
                              className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded transition-colors cursor-pointer"
                              title="Copy tax invoice number"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                          <Eye className="h-4 w-4" />
                          <span>Parts Details ({quoteParts.length})</span>
                        </h4>
                        {quoteParts.length === 0 && (
                          <span className="text-sm text-gray-500">No parts linked to this quote</span>
                        )}
                        {quoteParts.length > 0 && !editingParts.size && quote.status !== 'completed' && (
                          <button
                            onClick={() => startEditingParts(quoteParts)}
                            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors cursor-pointer flex items-center space-x-1"
                            title="Edit all parts in this quote"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Edit All Parts</span>
                          </button>
                        )}
                        {editingParts.size > 0 && (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleSave()}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer flex items-center space-x-1"
                              title="Save all part changes"
                            >
                              <Save className="h-3 w-3" />
                              <span>Save All</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingParts(new Set());
                                setPartsEditData({});
                              }}
                              className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors cursor-pointer flex items-center space-x-1"
                              title="Cancel editing and discard changes"
                            >
                              <X className="h-3 w-3" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {quoteParts.length > 0 && (
                        <div className="grid gap-3">
                          {quoteParts.map((part) => {
                            const isPartEditing = editingParts.has(part.id);
                            
                            return (
                              <div key={part.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-500 mb-1">Part Name</label>
                                      {isPartEditing ? (
                                        <input
                                          type="text"
                                          value={partsEditData[part.id]?.name || ''}
                                          onChange={(e) => handlePartEditChange(part.id, 'name', e.target.value)}
                                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                          autoFocus
                                        />
                                      ) : (
                                        <span className="text-sm font-medium text-gray-900">{part.name}</span>
                                      )}
                                    </div>
                                    
                                    <div>
                                      <label className="block text-xs font-medium text-gray-500 mb-1">Part Number</label>
                                      <div className="flex items-center space-x-1">
                                        {isPartEditing ? (
                                          <input
                                            type="text"
                                            value={partsEditData[part.id]?.number || ''}
                                            onChange={(e) => handlePartEditChange(part.id, 'number', e.target.value)}
                                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                          />
                                        ) : (
                                          <>
                                            <span className="text-sm text-gray-600 font-mono">{part.number || '-'}</span>
                                            <button
                                              onClick={() => copyToClipboard(part.number || '')}
                                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                              title="Copy to clipboard"
                                            >
                                              <Copy className="h-3 w-3" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center space-x-1">
                                        <span>Price</span>
                                      </label>
                                      <div className="flex items-center space-x-1">
                                        {isPartEditing ? (
                                          <input
                                            type="number"
                                            value={partsEditData[part.id]?.price || ''}
                                            onChange={(e) => handlePartEditChange(part.id, 'price', e.target.value ? Number(e.target.value) : null)}
                                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                          />
                                        ) : (
                                          <>
                                            <span className="text-sm font-medium text-gray-900">
                                              {part.price ? `$${part.price.toFixed(2)}` : '-'}
                                            </span>
                                            <button
                                              onClick={() => copyToClipboard(part.price ? part.price.toString() : '')}
                                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                              title="Copy to clipboard"
                                            >
                                              <Copy className="h-3 w-3" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                                      <div className="flex items-center space-x-1">
                                        {isPartEditing ? (
                                          <input
                                            type="text"
                                            value={partsEditData[part.id]?.note || ''}
                                            onChange={(e) => handlePartEditChange(part.id, 'note', e.target.value)}
                                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                          />
                                        ) : (
                                          <>
                                            <span className="text-sm text-gray-600">{part.note || '-'}</span>
                                            <button
                                              onClick={() => copyToClipboard(part.note || '')}
                                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                              title="Copy to clipboard"
                                            >
                                              <Copy className="h-3 w-3" />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        
        {filteredQuotes.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes found</h3>
            <p className="text-gray-500">Try adjusting your search terms or create a new quote.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={cancelDelete}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 transform transition-all">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Quote</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this quote? This will permanently remove the quote and all associated parts.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Delete Quote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmation Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={cancelOrder}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 transform transition-all max-h-[90vh] overflow-y-auto">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Mark as Order</h3>
                <p className="text-sm text-gray-500">Convert quote to order</p>
              </div>
            </div>
            
            {/* Tax Invoice Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Invoice Number *
              </label>
              <input
                type="text"
                value={taxInvoiceNumber}
                onChange={(e) => setTaxInvoiceNumber(e.target.value)}
                placeholder="Enter tax invoice number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              />
            </div>
            
            {/* Parts Selection */}
            {(() => {
              const quote = quotes.find(q => q.id === showOrderModal);
              if (!quote) return null;
              const quoteParts = getQuoteParts(quote.partRequested);
              
              return (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Parts to Order *
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {quoteParts.map((part) => (
                      <label key={part.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPartsForOrder.has(part.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedPartsForOrder);
                            if (e.target.checked) {
                              newSelected.add(part.id);
                            } else {
                              newSelected.delete(part.id);
                            }
                            setSelectedPartsForOrder(newSelected);
                          }}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{part.name}</div>
                          <div className="text-sm text-gray-500">
                            {part.number} • ${part.price || 0}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Selected {selectedPartsForOrder.size} of {quoteParts.length} parts
                  </p>
                </div>
              );
            })()}
           
            <div className="flex space-x-3">
              <button
                onClick={cancelOrder}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmOrder(showOrderModal)}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Mark as Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
