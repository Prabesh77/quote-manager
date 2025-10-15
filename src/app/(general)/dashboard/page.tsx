'use client';

import { useQuotesQuery } from '@/hooks/queries/useQuotesQuery';
import { usePartsQuery } from '@/hooks/queries/useQuotesQuery';
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { FileText, CheckCircle, DollarSign, Package, TrendingUp, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

export default function DashboardPage() {
  const [expandedParts, setExpandedParts] = useState<Set<string>>(new Set());
  const [showAllUnquoted, setShowAllUnquoted] = useState(false);

  const togglePartNumbers = (partName: string) => {
    setExpandedParts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(partName)) {
        newSet.delete(partName);
      } else {
        newSet.add(partName);
      }
      return newSet;
    });
  };
  // Get all quotes for dashboard (no pagination needed here)
  const { data: quotesData, isLoading: quotesLoading } = useQuotesQuery(1, 1000); // Get all quotes
  const { data: parts, isLoading: partsLoading } = usePartsQuery();
  
  const quotes = quotesData?.quotes || [];
  const isLoading = quotesLoading || partsLoading;

  // Calculate essential statistics
  const totalQuotes = quotes.length;
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

  // Unquoted parts analysis (parts with price < 10)
  interface UnquotedPart {
    partName: string;
    partNumbers: string[];
  }

  // Track each unique part (by part_id) to avoid duplicates
  const processedPartIds = new Set<string>();
  const unquotedPartsMap = new Map<string, UnquotedPart>();
  
  quotes.forEach(quote => {
    if (quote.partsRequested) {
      quote.partsRequested.forEach(partItem => {
        const part = parts?.find(p => p.id === partItem.part_id);
        
        // Skip if we've already processed this exact part (by part_id)
        if (!part || processedPartIds.has(partItem.part_id)) {
          return;
        }
        
        // Check all variants for unquoted parts (price < 10)
        const hasUnquotedVariant = partItem.variants?.some((variant: any) => 
          !variant.final_price || variant.final_price < 10
        );

        if (hasUnquotedVariant) {
          // Mark this part_id as processed to avoid duplicates
          processedPartIds.add(partItem.part_id);
          
          const partName = part.name || 'Unknown Part';
          const partNumber = part.number || 'N/A';
          const existing = unquotedPartsMap.get(partName);
          
          if (existing) {
            // Add part number if not already in the array
            if (!existing.partNumbers.includes(partNumber)) {
              existing.partNumbers.push(partNumber);
            }
          } else {
            unquotedPartsMap.set(partName, {
              partName,
              partNumbers: [partNumber]
            });
          }
        }
      });
    }
  });

  const unquotedParts = Array.from(unquotedPartsMap.values())
    .map(part => ({
      ...part,
      count: part.partNumbers.length  // count = number of unique part numbers
    }))
    .sort((a, b) => b.count - a.count);

  // Most quoted parts analysis
  const partUsageCount: { [key: string]: number } = {};
  quotes.forEach(quote => {
    if (quote.partsRequested) {
      quote.partsRequested.forEach(partItem => {
        // Look up the part name from the parts array using part_id
        const part = parts?.find(p => p.id === partItem.part_id);
        const partName = part?.name || partItem.part_id;
        partUsageCount[partName] = (partUsageCount[partName] || 0) + 1;
      });
    }
  });

  const mostQuotedParts = Object.entries(partUsageCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([partName, count]) => {
      return {
        name: partName,
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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

        {/* Unquoted Parts (Price < 10) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Unquoted Parts</h2>
            </div>
            {unquotedParts.length > 5 && (
              <span className="text-sm text-gray-500">
                Showing {showAllUnquoted ? unquotedParts.length : Math.min(5, unquotedParts.length)} of {unquotedParts.length}
              </span>
            )}
          </div>
          {unquotedParts.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Numbers</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(showAllUnquoted ? unquotedParts : unquotedParts.slice(0, 5)).map((part, index) => {
                      const isExpanded = expandedParts.has(part.partName);
                      const maxVisible = 3;
                      const visibleNumbers = isExpanded ? part.partNumbers : part.partNumbers.slice(0, maxVisible);
                      const hasMore = part.partNumbers.length > maxVisible;
                      
                      return (
                        <tr key={`${part.partName}-${index}`} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{part.partName}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              {visibleNumbers.map((number, idx) => (
                                <span 
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs font-mono rounded border border-gray-200"
                                >
                                  {number}
                                </span>
                              ))}
                              {hasMore && (
                                <button
                                  onClick={() => togglePartNumbers(part.partName)}
                                  className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="h-3 w-3 mr-1" />
                                      Show less
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-3 w-3 mr-1" />
                                      +{part.partNumbers.length - maxVisible} more
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-red-100 text-red-600 rounded-full font-semibold">
                              {part.count}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Show More/Less Button */}
              {unquotedParts.length > 5 && (
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setShowAllUnquoted(!showAllUnquoted)}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                  >
                    {showAllUnquoted ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Show {unquotedParts.length - 5} More
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-3" />
              <p className="text-gray-500">All parts have been quoted!</p>
              <p className="text-sm text-gray-400">No parts with missing prices</p>
            </div>
          )}
        </div>

        {/* Most Quoted Parts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Most Quoted Parts</h2>
          {mostQuotedParts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mostQuotedParts.map((part, index) => (
                <div key={part.name} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-blue-600">{index + 1}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{part.name}</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600 ml-2">{part.count}x</span>
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