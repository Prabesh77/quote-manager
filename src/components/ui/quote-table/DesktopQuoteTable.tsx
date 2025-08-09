import React from 'react';
import { ChevronDown, Edit, Trash2, Save, X, Copy, CheckCircle, ShoppingCart, Edit3, AlertTriangle, Eye, Package } from 'lucide-react';
import { Quote, Part } from '../useQuotes';
import { QuoteStatus } from './types';
import { StatusChip, DeadlineIndicator, VerifyButton } from './StatusComponents';
import { getVehicleLogo, getPartIcon, copyToClipboard, formatCurrency, getQuoteStatus } from './utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface DesktopQuoteTableProps {
  filteredQuotes: Quote[];
  quotePartsWithNotes: Record<string, Part[]>;
  expandedRows: Set<string>;
  editingQuote: string | null;
  editingParts: string | null;
  editData: Record<string, any>;
  partEditData: Record<string, Record<string, any>>;
  showCompleted: boolean;
  onToggleExpand: (quoteId: string) => void;
  onEditQuote: (quote: Quote) => void;
  onStartEditingQuote: (quote: Quote) => void;
  onStartEditingParts: (quoteParts: Part[], quoteId: string) => void;
  onSave: () => void;
  onCancelEdit: () => void;
  onQuoteEditChange: (field: string, value: string | number | boolean) => void;
  onPartEditChange: (partId: string, field: string, value: string | number | null) => void;
  onDeleteWithConfirm: (quoteId: string) => void;
  onMarkAsOrder: (quoteId: string) => void;
  onVerifyQuote: (quoteId: string) => Promise<void>;
  onMarkCompleted?: (id: string) => Promise<{ error: Error | null }>;
  onMarkAsOrdered?: (id: string, taxInvoiceNumber: string) => Promise<{ error: Error | null }>;
  onMarkAsOrderedWithParts?: (id: string, taxInvoiceNumber: string, partIds: string[]) => Promise<{ error: Error | null }>;
  defaultFilter?: string;
}

