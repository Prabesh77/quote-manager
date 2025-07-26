'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Edit, Trash2, Save, X, Search, Eye, Copy, Car, CheckCircle } from 'lucide-react';
import { Quote, Part } from './useQuotes';

interface QuoteTableProps {
  quotes: Quote[];
  parts: Part[];
  onUpdateQuote: (id: string, fields: Record<string, any>) => Promise<{ error: any }>;
  onDeleteQuote: (id: string) => Promise<{ error: any }>;
  onUpdatePart: (id: string, updates: Partial<Part>) => Promise<{ data: any; error: any }>;
  onUpdateMultipleParts: (updates: Array<{ id: string; updates: Partial<Part> }>) => Promise<void>;
  onMarkCompleted?: (id: string) => Promise<{ error: any }>;
  showCompleted?: boolean;
}

type QuoteStatus = 'unpriced' | 'priced' | 'completed';
type FilterType = 'all' | 'unpriced' | 'priced' | 'completed';

export default function QuoteTable({ quotes, parts, onUpdateQuote, onDeleteQuote, onUpdatePart, onUpdateMultipleParts, onMarkCompleted, showCompleted = false }: QuoteTableProps) {
  const [expandedQuotes, setExpandedQuotes] = useState<Set<string>>(new Set());
  const [editingQuote, setEditingQuote] = useState<string | null>(null);
  const [editingParts, setEditingParts] = useState<Set<string>>(new Set());
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [partsEditData, setPartsEditData] = useState<Record<string, Record<string, any>>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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

  const toggleExpanded = (quoteId: string) => {
    const newExpanded = new Set(expandedQuotes);
    if (newExpanded.has(quoteId)) {
      newExpanded.delete(quoteId);
    } else {
      newExpanded.add(quoteId);
    }
    setExpandedQuotes(newExpanded);
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
    if (quoteStatus === 'completed') return 'completed';
    if (quoteParts.length === 0) return 'unpriced';
    const hasPricedParts = quoteParts.some(part => part.price && part.price > 0);
    return hasPricedParts ? 'priced' : 'unpriced';
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
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
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

      {/* Quotes Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12"></th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Quote Ref</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">VIN</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Vehicle</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Parts</th>
                {!showCompleted && (
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredQuotes.map((quote) => {
                const quoteParts = getQuoteParts(quote.partRequested);
                const isExpanded = expandedQuotes.has(quote.id);
                const isEditing = editingQuote === quote.id;
                const status = getQuoteStatus(quoteParts, quote.status);

                return (
                  <React.Fragment key={quote.id}>
                    <tr 
                      className={`hover:bg-gray-50 transition-all duration-200 cursor-pointer ${
                        selectedQuote === quote.id ? 'bg-red-50 border-l-4 border-l-red-500' : ''
                      }`}
                      onClick={(e) => {
                        // Don't expand if clicking on action buttons
                        if ((e.target as HTMLElement).closest('.action-buttons')) {
                          return;
                        }
                        toggleExpanded(quote.id);
                        setSelectedQuote(quote.id);
                      }}
                    >
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpanded(quote.id);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                          ) : (
                            <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.quoteRef || ''}
                            onChange={(e) => handleQuoteEditChange('quoteRef', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-gray-900">{quote.quoteRef}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(quote.quoteRef || '');
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                              title="Copy quote ref"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.vin || ''}
                            onChange={(e) => handleQuoteEditChange('vin', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
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
                                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                title="Copy VIN"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editData.make || ''}
                              onChange={(e) => handleQuoteEditChange('make', e.target.value)}
                              placeholder="Make"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                            />
                            <input
                              type="text"
                              value={editData.model || ''}
                              onChange={(e) => handleQuoteEditChange('model', e.target.value)}
                              placeholder="Model"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{getVehicleLogo(quote.make)}</span>
                            <div>
                              <div className="font-medium text-gray-900">{quote.make} {quote.model}</div>
                              <div className="text-sm text-gray-500">{quote.series} • {quote.auto ? 'Auto' : 'Manual'}</div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          status === 'priced' 
                            ? 'bg-green-100 text-green-800' 
                            : status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {status === 'priced' ? 'Priced' : status === 'completed' ? 'Completed' : 'Waiting for Price'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {quoteParts.length} parts
                        </span>
                      </td>
                      <td className="px-6 py-4 action-buttons">
                        {quote.status !== 'completed' && (
                          <div className="flex items-center space-x-1">
                            {isEditing ? (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSave();
                                  }}
                                  className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
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
                                  className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
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
                                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
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
                                    className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                                    title="Mark as Completed"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteWithConfirm(quote.id);
                                  }}
                                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                    
                    {/* Expanded Content */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={showCompleted ? 6 : 7} className="px-6 py-4 bg-gray-50">
                          <div className="animate-in slide-in-from-top-2 duration-300">
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
                                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center space-x-1"
                                  >
                                    <Edit className="h-3 w-3" />
                                    <span>Edit All Parts</span>
                                  </button>
                                )}
                                {editingParts.size > 0 && (
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={() => handleSave()}
                                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center space-x-1"
                                    >
                                      <Save className="h-3 w-3" />
                                      <span>Save All</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingParts(new Set());
                                        setPartsEditData({});
                                      }}
                                      className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors flex items-center space-x-1"
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
                                                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
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
                                                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
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
                                                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
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
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Confirm Deletion</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to delete this quote?</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(showDeleteConfirm)}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 