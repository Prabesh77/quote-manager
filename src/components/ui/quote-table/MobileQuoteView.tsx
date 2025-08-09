import React from 'react';
import { ChevronDown, Copy, Edit3, Trash2, CheckCircle, ShoppingCart, Save, X, Edit, Eye, AlertTriangle, Package } from 'lucide-react';
import { Quote, Part } from '../useQuotes';
import { QuoteStatus } from './types';
import { StatusChip, DeadlineIndicator, VerifyButton } from './StatusComponents';
import { getVehicleLogo, getPartIcon, copyToClipboard, formatCurrency, getQuoteStatus } from './utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface MobileQuoteViewProps {
  filteredQuotes: Quote[];
  quotePartsWithNotes: Record<string, Part[]>;
  editingParts: string | null;
  partEditData: Record<string, Record<string, any>>;
  showCompleted: boolean;
  onEditQuote: (quote: Quote) => void;
  onStartEditingParts: (quoteParts: Part[], quoteId: string) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onPartEditChange: (partId: string, field: string, value: string | number | null) => void;
  onDeleteWithConfirm: (quoteId: string) => void;
  onMarkAsOrder: (quoteId: string) => void;
  onVerifyQuote: (quoteId: string) => Promise<void>;
  onMarkCompleted?: (id: string) => Promise<{ error: Error | null }>;
  onMarkAsOrdered?: (id: string, taxInvoiceNumber: string) => Promise<{ error: Error | null }>;
  onMarkAsOrderedWithParts?: (id: string, taxInvoiceNumber: string, partIds: string[]) => Promise<{ error: Error | null }>;
  defaultFilter: string;
}

