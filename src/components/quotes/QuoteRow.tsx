'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit, Trash2, Save, X, Copy, CheckCircle, ShoppingCart, Check, Package } from 'lucide-react';
import { Quote } from '@/types/quote';
import { Part } from '@/types/part';
import { QuoteStatusChip, QuoteDeadlineIndicator } from './index';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface QuoteRowProps {
  quote: Quote;
  quoteParts: Part[];
  isEditing: boolean;
  isEditingParts: boolean;
  editData: Record<string, any>;
  partEditData: Record<string, any>;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onMarkCompleted?: () => void;
  onMarkAsOrdered?: () => void;
  onVerifyPrice?: () => void;
  onQuoteEditChange: (field: string, value: string | number | boolean) => void;
  onPartEditChange: (partId: string, field: string, value: string | number | null) => void;
  onStartEditingParts: () => void;
  onSaveParts: () => void;
  onCancelParts: () => void;
  status: string;
  showCompleted?: boolean;
  showVerifyAction?: boolean;
  copyToClipboard: (text: string) => void;
  getVehicleLogo: (make: string) => string;
  getPartIcon: (partName: string) => string | null;
}

export const QuoteRow = ({
  quote,
  quoteParts,
  isEditing,
  isEditingParts,
  editData,
  partEditData,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onMarkCompleted,
  onMarkAsOrdered,
  onVerifyPrice,
  onQuoteEditChange,
  onPartEditChange,
  onStartEditingParts,
  onSaveParts,
  onCancelParts,
  status,
  showCompleted = false,
  showVerifyAction = false,
  copyToClipboard,
  getVehicleLogo,
  getPartIcon
}: QuoteRowProps) => {
  return (
    <AccordionItem value={quote.id} className="border-b border-gray-100 last:border-b-0 relative">
      {/* Deadline Indicator - Only for unpriced and priced quotes */}
      {quote.status !== 'completed' && quote.status !== 'ordered' && quote.status !== 'delivered' && (
        <QuoteDeadlineIndicator requiredBy={quote.requiredBy} customer={quote.customer} />
      )}
      
      <AccordionTrigger className="grid grid-cols-6 gap-4 w-full px-3 hover:bg-gray-50 transition-colors cursor-pointer" style={{ gridTemplateColumns: '1fr 1fr 2fr 1fr 0.5fr 0.5fr' }}>
        {/* Quote Ref */}
        <div>
          <div className="flex items-center space-x-2 w-[160px]">
            <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
            {isEditing ? (
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
                  className="p-0.5 text-purple-600 hover:text-purple-700 hover:bg-purple-200 rounded transition-colors cursor-pointer"
                  title="Copy tax invoice number"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* VIN */}
        <div className="flex items-center space-x-2">
          {isEditing ? (
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
              <span className="font-mono text-sm text-gray-900">{quote.vin || '-'}</span>
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
              src={getVehicleLogo(isEditing ? (editData.make || quote.make) : quote.make)} 
              alt={isEditing ? (editData.make || quote.make) : quote.make} 
              className="h-8 w-8 object-contain" 
            />
          </span>
          {isEditing ? (
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
            <QuoteStatusChip status={status as any} />
          </div>
        </div>

        {/* Parts Count */}
        <div className="flex items-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {quoteParts.length} {quoteParts.length === 1 ? 'part' : 'parts'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {(quote.status !== 'completed' || showCompleted) && (
            <>
              {isEditing ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSave();
                  }}
                  className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors cursor-pointer"
                  title="Save changes"
                >
                  <Save className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                  title="Edit quote"
                >
                  <Edit className="h-4 w-4" />
                </button>
              )}
              
              {isEditing ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel();
                  }}
                  className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                  title="Cancel editing"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors cursor-pointer"
                  title="Delete quote"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              
              {status === 'waiting_verification' && showVerifyAction && onVerifyPrice && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onVerifyPrice();
                  }}
                  className="p-1.5 bg-green-500 hover:bg-green-600 rounded-full transition-colors cursor-pointer"
                  title="Verify and approve price"
                >
                  <Check className="h-5 w-5 text-white" />
                </button>
              )}
              
              {status === 'priced' && onMarkCompleted && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkCompleted();
                  }}
                  className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors cursor-pointer"
                  title="Mark as completed"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
              )}
              
              {status === 'completed' && onMarkAsOrdered && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsOrdered();
                  }}
                  className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded transition-colors cursor-pointer"
                  title="Mark as order"
                >
                  <ShoppingCart className="h-4 w-4" />
                </button>
              )}
            </>
          )}
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-6 py-4 bg-gray-50">
        <div className="animate-in slide-in-from-top-2 duration-300">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Parts Details ({quoteParts.length})</span>
              </h4>
              {quoteParts.length === 0 && (
                <span className="text-sm text-gray-500">No parts linked to this quote</span>
              )}
              {quoteParts.length > 0 && !isEditingParts && quote.status !== 'completed' && (
                <button
                  onClick={onStartEditingParts}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors cursor-pointer flex items-center space-x-1"
                  title="Edit all parts in this quote"
                >
                  <Edit className="h-3 w-3" />
                  <span>Edit Parts</span>
                </button>
              )}
              {isEditingParts && (
                <div className="flex space-x-1">
                  <button
                    onClick={onSaveParts}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer flex items-center space-x-1"
                    title="Save all part changes"
                  >
                    <Save className="h-3 w-3" />
                    <span>Save All</span>
                  </button>
                  <button
                    onClick={onCancelParts}
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
                                    {isEditingParts ? (
                                      <input
                                        type="text"
                                        value={partEditData[part.id]?.name || part.name}
                                        onChange={(e) => onPartEditChange(part.id, 'name', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                        autoFocus
                                      />
                                    ) : (
                                      <span className="text-sm font-medium text-gray-900">{part.name}</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-1">
                                  {isEditingParts ? (
                                    <input
                                      type="text"
                                      value={partEditData[part.id]?.number || part.number || ''}
                                      onChange={(e) => onPartEditChange(part.id, 'number', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                    />
                                  ) : (
                                    <span className="text-sm text-gray-600">{part.number || '-'}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-1">
                                  {isEditingParts ? (
                                    <input
                                      type="number"
                                      value={partEditData[part.id]?.price !== undefined ? partEditData[part.id].price : part.price || ''}
                                      onChange={(e) => onPartEditChange(part.id, 'price', e.target.value ? parseFloat(e.target.value) : null)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                      placeholder="0.00"
                                    />
                                  ) : (
                                    <span className="text-sm font-medium text-green-600">
                                      {part.price ? `$${part.price.toFixed(2)}` : '-'}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-1">
                                  {isEditingParts ? (
                                    <input
                                      type="text"
                                      value={partEditData[part.id]?.note || part.note || ''}
                                      onChange={(e) => onPartEditChange(part.id, 'note', e.target.value)}
                                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                      placeholder="Notes"
                                    />
                                  ) : (
                                    <span className="text-sm text-gray-600">{part.note || '-'}</span>
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

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-3">
                  {quoteParts.map((part) => (
                    <div key={part.id} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        {getPartIcon(part.name) && (
                          <div className="bg-white rounded-full p-1 shadow-sm border border-gray-200">
                            <img src={getPartIcon(part.name)!} alt={part.name} className="h-6 w-6 object-contain" />
                          </div>
                        )}
                        <div className="flex-1">
                          {isEditingParts ? (
                            <input
                              type="text"
                              value={partEditData[part.id]?.name || part.name}
                              onChange={(e) => onPartEditChange(part.id, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                            />
                          ) : (
                            <h5 className="text-sm font-medium text-gray-900">{part.name}</h5>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Part Number</label>
                          {isEditingParts ? (
                            <input
                              type="text"
                              value={partEditData[part.id]?.number || part.number || ''}
                              onChange={(e) => onPartEditChange(part.id, 'number', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                            />
                          ) : (
                            <span className="text-sm text-gray-600">{part.number || '-'}</span>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
                          {isEditingParts ? (
                            <input
                              type="number"
                              value={partEditData[part.id]?.price !== undefined ? partEditData[part.id].price : part.price || ''}
                              onChange={(e) => onPartEditChange(part.id, 'price', e.target.value ? parseFloat(e.target.value) : null)}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                              placeholder="0.00"
                            />
                          ) : (
                            <span className="text-sm font-medium text-green-600">
                              {part.price ? `$${part.price.toFixed(2)}` : '-'}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                        {isEditingParts ? (
                          <input
                            type="text"
                            value={partEditData[part.id]?.note || part.note || ''}
                            onChange={(e) => onPartEditChange(part.id, 'note', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                            placeholder="Notes"
                          />
                        ) : (
                          <span className="text-sm text-gray-600">{part.note || '-'}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}; 