export const DesktopQuoteTable: React.FC<DesktopQuoteTableProps> = ({
  filteredQuotes,
  quotePartsWithNotes,
  expandedRows,
  editingQuote,
  editingParts,
  editData,
  partEditData,
  showCompleted,
  onToggleExpand,
  onEditQuote,
  onStartEditingQuote,
  onStartEditingParts,
  onSave,
  onCancelEdit,
  onQuoteEditChange,
  onPartEditChange,
  onDeleteWithConfirm,
  onMarkAsOrder,
  onVerifyQuote,
  onMarkCompleted,
  onMarkAsOrdered,
  onMarkAsOrderedWithParts,
  defaultFilter = 'all'
}) => {
  const brandRed = '#d0202d';

  const getDeadlineIndicator = (requiredBy: string | undefined) => {
    if (!requiredBy) return null;
    
    const deadline = new Date(requiredBy);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return {
        color: 'bg-red-500',
        timeDisplay: `${Math.abs(diffDays)}d overdue`,
        animation: ''
      };
    } else if (diffDays === 0) {
      return {
        color: 'bg-red-500',
        timeDisplay: 'Due today',
        animation: ''
      };
    } else if (diffDays === 1) {
      return {
        color: 'bg-yellow-500',
        timeDisplay: 'Due tomorrow',
        animation: ''
      };
    } else if (diffDays <= 3) {
      return {
        color: 'bg-yellow-500',
        timeDisplay: `${diffDays}d left`,
        animation: ''
      };
    } else if (diffDays <= 7) {
      return {
        color: 'bg-blue-500',
        timeDisplay: `${diffDays}d left`,
        animation: ''
      };
    }
    return null;
  };

  const getStatusChip = (status: QuoteStatus) => {
    switch (status) {
      case 'unpriced':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Waiting for Price
          </span>
        );
      case 'waiting_verification':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Waiting for Verification
          </span>
        );
      case 'priced':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Priced
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Completed
          </span>
        );
      case 'ordered':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Ordered
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            Delivered
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (filteredQuotes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hidden lg:block relative">
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-8">
            <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">No quotes found</h3>
          <p className="text-gray-600 text-center max-w-lg mb-8 text-lg">
            {defaultFilter === 'unpriced' ? 'No quotes are waiting for pricing at the moment.' :
             defaultFilter === 'priced' ? 'No quotes have been priced yet.' :
             showCompleted ? 'No quotes have been completed yet.' :
             'Get started by adding your first quote to track parts and pricing.'}
          </p>
          <div className="flex items-center space-x-3 text-base text-gray-500">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Ready to get started</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hidden lg:block relative">
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
        {filteredQuotes.map((quote) => {
          const quoteParts = quotePartsWithNotes[quote.id] || [];
          const status = getQuoteStatus(quoteParts, quote.status);

          return (
            <AccordionItem key={quote.id} value={quote.id} className="border-b border-gray-100 last:border-b-0 relative">
              {/* Deadline Indicator - Only for unpriced and priced quotes */}
              {quote.status !== 'completed' && quote.status !== 'ordered' && quote.status !== 'delivered' && (() => {
                const deadlineInfo = getDeadlineIndicator(quote.requiredBy);
                if (!deadlineInfo) return null;
                
                return (
                  <>
                    {/* Desktop: Full left border and indicator */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${deadlineInfo.color} hidden sm:block`}></div>
                    <div className="absolute left-0 top-[11px] transform -translate-y-1/2 z-10 flex items-center space-x-2 hidden sm:flex">
                      <div className={`px-2 py-[2px] text-[12px] font-semibold text-white shadow-sm ${deadlineInfo.color} relative`}>
                        {deadlineInfo.timeDisplay}
                        {/* Small ping circle in top-right corner */}
                        {deadlineInfo.animation === '' && (deadlineInfo.color === 'bg-red-500' || deadlineInfo.color === 'bg-yellow-500') && (
                          <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-300 rounded-full animate-ping shadow-lg border border-red-600"></div>
                        )}
                      </div>
                      {quote.customer && (
                        <div className="px-2 py-[2px] text-[10px] text-orange-600 font-medium rounded shadow-sm">
                          {quote.customer}
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
              
              <AccordionTrigger className="grid grid-cols-6 gap-4 w-full px-3 hover:bg-gray-50 transition-colors cursor-pointer" style={{ gridTemplateColumns: '1fr 1fr 2fr 1fr 0.5fr 0.5fr' }}>
                {/* Quote Ref */}
                <div>
                  <div className="flex items-center space-x-2 w-[160px]">
                    <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    {editingQuote === quote.id ? (
                      <input
                        type="text"
                        value={editData.quoteRef || quote.quoteRef || ''}
                        onChange={(e) => onQuoteEditChange('quoteRef', e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <span className="font-medium text-gray-900">{quote.quoteRef}</span>
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
                      </>
                    )}
                  </div>
                  {/* Tax Invoice Number for Ordered Quotes - Main Row Display */}
                  {quote.status === 'ordered' && quote.taxInvoiceNumber && (
                    <div className="flex items-center space-x-1 border-t border-gray-100 pt-1">
                      <div className="flex items-center space-x-1 px-2 py-1 bg-purple-100 border border-purple-200 rounded text-xs">
                        <span className="text-purple-800 font-medium text-xs">Invoice:</span>
                        <span className="text-purple-900 font-mono text-[14px]">{quote.taxInvoiceNumber}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(quote.taxInvoiceNumber || '');
                          }}
                          className="text-purple-600 hover:text-purple-700 transition-colors cursor-pointer"
                          title="Copy tax invoice number"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* VIN */}
                <div className="flex items-center space-x-2">
                  {editingQuote === quote.id ? (
                    <input
                      type="text"
                      value={editData.vin || quote.vin || ''}
                      onChange={(e) => onQuoteEditChange('vin', e.target.value)}
                      className="px-2 py-1 text-sm font-mono border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Enter VIN"
                    />
                  ) : (
                    <>
                      <span className="text-sm text-gray-600 font-mono">{quote.vin || '-'}</span>
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
                    </>
                  )}
                </div>

                {/* Vehicle */}
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    <img 
                      src={getVehicleLogo(editingQuote === quote.id ? (editData.make || quote.make) : quote.make)}
                      alt={editingQuote === quote.id ? (editData.make || quote.make) : quote.make} 
                      className="h-8 w-8 object-contain" 
                    />
                  </span>
                  {editingQuote === quote.id ? (
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="flex flex-col space-y-1 flex-1">
                          <label className="text-xs text-gray-500 font-medium">Make</label>
                          <input
                            type="text"
                            value={editData.make || quote.make || ''}
                            onChange={(e) => onQuoteEditChange('make', e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Make"
                          />
                        </div>
                        <div className="flex flex-col space-y-1 flex-1">
                          <label className="text-xs text-gray-500 font-medium">Model</label>
                          <input
                            type="text"
                            value={editData.model || quote.model || ''}
                            onChange={(e) => onQuoteEditChange('model', e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Model"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex flex-col space-y-1 flex-1">
                          <label className="text-xs text-gray-500 font-medium">Year</label>
                          <input
                            type="text"
                            value={editData.mthyr || quote.mthyr || ''}
                            onChange={(e) => onQuoteEditChange('mthyr', e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onClick={(e) => e.stopPropagation()}
                            placeholder="e.g. 9/2017"
                          />
                        </div>
                        <div className="flex flex-col space-y-1 flex-1">
                          <label className="text-xs text-gray-500 font-medium">Series</label>
                          <input
                            type="text"
                            value={editData.series || quote.series || ''}
                            onChange={(e) => onQuoteEditChange('series', e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onClick={(e) => e.stopPropagation()}
                            placeholder="Series"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex flex-col space-y-1 flex-1">
                          <label className="text-xs text-gray-500 font-medium">Body</label>
                          <input
                            type="text"
                            value={editData.body || quote.body || ''}
                            onChange={(e) => onQuoteEditChange('body', e.target.value)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onClick={(e) => e.stopPropagation()}
                            placeholder="e.g. 5 Door Hatchback"
                          />
                        </div>
                        <div className="flex flex-col space-y-1 flex-1">
                          <label className="text-xs text-gray-500 font-medium">Transmission</label>
                          <select
                            value={editData.auto !== undefined ? editData.auto.toString() : quote.auto.toString()}
                            onChange={(e) => onQuoteEditChange('auto', e.target.value === 'true')}
                            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="true">Auto</option>
                            <option value="false">Manual</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{quote.make} • {quote.model}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-600">
                        <span>{quote.mthyr || '-'}</span>
                        {quote.series && (
                          <>
                            <span>•</span>
                            <span>{quote.series}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-gray-600">
                        <span>{quote.body || '-'}</span>
                        {quote.auto !== undefined && (
                          <>
                            <span>•</span>
                            <span>{quote.auto ? 'Auto' : 'Manual'}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div>
                  <div className="flex space-y-1">
                    {(() => {
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
                    })()}
                  </div>
                </div>

                {/* Parts Count */}
                <div className="flex items-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {quoteParts.length} {quoteParts.length === 1 ? 'part' : 'parts'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 justify-end">
                  {editingQuote === quote.id ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSave();
                        }}
                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors cursor-pointer"
                        title="Save changes"
                      >
                        <Save className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelEdit();
                        }}
                        className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                        title="Cancel editing"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditQuote(quote);
                        }}
                        className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors cursor-pointer"
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
                    </>
                  )}
                  
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
              </AccordionTrigger>

              <AccordionContent className="px-6 pb-4">
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
                      <>
                        {/* Desktop Table View */}
                        <div className="hidden lg:block">
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Number</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {quoteParts.map((part) => {
                                  const isPartEditing = editingParts === quote.id;
                                  
                                  return (
                                    <tr key={part.id} className="hover:bg-gray-50">
                                      <td className="px-4 py-3">
                                        <div className="flex items-center space-x-3">
                                          {getPartIcon(part.name) && (
                                            <div className="bg-white rounded-full p-1 shadow-sm border border-gray-200">
                                              <img src={getPartIcon(part.name)!} alt={part.name} className="h-6 w-6 object-contain" />
                                            </div>
                                          )}
                                          <div>
                                            {isPartEditing ? (
                                              <input
                                                type="text"
                                                value={partEditData[part.id]?.name || ''}
                                                onChange={(e) => onPartEditChange(part.id, 'name', e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                              />
                                            ) : (
                                              <span className="text-sm font-medium text-gray-900">{part.name}</span>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center space-x-1">
                                          {isPartEditing ? (
                                            <input
                                              type="text"
                                              value={partEditData[part.id]?.number || ''}
                                              onChange={(e) => onPartEditChange(part.id, 'number', e.target.value)}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
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
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center space-x-1">
                                          {isPartEditing ? (
                                            <input
                                              type="number"
                                              value={partEditData[part.id]?.price || ''}
                                              onChange={(e) => onPartEditChange(part.id, 'price', e.target.value ? Number(e.target.value) : null)}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
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
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="flex items-center space-x-1">
                                          {isPartEditing ? (
                                            <input
                                              type="text"
                                              value={partEditData[part.id]?.note || ''}
                                              onChange={(e) => onPartEditChange(part.id, 'note', e.target.value)}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
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
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}; 