export const MobileQuoteView: React.FC<MobileQuoteViewProps> = ({
  filteredQuotes,
  quotePartsWithNotes,
  editingParts,
  partEditData,
  showCompleted,
  onEditQuote,
  onStartEditingParts,
  onSave,
  onCancelEdit,
  onPartEditChange,
  onDeleteWithConfirm,
  onMarkAsOrder,
  onVerifyQuote,
  onMarkCompleted,
  onMarkAsOrdered,
  onMarkAsOrderedWithParts,
  defaultFilter
}) => {
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

  if (filteredQuotes.length === 0) {
    return (
      <div className="lg:hidden space-y-4 p-1">
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No quotes found</h3>
          <p className="text-gray-600 text-center max-w-md mb-6">
            {defaultFilter === 'unpriced' ? 'No quotes are waiting for pricing at the moment.' :
             defaultFilter === 'priced' ? 'No quotes have been priced yet.' :
             showCompleted ? 'No quotes have been completed yet.' :
             'Get started by adding your first quote to track parts and pricing.'}
          </p>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Ready to get started</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:hidden space-y-4 p-1">
      <Accordion type="multiple" className="w-full">
        {filteredQuotes.map((quote) => {
          const quoteParts = quotePartsWithNotes[quote.id] || [];
          const status = getQuoteStatus(quoteParts, quote.status);

          return (
            <AccordionItem key={quote.id} value={quote.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <AccordionTrigger className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="grid grid-rows-2 gap-3 w-full">
                  {/* Row 1: Quote Ref VIN Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="flex items-center space-x-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-500">Quote Ref</span>
                          <span className="font-semibold text-gray-900">{quote.quoteRef}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(quote.quoteRef || '');
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                          title="Copy quote ref"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-500">VIN</span>
                          <span className="text-sm font-mono text-gray-900">{quote.vin || '-'}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(quote.vin || '');
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                          title="Copy VIN"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      {getStatusChip(status)}
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {quoteParts.length} {quoteParts.length === 1 ? 'part' : 'parts'}
                      </span>
                      {quote.customer && (
                        <span className="text-[10px] text-orange-600 font-medium">
                          {quote.customer}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Row 2: Vehicle Info Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        <img 
                          src={getVehicleLogo(quote.make)}
                          alt={quote.make} 
                          className="h-8 w-8 object-contain" 
                        />
                      </span>
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">{quote.make} - {quote.model}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <span>{quote.mthyr || '-'}</span>
                          {quote.series && (
                            <>
                              <span>•</span>
                              <span>{quote.series}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-600">
                          <span>{quote.body || '-'}</span>
                          {quote.auto !== undefined && (
                            <>
                              <span>•</span>
                              <span>{quote.auto ? 'Auto' : 'Manual'}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons for Mobile */}
                    {(quote.status !== 'completed' || showCompleted) && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditQuote(quote);
                          }}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                          title="Edit quote"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteWithConfirm(quote.id);
                          }}
                          className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors cursor-pointer"
                          title="Delete quote"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        
                        {/* Confirmation button for waiting_verification status */}
                        {status === 'waiting_verification' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onVerifyQuote(quote.id);
                            }}
                            className="p-1 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors cursor-pointer"
                            title="Confirm pricing and move to priced status"
                          >
                            <CheckCircle className="h-5 w-5 font-bold" />
                          </button>
                        )}
                        
                        {status === 'priced' && onMarkCompleted && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkCompleted(quote.id);
                            }}
                            className="p-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors cursor-pointer"
                            title="Mark as completed"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        
                        {status === 'completed' && (onMarkAsOrdered || onMarkAsOrderedWithParts) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkAsOrder(quote.id);
                            }}
                            className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded transition-colors cursor-pointer"
                            title="Mark as order"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  {quote.status === 'ordered' && quote.taxInvoiceNumber && (
                    <div className="flex items-center justify-between p-2 bg-purple-50 border border-purple-200 rounded">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-purple-700">Tax Invoice:</span>
                        <span className="text-xs font-mono text-purple-900">{quote.taxInvoiceNumber}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(quote.taxInvoiceNumber || '');
                        }}
                        className="text-purple-600 hover:text-purple-700 transition-colors"
                        title="Copy tax invoice number"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {/* Parts Section */}
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
                        {quoteParts.length > 0 && editingParts !== quote.id && quote.status !== 'completed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartEditingParts(quoteParts, quote.id);
                            }}
                            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors cursor-pointer flex items-center space-x-1"
                            title="Edit all parts in this quote"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Edit Parts</span>
                          </button>
                        )}
                        {editingParts === quote.id && (
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSave();
                              }}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer flex items-center space-x-1"
                              title="Save all part changes"
                            >
                              <Save className="h-3 w-3" />
                              <span>Save All</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onCancelEdit();
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
                        <div className="space-y-3">
                          {quoteParts.map((part) => {
                            const isPartEditing = editingParts === quote.id;
                            
                            return (
                              <div key={part.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                                <div className="relative">
                                  {getPartIcon(part.name) && (
                                    <div className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-sm border border-gray-200">
                                      <img src={getPartIcon(part.name)!} alt={part.name} className="h-7 w-7 object-contain" />
                                    </div>
                                  )}
                                  <div className="space-y-3 pr-12">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Part Name</label>
                                        {isPartEditing ? (
                                          <input
                                            type="text"
                                            value={partEditData[part.id]?.name || ''}
                                            onChange={(e) => onPartEditChange(part.id, 'name', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
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
                                              value={partEditData[part.id]?.number || ''}
                                              onChange={(e) => onPartEditChange(part.id, 'number', e.target.value)}
                                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
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
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
                                        <div className="flex items-center space-x-1">
                                          {isPartEditing ? (
                                            <input
                                              type="number"
                                              value={partEditData[part.id]?.price || ''}
                                              onChange={(e) => onPartEditChange(part.id, 'price', e.target.value ? Number(e.target.value) : null)}
                                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                              autoFocus
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
                                              value={partEditData[part.id]?.note || ''}
                                              onChange={(e) => onPartEditChange(part.id, 'note', e.target.value)}
                                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
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
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <DeadlineIndicator requiredBy={quote.requiredBy} />
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}; 