'use client';

import { useQuotes } from '@/hooks/useQuotesWithQuery';
import { useDelivery } from '@/components/ui/useDelivery';
import { useEffect, useState, useMemo } from 'react';
import { Part, QuotePartItem } from '@/components/ui/useQuotes';
import { 
  TrendingUp, 
  CheckCircle, 
  ShoppingCart, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  BarChart3,
  PieChart,
  Calendar,
  Target,
  Users,
  Package
} from 'lucide-react';

interface DashboardStats {
  totalQuotes: number;
  completedQuotes: number;
  orderedQuotes: number;
  deliveredQuotes: number;
  unpricedQuotes: number;
  pricedQuotes: number;
  totalParts: number;
  totalRevenue: number;
  averageQuoteValue: number;
  quoteToOrderRate: number;
  averageOrderValue: number;
  totalPartsOrdered: number;
  averagePartsPerQuote: number;
  totalDeliveries: number;
  deliveryRate: number;
  recentActivity: Array<{
    id: string;
    type: 'quote' | 'order' | 'completion' | 'delivery';
    message: string;
    timestamp: string;
  }>;
  monthlyStats: Array<{
    month: string;
    quotes: number;
    orders: number;
    revenue: number;
  }>;
}

export default function Dashboard() {
  const { quotes, parts, connectionStatus } = useQuotes();
  const { deliveries, loading: deliveriesLoading } = useDelivery();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalQuotes: 0,
    completedQuotes: 0,
    orderedQuotes: 0,
    deliveredQuotes: 0,
    unpricedQuotes: 0,
    pricedQuotes: 0,
    totalParts: 0,
    totalRevenue: 0,
    averageQuoteValue: 0,
    quoteToOrderRate: 0,
    averageOrderValue: 0,
    totalPartsOrdered: 0,
    averagePartsPerQuote: 0,
    totalDeliveries: 0,
    deliveryRate: 0,
    recentActivity: [],
    monthlyStats: []
  });

  useEffect(() => {
    // Check if data is still loading
    const isDataLoading = connectionStatus === 'checking' || deliveriesLoading;
    
    if (isDataLoading) {
      setIsLoading(true);
    } else {
      // Data has finished loading, calculate stats
      setIsLoading(false);
      calculateStats();
    }
  }, [quotes, parts, connectionStatus, deliveriesLoading]);

  const getQuoteParts = useMemo(() => {
    return (partRequested: string): Part[] => {
      if (!partRequested || !parts.length) {
        return [];
      }
      
      const partIds = partRequested.split(',').map(id => id.trim()).filter(id => id.length > 0);
      if (partIds.length === 0) {
        return [];
      }
      
      const foundParts = parts.filter(part => partIds.includes(part.id.toString()));
      return foundParts;
    };
  }, [parts]);

  const calculateStats = () => {
    const totalQuotes = quotes.length;
    const completedQuotes = quotes.filter(q => q.status === 'completed').length;
    const orderedQuotes = quotes.filter(q => q.status === 'ordered').length;
    const deliveredQuotes = quotes.filter(q => q.status === 'delivered').length;
    const unpricedQuotes = quotes.filter(q => q.status === 'unpriced').length;
    const pricedQuotes = quotes.filter(q => q.status === 'priced').length;
    

    

    
    // Calculate revenue and parts statistics
    let totalRevenue = 0;
    let totalPartsOrdered = 0;
    let totalPartsInQuotes = 0;
        
        quotes.forEach(quote => {
      const quoteParts = getQuoteParts(quote.partRequested);
      const priceAndNotes = quote.partsRequested
      totalPartsInQuotes += quoteParts.length;
      
      // Calculate revenue for ordered, completed, and delivered quotes with prices
      if (quote.status === 'ordered' || quote.status === 'completed' || quote.status === 'delivered') {
        priceAndNotes.forEach((part: QuotePartItem) => {
          // Check all variants for the highest price
          const highestPrice = part.variants?.reduce((max, variant) => 
            variant.final_price && variant.final_price > max ? variant.final_price : max, 0
          ) || 0;
          
          if (highestPrice > 0) {
            totalRevenue += highestPrice;
            if (quote.status === 'ordered' || quote.status === 'delivered') {
              totalPartsOrdered++;
            }
          }
        });
      }
    });
    


    const averageQuoteValue = totalQuotes > 0 ? totalRevenue / totalQuotes : 0;
    const quoteToOrderRate = totalQuotes > 0 ? (orderedQuotes / totalQuotes) * 100 : 0;
    const averageOrderValue = (orderedQuotes + deliveredQuotes) > 0 ? totalRevenue / (orderedQuotes + deliveredQuotes) : 0;
    const averagePartsPerQuote = totalQuotes > 0 ? totalPartsInQuotes / totalQuotes : 0;
    
    // Calculate delivery statistics
    // Only count deliveries that correspond to quotes with 'delivered' status
    const totalDeliveries = deliveredQuotes;
    const totalOrders = orderedQuotes + deliveredQuotes;
    const deliveryRate = totalOrders > 0 ? (deliveredQuotes / totalOrders) * 100 : 0;

         // Generate recent activity
     const recentActivity = [
       ...quotes
         .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
         .slice(0, 10)
         .map(quote => ({
           id: quote.id,
           type: (quote.status === 'ordered' ? 'order' : quote.status === 'completed' ? 'completion' : quote.status === 'delivered' ? 'delivery' : 'quote') as 'quote' | 'order' | 'completion' | 'delivery',
           message: quote.status === 'ordered' 
             ? `Order created for ${quote.quoteRef}`
             : quote.status === 'completed'
             ? `Quote ${quote.quoteRef} completed`
             : quote.status === 'delivered'
             ? `Quote ${quote.quoteRef} delivered`
             : `New quote ${quote.quoteRef} created`,
           timestamp: quote.createdAt
         }))
     ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
       .slice(0, 10);

    // Generate monthly stats (last 6 months)
    const monthlyStats = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthQuotes = quotes.filter(q => {
        const quoteDate = new Date(q.createdAt);
        return quoteDate.getMonth() === date.getMonth() && quoteDate.getFullYear() === date.getFullYear();
      });
      
      const monthOrders = monthQuotes.filter(q => q.status === 'ordered');
      const monthCompleted = monthQuotes.filter(q => q.status === 'completed');
      const monthDelivered = monthQuotes.filter(q => q.status === 'delivered');
      
      const monthRevenue = [...monthOrders, ...monthCompleted, ...monthDelivered].reduce((sum, quote) => {
        const quoteParts = getQuoteParts(quote.partRequested);
        return sum + quoteParts.reduce((partSum: number, part: Part) => partSum + (part.price || 0), 0);
      }, 0);

      monthlyStats.push({
        month: monthName,
        quotes: monthQuotes.length,
        orders: monthOrders.length,
        revenue: monthRevenue
      });
    }

    setStats({
      totalQuotes,
      completedQuotes,
      orderedQuotes,
      deliveredQuotes,
      unpricedQuotes,
      pricedQuotes,
      totalParts: parts.length,
      totalRevenue,
      averageQuoteValue,
      quoteToOrderRate,
      averageOrderValue,
      totalPartsOrdered,
      averagePartsPerQuote,
      totalDeliveries,
      deliveryRate,
      recentActivity,
      monthlyStats
    });
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    color: string;
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const MetricCard = ({ title, value, change, trend }: {
    title: string;
    value: string;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">{value}</p>
          {change && (
            <div className={`flex items-center mt-1 text-xs ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 'text-gray-500'
            }`}>
              {trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
              {trend === 'down' && <TrendingUp className="h-3 w-3 mr-1 rotate-180" />}
              {change}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ml-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Business overview and key metrics</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading dashboard data...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && quotes.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Stats to Preview</h3>
              <p className="text-gray-600">Add your first quote to see dashboard statistics</p>
            </div>
          </div>
        )}

        {/* Dashboard Content - Only show when not loading and has data */}
        {!isLoading && quotes.length > 0 && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Quotes"
            value={stats.totalQuotes}
            subtitle="All time"
            icon={BarChart3}
            color="bg-blue-500"
          />
          <StatCard
            title="Completed Quotes"
            value={stats.completedQuotes}
            subtitle={`${stats.totalQuotes > 0 ? ((stats.completedQuotes / stats.totalQuotes) * 100).toFixed(1) : 0}% completion rate`}
            icon={CheckCircle}
            color="bg-green-500"
          />
          <StatCard
            title="Orders"
            value={stats.orderedQuotes + stats.deliveredQuotes}
            subtitle={`${stats.quoteToOrderRate.toFixed(1)}% conversion rate`}
            icon={ShoppingCart}
            color="bg-purple-500"
          />
          <StatCard
            title="Total Revenue"
            value={`$${stats.totalRevenue.toLocaleString()}`}
            subtitle="From orders"
            icon={DollarSign}
            color="bg-green-600"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Average Quote Value"
            value={`$${stats.averageQuoteValue.toFixed(2)}`}
          />
          <MetricCard
            title="Average Order Value"
            value={`$${stats.averageOrderValue.toFixed(2)}`}
          />
          <MetricCard
            title="Parts Ordered"
            value={stats.totalPartsOrdered.toString()}
          />
          <MetricCard
            title="Average Parts per Quote"
            value={stats.averagePartsPerQuote.toFixed(1)}
          />
          <MetricCard
            title="Pending Quotes"
            value={stats.unpricedQuotes.toString()}
            change="Waiting for pricing"
            trend="neutral"
          />
          <MetricCard
            title="Priced Quotes"
            value={stats.pricedQuotes.toString()}
            change="Ready for completion"
            trend="neutral"
          />
          <MetricCard
            title="Total Deliveries"
            value={stats.totalDeliveries.toString()}
            change="All time"
            trend="neutral"
          />
          <MetricCard
            title="Delivery Rate"
            value={`${stats.deliveryRate.toFixed(1)}%`}
            change="Orders delivered"
            trend="neutral"
          />
        </div>

        {/* Charts and Detailed Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Quote Status Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Status Distribution</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Unpriced</span>
                </div>
                <span className="text-sm font-medium">{stats.unpricedQuotes}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Priced</span>
                </div>
                <span className="text-sm font-medium">{stats.pricedQuotes}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Completed</span>
                </div>
                <span className="text-sm font-medium">{stats.completedQuotes}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Ordered</span>
                </div>
                <span className="text-sm font-medium">{stats.orderedQuotes}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Delivered</span>
                </div>
                <span className="text-sm font-medium">{stats.deliveredQuotes}</span>
              </div>
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
            <div className="space-y-3">
              {stats.monthlyStats.map((month, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{month.month}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-xs text-gray-500">{month.quotes} quotes</span>
                    <span className="text-xs text-purple-600">{month.orders} orders</span>
                    <span className="text-xs text-green-600">${month.revenue.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {stats.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-full ${
                  activity.type === 'order' ? 'bg-purple-100' :
                  activity.type === 'completion' ? 'bg-green-100' :
                  activity.type === 'delivery' ? 'bg-orange-100' : 'bg-blue-100'
                }`}>
                  {activity.type === 'order' && <ShoppingCart className="h-4 w-4 text-purple-600" />}
                  {activity.type === 'completion' && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {activity.type === 'delivery' && <Package className="h-4 w-4 text-orange-600" />}
                  {activity.type === 'quote' && <BarChart3 className="h-4 w-4 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Add New Quote</span>
                </div>
              </button>
              <button className="w-full text-left p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-900">Price Pending Quotes</span>
                </div>
              </button>
              <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Complete Quotes</span>
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Quote to Order Rate</span>
                <span className="text-sm font-medium text-purple-600">{stats.quoteToOrderRate.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completion Rate</span>
                <span className="text-sm font-medium text-green-600">
                  {stats.totalQuotes > 0 ? ((stats.completedQuotes / stats.totalQuotes) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Parts per Quote</span>
                <span className="text-sm font-medium text-blue-600">{stats.averagePartsPerQuote.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Delivery Rate</span>
                <span className="text-sm font-medium text-orange-600">{stats.deliveryRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Alerts</h3>
            <div className="space-y-3">
              {stats.unpricedQuotes > 0 && (
                <div className="flex items-center space-x-2 p-2 bg-yellow-50 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">{stats.unpricedQuotes} quotes waiting for pricing</span>
                </div>
              )}
              {stats.pricedQuotes > 0 && (
                <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">{stats.pricedQuotes} quotes ready for completion</span>
                </div>
              )}
              {stats.totalRevenue > 0 && (
                <div className="flex items-center space-x-2 p-2 bg-green-50 rounded-lg">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">${stats.totalRevenue.toLocaleString()} total revenue</span>
                </div>
              )}
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  );
} 