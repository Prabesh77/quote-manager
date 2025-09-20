'use client';

import { useQuotesQuery } from '@/hooks/queries/useQuotesQuery';
import { usePartsQuery } from '@/hooks/queries/useQuotesQuery';
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { FileText, CheckCircle, Clock, DollarSign, Package, TrendingUp, Settings } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  // Get all quotes for dashboard (no pagination needed here)
  const { data: quotesData, isLoading: quotesLoading } = useQuotesQuery(1, 1000); // Get all quotes
  const { data: parts, isLoading: partsLoading } = usePartsQuery();
  
  const quotes = quotesData?.quotes || [];
  const isLoading = quotesLoading || partsLoading;

  // Calculate essential statistics
  const totalQuotes = quotes.length;
  const unpricedQuotes = quotes.filter(q => q.status === 'unpriced').length;
  const pricedQuotes = quotes.filter(q => q.status === 'priced').length;
  const completedQuotes = quotes.filter(q => q.status === 'completed').length;
  const orderedQuotes = quotes.filter(q => q.status === 'ordered').length;
  const totalParts = parts?.length || 0;

  // Financial calculations
  const totalRevenue = quotes.reduce((sum, q) => {
    if (q.status === 'completed' || q.status === 'ordered' || q.status === 'delivered') {
      const quoteParts = q.partsRequested || [];
      return sum + quoteParts.reduce((partSum, partItem) => {
        return partSum + (partItem.variants?.reduce((variantSum, variant) => {
          return variantSum + (variant.final_price || 0);
        }, 0) || 0);
      }, 0);
    }
    return sum;
  }, 0);

  const averageQuoteValue = totalQuotes > 0 ? totalRevenue / totalQuotes : 0;

  // Most quoted parts analysis
  const partUsageCount: { [key: string]: number } = {};
  quotes.forEach(quote => {
    if (quote.partsRequested) {
      quote.partsRequested.forEach(partItem => {
        const partName = partItem.part_id;
        partUsageCount[partName] = (partUsageCount[partName] || 0) + 1;
      });
    }
  });

  const mostQuotedParts = Object.entries(partUsageCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([partId, count]) => {
      const part = parts?.find(p => p.id === partId);
      return {
        name: part?.name || partId,
        count
      };
    });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <ProtectedRoute allowedRoles={['admin', 'quality_controller']}>
      <div className="py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of your business metrics and performance</p>
        </div>

        {/* Quote Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Quotes</p>
                <p className="text-2xl font-bold text-gray-900">{totalQuotes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unpriced</p>
                <p className="text-2xl font-bold text-gray-900">{unpricedQuotes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Priced</p>
                <p className="text-2xl font-bold text-gray-900">{pricedQuotes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedQuotes}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Parts and Financial Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Package className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Parts</p>
                <p className="text-2xl font-bold text-gray-900">{totalParts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Quote Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(averageQuoteValue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Settings</h2>
                <p className="text-sm text-gray-600 mb-4">Configure brand-part availability rules</p>
                <Link 
                  href="/settings"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Settings
                </Link>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Settings className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h2>
                <p className="text-sm text-gray-600 mb-4">Common tasks and shortcuts</p>
                <div className="flex space-x-3">
                  <Link 
                    href="/new"
                    className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    New Quote
                  </Link>
                  <Link 
                    href="/pricing"
                    className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <DollarSign className="h-4 w-4 mr-1" />
                    Add Price
                  </Link>
                </div>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Most Quoted Parts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Quoted Parts</h2>
          {mostQuotedParts.length > 0 ? (
            <div className="space-y-3">
              {mostQuotedParts.map((part, index) => (
                <div key={part.name} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                    </div>
                    <span className="font-medium text-gray-900">{part.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-gray-500">Quoted</span>
                    <p className="text-lg font-bold text-blue-600">{part.count} times</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No parts quoted yet</p>
              <p className="text-sm text-gray-400">Create quotes to see part usage statistics</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 