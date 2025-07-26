'use client';

import { useState } from 'react';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';
import QuoteTable from '@/components/ui/QuoteTable';
import { useQuotes } from '@/components/ui/useQuotes';
import { ArrowLeft, Archive } from 'lucide-react';
import Link from 'next/link';

export default function CompletedQuotesPage() {
  const {
    quotes,
    parts,
    connectionStatus,
    updateQuote,
    deleteQuote,
    updatePart,
    updateMultipleParts,
  } = useQuotes();

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Connection Status */}
      <ConnectionStatus status={connectionStatus === 'checking' ? 'disconnected' : connectionStatus} />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link 
              href="/new" 
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Active Quotes</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-3">
            <Archive className="h-8 w-8 text-red-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Completed Quotes</h1>
              <p className="text-gray-600">View all completed and delivered quotes</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Completed Quotes Table */}
          <QuoteTable
            quotes={quotes}
            parts={parts}
            onUpdateQuote={handleUpdateQuote}
            onDeleteQuote={handleDeleteQuote}
            onUpdatePart={handleUpdatePart}
            onUpdateMultipleParts={handleUpdateMultipleParts}
            showCompleted={true}
          />
        </div>
      </div>
    </div>
  );
} 