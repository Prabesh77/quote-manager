'use client';

import React, { useState } from 'react';
import { Quote, Part } from './useQuotes';
import { SkeletonLoader } from './SkeletonLoader';
import { QuoteEditModal } from '@/components/quotes/QuoteEditModal';
import { QuoteTableProps } from './quote-table/types';
import { useQuoteTableData } from './quote-table/useQuoteTableData';
import { SearchAndFilter } from './quote-table/SearchAndFilter';
import { DesktopQuoteTable } from './quote-table/DesktopQuoteTable';
import { MobileQuoteView } from './quote-table/MobileQuoteView';
import { DeleteConfirmation, OrderConfirmation } from './quote-table/ConfirmationDialogs';
import supabase from '@/utils/supabase';

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
  showCompleted = false, 
  defaultFilter = 'all', 
  isLoading = false 
}: QuoteTableProps) {
  const {
    state,
    setState,
    filteredQuotes,
    getQuotePartsWithNotes,
    getQuotePartsWithNotesSync,
  } = useQuoteTableData(quotes, parts, defaultFilter);

  // Event handlers
  const handleSave = async () => {
    if (state.editingQuote && state.editData) {
      await onUpdateQuote(state.editingQuote, state.editData);
      setState(prev => ({ 
        ...prev, 
        editingQuote: null, 
        editData: {} 
      }));
    }
    if (state.editingParts) {
      const updates = Object.keys(state.partEditData || {}).map(id => ({
        id,
        updates: state.partEditData![id] || {}
      }));
      
      await onUpdateMultipleParts(updates);
      setState(prev => ({ 
        ...prev, 
        editingParts: null, 
        partEditData: {} 
      }));
    }
  };

  const startEditingQuote = (quote: Quote) => {
    setState(prev => ({
      ...prev,
      editingQuote: quote.id,
      editData: {
        quoteRef: quote.quoteRef,
        vin: quote.vin,
        make: quote.make,
        model: quote.model,
        series: quote.series,
        auto: quote.auto,
        body: quote.body,
        mthyr: quote.mthyr,
        rego: quote.rego,
      }
    }));
  };

  const startEditingParts = (quoteParts: Part[], quoteId: string) => {
    const newPartEditData: Record<string, Record<string, any>> = {};
    quoteParts.forEach(part => {
      newPartEditData[part.id] = {
        name: part.name || '',
        number: part.number || '',
        price: part.price,
        note: part.note || '',
      };
    });
    setState(prev => ({
      ...prev,
      editingParts: quoteId,
      partEditData: newPartEditData
    }));
  };

  const handleQuoteEditChange = (field: string, value: string | number | boolean) => {
    setState(prev => ({
      ...prev,
      editData: { ...prev.editData, [field]: value }
    }));
  };

  const handlePartEditChange = (partId: string, field: string, value: string | number | null) => {
    setState(prev => ({
      ...prev,
      partEditData: {
        ...prev.partEditData,
        [partId]: {
          ...prev.partEditData?.[partId],
          [field]: value
        }
      }
    }));
  };

  const handleVerifyQuote = async (quoteId: string) => {
    try {
      const { error } = await supabase
        .from('quotes')
        .update({ status: 'priced' })
        .eq('id', quoteId);

      if (error) {
        console.error('Error updating quote status:', error);
        return;
      }
    } catch (error) {
      console.error('Error verifying quote:', error);
    }
  };

  const handleDeleteWithConfirm = async (quoteId: string) => {
    setState(prev => ({ ...prev, showDeleteConfirm: quoteId }));
  };

  const confirmDelete = async () => {
    if (state.showDeleteConfirm) {
      await onDeleteQuote(state.showDeleteConfirm);
      setState(prev => ({ ...prev, showDeleteConfirm: null }));
    }
  };

  const cancelDelete = () => {
    setState(prev => ({ ...prev, showDeleteConfirm: null }));
  };

  const handleMarkAsOrder = (quoteId: string) => {
    setState(prev => ({ 
      ...prev, 
      showOrderConfirm: quoteId,
      selectedPartIds: [] 
    }));
  };

  const confirmOrder = async () => {
    if (!state.showOrderConfirm || !state.taxInvoiceNumber?.trim()) return;

    try {
      if (onMarkAsOrderedWithParts && state.selectedPartIds && state.selectedPartIds.length > 0) {
        await onMarkAsOrderedWithParts(state.showOrderConfirm, state.taxInvoiceNumber, state.selectedPartIds);
      } else if (onMarkAsOrdered) {
        await onMarkAsOrdered(state.showOrderConfirm, state.taxInvoiceNumber);
      }
      
      setState(prev => ({ 
        ...prev, 
        showOrderConfirm: null, 
        taxInvoiceNumber: '', 
        selectedPartIds: [] 
      }));
    } catch (error) {
      console.error('Error marking quote as order:', error);
    }
  };

  const cancelOrder = () => {
    setState(prev => ({ 
      ...prev, 
      showOrderConfirm: null, 
      taxInvoiceNumber: '', 
      selectedPartIds: [] 
    }));
  };

  const handleEditQuote = (quote: Quote) => {
    setState(prev => ({
      ...prev,
      selectedQuoteForEdit: quote,
      editModalOpen: true
    }));
  };

  const handleCloseEditModal = () => {
    setState(prev => ({
      ...prev,
      editModalOpen: false,
      selectedQuoteForEdit: null
    }));
  };

  const handleSaveQuoteEdit = async (quoteId: string, updates: Record<string, any>) => {
    await onUpdateQuote(quoteId, updates);
    handleCloseEditModal();
  };

  const handleToggleExpand = (quoteId: string) => {
    setState(prev => {
      const newExpandedRows = new Set(prev.expandedRows);
      if (newExpandedRows.has(quoteId)) {
        newExpandedRows.delete(quoteId);
      } else {
        newExpandedRows.add(quoteId);
      }
      return { ...prev, expandedRows: newExpandedRows };
    });
  };

  const handleCancelEdit = () => {
    setState(prev => ({
      ...prev,
      editingQuote: null,
      editingParts: null,
      editData: {},
      partEditData: {}
    }));
  };

  if (isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <SearchAndFilter
        searchTerm={state.searchTerm || ''}
        onSearchChange={(value) => setState(prev => ({ ...prev, searchTerm: value }))}
        filter={state.filter || 'all'}
        onFilterChange={(filter) => setState(prev => ({ ...prev, filter }))}
        quotesCount={filteredQuotes.length}
      />

      {/* Desktop Table View */}
      <DesktopQuoteTable
        filteredQuotes={filteredQuotes}
        quotePartsWithNotes={state.quotePartsWithNotes || {}}
        expandedRows={state.expandedRows || new Set()}
        editingQuote={state.editingQuote || null}
        editingParts={state.editingParts || null}
        editData={state.editData || {}}
        partEditData={state.partEditData || {}}
        showCompleted={showCompleted}
        onToggleExpand={handleToggleExpand}
        onEditQuote={handleEditQuote}
        onStartEditingQuote={startEditingQuote}
        onStartEditingParts={startEditingParts}
        onSave={handleSave}
        onCancelEdit={handleCancelEdit}
        onQuoteEditChange={handleQuoteEditChange}
        onPartEditChange={handlePartEditChange}
        onDeleteWithConfirm={handleDeleteWithConfirm}
        onMarkAsOrder={handleMarkAsOrder}
        onVerifyQuote={handleVerifyQuote}
        onMarkCompleted={onMarkCompleted}
        onMarkAsOrdered={onMarkAsOrdered}
        onMarkAsOrderedWithParts={onMarkAsOrderedWithParts}
      />

      {/* Mobile Accordion View */}
      <MobileQuoteView
        filteredQuotes={filteredQuotes}
        quotePartsWithNotes={state.quotePartsWithNotes || {}}
        editingParts={state.editingParts || null}
        partEditData={state.partEditData || {}}
        showCompleted={showCompleted}
        onEditQuote={handleEditQuote}
        onStartEditingParts={startEditingParts}
        onSave={handleSave}
        onCancelEdit={handleCancelEdit}
        onPartEditChange={handlePartEditChange}
        onDeleteWithConfirm={handleDeleteWithConfirm}
        onMarkAsOrder={handleMarkAsOrder}
        onVerifyQuote={handleVerifyQuote}
        onMarkCompleted={onMarkCompleted}
        onMarkAsOrdered={onMarkAsOrdered}
        onMarkAsOrderedWithParts={onMarkAsOrderedWithParts}
        defaultFilter={defaultFilter}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmation
        isOpen={!!state.showDeleteConfirm}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Order Confirmation Dialog */}
      <OrderConfirmation
        isOpen={!!state.showOrderConfirm}
        taxInvoiceNumber={state.taxInvoiceNumber || ''}
        onTaxInvoiceChange={(value) => setState(prev => ({ ...prev, taxInvoiceNumber: value }))}
        onConfirm={confirmOrder}
        onCancel={cancelOrder}
        selectedPartsCount={state.selectedPartIds?.length}
      />

      {/* Quote Edit Modal */}
      {state.selectedQuoteForEdit && (
        <QuoteEditModal
          isOpen={state.editModalOpen || false}
          quote={state.selectedQuoteForEdit}
          onClose={handleCloseEditModal}
          onSave={handleSaveQuoteEdit}
        />
      )}
    </div>
  );
} 
