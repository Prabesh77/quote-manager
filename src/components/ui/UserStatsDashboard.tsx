'use client';

import React, { useState, useMemo } from 'react';
import { 
  useUserStatsQuery, 
  useActivitySummaryQuery
} from '@/hooks/queries/useQuoteActionsQuery';
import { UserStats } from '@/types/quoteActions';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  DollarSign, 
  CheckCircle,
  Clock,
  Calendar,
  Activity,
  Filter,
  X
} from 'lucide-react';

interface UserStatsDashboardProps {
  className?: string;
}

export default function UserStatsDashboard({ className = '' }: UserStatsDashboardProps) {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showCustomRange, setShowCustomRange] = useState<boolean>(false);

  // Memoize date range calculations to prevent infinite re-renders
  const { effectiveStartDate, effectiveEndDate } = useMemo(() => {
    const now = new Date();
    let filterStart = '';
    let filterEnd = '';

    switch (dateRange) {
      case 'today':
        // Get start and end of today in local timezone
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        filterStart = startOfToday.toISOString();
        filterEnd = endOfToday.toISOString();
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filterStart = weekAgo.toISOString();
        filterEnd = now.toISOString();
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filterStart = monthAgo.toISOString();
        filterEnd = now.toISOString();
        break;
      default:
        filterStart = '';
        filterEnd = '';
    }

    const result = {
      effectiveStartDate: startDate || filterStart || undefined,
      effectiveEndDate: endDate || filterEnd || undefined
    };



    return result;
  }, [dateRange, startDate, endDate]);

  const { data: userStats, isLoading: statsLoading, error: statsError } = useUserStatsQuery(
    effectiveStartDate, 
    effectiveEndDate
  );
  const { data: activitySummary, isLoading: summaryLoading, error: summaryError } = useActivitySummaryQuery();





  const clearCustomDates = () => {
    setStartDate('');
    setEndDate('');
    setShowCustomRange(false);
  };

  const handleDateRangeChange = (range: 'today' | 'week' | 'month' | 'all') => {
    setDateRange(range);
    if (range !== 'all') {
      setShowCustomRange(false);
      clearCustomDates();
    }
  };

  if (statsLoading || summaryLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        {/* Header skeleton */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
          <div>
            <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm w-full lg:w-auto">
            <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
            <div className="flex flex-wrap gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-gray-200 rounded w-20"></div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Summary cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
        
        {/* Table skeleton */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-40 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          <div className="p-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded mb-2"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there are errors
  if (statsError || summaryError) {
    return (
      <div className={`${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 mb-4">
            There was an error loading the user statistics dashboard. This might be because:
          </p>
          <ul className="list-disc list-inside text-red-600 space-y-1">
            <li>The quote_actions table doesn't exist yet</li>
            <li>There are no quote actions to display</li>
            <li>Database permissions need to be configured</li>
          </ul>
          <div className="mt-4 text-sm text-red-500">
            <p>Stats Error: {statsError?.message || 'None'}</p>
            <p>Summary Error: {summaryError?.message || 'None'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with improved filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Performance Dashboard</h2>
          <p className="text-gray-600">Track user activity and quote performance</p>
        </div>
        
        {/* Enhanced Filter Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by Date Range</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Quick Date Range Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'today', label: 'Today', icon: Calendar },
                { value: 'week', label: 'This Week', icon: Clock },
                { value: 'month', label: 'This Month', icon: TrendingUp },
                { value: 'all', label: 'All Time', icon: Activity }
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleDateRangeChange(value as any)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    dateRange === value
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
            
            {/* Custom Date Range */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCustomRange(!showCustomRange)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  showCustomRange
                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                Custom Range
              </button>
              
              {(startDate || endDate) && (
                <button
                  onClick={clearCustomDates}
                  className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Clear custom dates"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Custom Date Inputs */}
          {showCustomRange && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* Active Filter Display */}
          {(effectiveStartDate || effectiveEndDate) && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span className="font-medium">Active filter:</span>
                <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  {effectiveStartDate && effectiveEndDate
                    ? `${new Date(effectiveStartDate).toLocaleDateString('en-AU')} - ${new Date(effectiveEndDate).toLocaleDateString('en-AU')}`
                    : effectiveStartDate
                    ? `From ${new Date(effectiveStartDate).toLocaleDateString('en-AU')}`
                    : effectiveEndDate
                    ? `Until ${new Date(effectiveEndDate).toLocaleDateString('en-AU')}`
                    : 'No date filter'
                  }
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Actions</p>
              <p className="text-2xl font-bold text-gray-900">
                {activitySummary?.total_actions || 0}
              </p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Actions Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {activitySummary?.actions_today || 0}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {activitySummary?.actions_this_week || 0}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {activitySummary?.actions_this_month || 0}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* User Statistics Table - Full Width */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">User Performance</h3>
          <p className="text-sm text-gray-600 mt-1">
            Track individual user contributions to quote creation, pricing, and completion
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priced
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userStats && userStats.length > 0 ? (
                userStats.map((user: UserStats) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-700">
                              {(user.user_name || user.user_email || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.user_name || user.user_email || 'User'}
                          </div>
                          <div className="text-sm text-gray-500">{user.user_email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{user.quotes_created}</span>
                        <FileText className="ml-2 w-4 h-4 text-blue-500" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{user.quotes_priced}</span>
                        <DollarSign className="ml-2 w-4 h-4 text-green-500" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{user.quotes_completed}</span>
                        <CheckCircle className="ml-2 w-4 h-4 text-purple-500" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {user.total_quotes}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <Users className="w-12 h-12 text-gray-300 mb-4" />
                      <p className="text-gray-500 text-lg font-medium">No user statistics available</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Create, price, or complete some quotes to see user performance data here.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
