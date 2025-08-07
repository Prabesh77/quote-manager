'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useDeliveries } from '@/hooks/useDeliveries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LogoutButton from '@/components/ui/LogoutButton';
import { Delivery, DeliveryStats } from '@/types/delivery';
import { 
  StatsCardSkeleton, 
  DeliveryRowSkeleton, 
  SearchBarSkeleton, 
  HeaderSkeleton 
} from '@/components/ui/Skeleton';
import { 
  Truck, 
  Package, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Plus,
  Search,
  Filter,
  BarChart3,
  Users,
  Calendar,
  LogOut,
  TrendingUp,
  MapPin,
  FileText,
  X
} from 'lucide-react';

// AddDeliveryModal Component
function AddDeliveryModal({ 
  isOpen, 
  onClose, 
  onAdd 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onAdd: (delivery: Omit<Delivery, 'id' | 'deliveredAt'>) => void; 
}) {
  const [formData, setFormData] = useState({
    account_number: '',
    customer_name: '',
    address: '',
    delivery_round: '',
    invoice_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { getCustomerByAccountNumber } = useDeliveries();

  const handleInputChange = async (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-fill customer details when account number is entered
    if (field === 'account_number' && value.trim()) {
      try {
        const accountNumber = value.trim().toLowerCase();
        const customer = getCustomerByAccountNumber(accountNumber);
        if (customer) {
          setFormData(prev => ({
            ...prev,
            customer_name: customer.customer_name,
            address: customer.address
          }));
        }
      } catch (error) {
        console.error('Error fetching customer:', error);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.account_number || !formData.customer_name || !formData.address || !formData.delivery_round || !formData.invoice_number) {
        setError('All fields are required');
        return;
      }

      const newDelivery: Omit<Delivery, 'id' | 'delivered_at'> = {
        account_number: formData.account_number,
        customer_name: formData.customer_name,
        address: formData.address,
        delivery_round: formData.delivery_round,
        invoice_number: formData.invoice_number,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await onAdd(newDelivery);
      
      // Reset form
      setFormData({
        account_number: '',
        customer_name: '',
        address: '',
        delivery_round: '',
        invoice_number: ''
      });
      
      onClose();
    } catch (error) {
      setError('Failed to add delivery. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/5 backdrop-blur-xl flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add New Delivery</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                      {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}



          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number *
            </label>
            <Input
              type="text"
              value={formData.account_number}
              onChange={(e) => handleInputChange('account_number', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name *
            </label>
            <Input
              type="text"
              value={formData.customer_name}
              onChange={(e) => handleInputChange('customer_name', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <Input
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Round *
            </label>
            <Input
              type="text"
              value={formData.delivery_round}
              onChange={(e) => handleInputChange('delivery_round', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Invoice Number *
            </label>
            <Input
              type="text"
              value={formData.invoice_number}
              onChange={(e) => handleInputChange('invoice_number', e.target.value)}
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Delivery'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { deliveries, customers, loading: dataLoading, getOverdueDeliveries, addDelivery, getCustomerByAccountNumber } = useDeliveries();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'assigned' | 'delivered'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const [stats, setStats] = useState<DeliveryStats>({
    totalDeliveries: 0,
    pendingDeliveries: 0,
    assignedDeliveries: 0,
    deliveredDeliveries: 0,
    overdueDeliveries: 0,
    deliveryRate: 0,
    averageDeliveryTime: 0,
  });

  useEffect(() => {
    if (!dataLoading) {
      calculateStats();
    }
  }, [deliveries, dataLoading]);

  const calculateStats = () => {
    const total = deliveries.length;
    const pending = deliveries.filter(d => d.status === 'pending').length;
    const assigned = deliveries.filter(d => d.status === 'assigned').length;
    const delivered = deliveries.filter(d => d.status === 'delivered').length;
    const overdue = getOverdueDeliveries().length;
    const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;

    // Calculate average delivery time for delivered items
    const deliveredItems = deliveries.filter(d => d.status === 'delivered' && d.delivered_at && d.assigned_at);
    const totalTime = deliveredItems.reduce((acc, item) => {
      const assignedTime = new Date(item.assigned_at!).getTime();
      const deliveredTime = new Date(item.delivered_at!).getTime();
      return acc + (deliveredTime - assignedTime);
    }, 0);
    const averageTime = deliveredItems.length > 0 ? totalTime / deliveredItems.length / (1000 * 60 * 60) : 0; // in hours

    setStats({
      totalDeliveries: total,
      pendingDeliveries: pending,
      assignedDeliveries: assigned,
      deliveredDeliveries: delivered,
      overdueDeliveries: overdue,
      deliveryRate,
      averageDeliveryTime: averageTime,
    });
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = 
      delivery.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Show loading state while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <HeaderSkeleton />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
          <SearchBarSkeleton />
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
            </div>
            <div className="divide-y divide-gray-200">
              {[1, 2, 3].map((i) => (
                <DeliveryRowSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied only after auth is loaded and user is not admin
  if (!user || user.type !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Truck className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Delivery Management</h1>
                <p className="text-sm text-gray-500">Admin Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Delivery
              </Button>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Package className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDeliveries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingDeliveries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">{stats.deliveredDeliveries}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">{stats.overdueDeliveries}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by customer name, account number, or invoice number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
                className={statusFilter === 'all' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('pending')}
                size="sm"
                className={statusFilter === 'pending' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'assigned' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('assigned')}
                size="sm"
                className={statusFilter === 'assigned' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Assigned
              </Button>
              <Button
                variant={statusFilter === 'delivered' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('delivered')}
                size="sm"
                className={statusFilter === 'delivered' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Delivered
              </Button>
            </div>
          </div>
        </div>

        {/* Deliveries List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Deliveries</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {dataLoading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading deliveries...</p>
              </div>
            ) : filteredDeliveries.length === 0 ? (
              <div className="p-6 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries found</h3>
                <p className="text-gray-600">No deliveries match your search criteria.</p>
              </div>
            ) : (
              filteredDeliveries.map((delivery) => (
                <DeliveryRow key={delivery.id} delivery={delivery} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Add Delivery Modal */}
      {showAddModal && (
        <AddDeliveryModal 
          isOpen={showAddModal} 
          onClose={() => setShowAddModal(false)} 
          onAdd={async (newDelivery) => {
            try {
              await addDelivery(newDelivery);
              setShowAddModal(false);
            } catch (error) {
              console.error('Failed to add delivery:', error);
            }
          }} 
        />
      )}
    </div>
  );
}

function DeliveryRow({ delivery }: { delivery: Delivery }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'assigned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending';
      case 'assigned':
        return 'Assigned';
      case 'delivered':
        return 'Delivered';
      default:
        return status;
    }
  };

  const isOverdue = () => {
    if (delivery.status !== 'pending') return false;
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return new Date(delivery.created_at) < twentyFourHoursAgo;
  };

  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-sm font-medium text-gray-900">{delivery.customer_name}</h3>
                {isOverdue() && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                    Overdue
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="h-3 w-3 text-gray-400" />
                <p className="text-sm text-gray-500">{delivery.address}</p>
              </div>
              <div className="flex items-center space-x-4 text-xs text-gray-400">
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>Account: {delivery.account_number}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FileText className="h-3 w-3" />
                  <span>Invoice: {delivery.invoice_number}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>Round: {delivery.delivery_round}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(delivery.status)}`}>
                {getStatusText(delivery.status)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 