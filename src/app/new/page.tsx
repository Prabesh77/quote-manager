'use client';

import { useState } from 'react';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';
import { QuoteForm } from '@/components/ui/QuoteForm';
import QuoteTable from '@/components/ui/QuoteTable';
import { useQuotes } from '@/components/ui/useQuotes';
import { Archive } from 'lucide-react';
import Link from 'next/link';
import { PartDetails } from '@/types/quote';

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
    addPart,
  } = useQuotes();

  const handleSubmitQuote = async (fields: Record<string, string>, partsArray: PartDetails[]) => {
    try {
      // First, create all parts and get their IDs
      const createdParts = [];
      
      for (const part of partsArray) {
        const { data: partData, error: partError } = await addPart({
          name: part.name,
          number: part.number,
          price: part.price,
          note: part.note
        });
        
        if (partError) {
          console.error('Error creating part:', partError);
          alert('Failed to create some parts. Please try again.');
          return;
        }
        
        if (partData) {
          createdParts.push(partData[0]);
        }
      }

      // Create quote with part IDs
      const partIds = createdParts.map(part => part.id);
      const { error: quoteError } = await addQuote(fields, partIds);
      
      if (quoteError) {
        console.error('Error creating quote:', quoteError);
        alert('Failed to create quote. Please try again.');
        return;
      }
    } catch (error) {
      console.error('Error in quote submission:', error);
      alert('Failed to create quote. Please try again.');
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

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quote Management</h1>
              <p className="text-gray-600">Fast and efficient quote creation for busy environments</p>
            </div>
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
