'use client';

import { useState } from 'react';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';
import { QuoteForm } from '@/components/ui/QuoteForm';
import QuoteTable from '@/components/ui/QuoteTable';
import { useQuotes } from '@/components/ui/useQuotes';
import { Archive } from 'lucide-react';
import Link from 'next/link';

export default function NewPage() {
  const {
    quotes,
    parts,
    connectionStatus,
    addQuote,
    updateQuote,
    deleteQuote,
    updatePart,
    updateMultipleParts,
    markQuoteCompleted,
    getActiveQuotes,
  } = useQuotes();

  const handleSubmitQuote = async (fields: Record<string, string>, partsArray: string[]) => {
    const { error } = await addQuote(fields, partsArray);
    if (error) {
      alert('Failed to add quote. Check console.');
    }
  };

  const handleUpdateQuote = async (id: string, fields: Record<string, any>) => {
    try {
      return await updateQuote(id, fields);
    } catch (error) {
      console.error('Error updating quote:', error);
      return { error };
    }
  };

  const handleDeleteQuote = async (id: string) => {
    try {
      return await deleteQuote(id);
    } catch (error) {
      console.error('Error deleting quote:', error);
      return { error };
    }
  };

  const handleUpdatePart = async (id: string, updates: any) => {
    try {
      return await updatePart(id, updates);
    } catch (error) {
      console.error('Error updating part:', error);
      return { data: null, error };
    }
  };

  const handleUpdateMultipleParts = async (updates: Array<{ id: string; updates: any }>) => {
    try {
      await updateMultipleParts(updates);
    } catch (error) {
      console.error('Error updating multiple parts:', error);
    }
  };

  const handleMarkCompleted = async (id: string) => {
    try {
      return await markQuoteCompleted(id);
    } catch (error) {
      console.error('Error marking quote as completed:', error);
      return { error };
    }
  };

  // Use only active quotes for the main page
  const activeQuotes = getActiveQuotes();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Connection Status */}
      <ConnectionStatus status={connectionStatus === 'checking' ? 'disconnected' : connectionStatus} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quote Management</h1>
              <p className="text-gray-600">Fast and efficient quote creation for busy environments</p>
            </div>
            
            <Link 
              href="/completed-quotes" 
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Archive className="h-4 w-4" />
              <span>Completed Quotes</span>
            </Link>
          </div>
        </div>

        <div className="space-y-8">
          {/* Quote Form */}
          <QuoteForm 
            onSubmit={handleSubmitQuote}
          />

          {/* Quotes Table */}
          <QuoteTable
            quotes={activeQuotes}
            parts={parts}
            onUpdateQuote={handleUpdateQuote}
            onDeleteQuote={handleDeleteQuote}
            onUpdatePart={handleUpdatePart}
            onUpdateMultipleParts={handleUpdateMultipleParts}
            onMarkCompleted={handleMarkCompleted}
            showCompleted={false}
          />
        </div>
      </div>
    </div>
  );
}
