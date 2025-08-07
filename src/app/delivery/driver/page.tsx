'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useDeliveries } from '@/hooks/useDeliveries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LogoutButton from '@/components/ui/LogoutButton';
import { Delivery } from '@/types/delivery';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  Truck, 
  Package, 
  Search, 
  Filter, 
  CheckSquare,
  Square,
  MapPin,
  User,
  FileText,
  Camera,
  PenTool,
  LogOut,
  Calendar,
  Clock
} from 'lucide-react';

export default function DriverApp() {
  const { user, loading: authLoading } = useAuth();
  const { deliveries, loading: dataLoading } = useDeliveries();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeliveries, setSelectedDeliveries] = useState<Set<string>>(new Set());
  const [showDeliveredModal, setShowDeliveredModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'available' | 'my-deliveries'>('available');

  const availableDeliveries = deliveries.filter(d => d.status === 'pending');
  const myDeliveries = deliveries.filter(d => d.status === 'assigned' && d.assigned_to === user?.id);

  const filteredAvailableDeliveries = availableDeliveries.filter(delivery => {
    return (
      delivery.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleSelectDelivery = (deliveryId: string) => {
    const newSelected = new Set(selectedDeliveries);
    if (newSelected.has(deliveryId)) {
      newSelected.delete(deliveryId);
    } else {
      newSelected.add(deliveryId);
    }
    setSelectedDeliveries(newSelected);
  };

  const handleAssignDeliveries = async () => {
    // This will be implemented to assign selected deliveries to the driver
    console.log('Assigning deliveries:', Array.from(selectedDeliveries));
    setSelectedDeliveries(new Set());
  };



  // Show loading state while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-200 rounded-lg w-9 h-9 animate-pulse" />
                <div>
                  <div className="h-5 bg-gray-200 rounded w-24 mb-1 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-32 animate-pulse" />
                </div>
              </div>
              <div className="h-9 bg-gray-200 rounded w-20 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="bg-white border-b">
          <div className="flex">
            {[1, 2].map((i) => (
              <div key={i} className="flex-1 py-3 px-4">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="p-4">
          <div className="mb-4">
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start space-x-3">
                  <div className="mt-1 w-5 h-5 bg-gray-200 rounded animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-48 mb-3 animate-pulse" />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show access denied only after auth is loaded and user is not driver
  if (!user || user.type !== 'driver') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need driver privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Truck className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Driver App</h1>
                <p className="text-xs text-gray-500">Welcome, {user.name}</p>
              </div>
            </div>
            <LogoutButton />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'available'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Available ({availableDeliveries.length})
          </button>
          <button
            onClick={() => setActiveTab('my-deliveries')}
            className={`flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'my-deliveries'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Deliveries ({myDeliveries.length})
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search deliveries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'available' ? (
          <AvailableDeliveries
            deliveries={filteredAvailableDeliveries}
            selectedDeliveries={selectedDeliveries}
            onSelectDelivery={handleSelectDelivery}
            onAssignDeliveries={handleAssignDeliveries}
            loading={dataLoading}
          />
        ) : (
          <MyDeliveries
            deliveries={myDeliveries}
            onMarkDelivered={() => setShowDeliveredModal(true)}
            loading={dataLoading}
          />
        )}
      </div>

      {/* Mark as Delivered Modal */}
      {showDeliveredModal && (
        <MarkDeliveredModal onClose={() => setShowDeliveredModal(false)} />
      )}
    </div>
  );
}

function AvailableDeliveries({
  deliveries,
  selectedDeliveries,
  onSelectDelivery,
  onAssignDeliveries,
  loading
}: {
  deliveries: Delivery[];
  selectedDeliveries: Set<string>;
  onSelectDelivery: (id: string) => void;
  onAssignDeliveries: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-4">
      {selectedDeliveries.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800">
              {selectedDeliveries.size} delivery{selectedDeliveries.size !== 1 ? 'ies' : ''} selected
            </p>
            <Button
              onClick={onAssignDeliveries}
              size="sm"
              className="bg-red-600 hover:bg-red-700"
            >
              Assign to Me
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading deliveries...</p>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No available deliveries</h3>
          <p className="text-gray-600">All deliveries have been assigned or completed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deliveries.map((delivery) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              isSelected={selectedDeliveries.has(delivery.id)}
              onSelect={() => onSelectDelivery(delivery.id)}
              showCheckbox={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MyDeliveries({
  deliveries,
  onMarkDelivered,
  loading
}: {
  deliveries: Delivery[];
  onMarkDelivered: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading deliveries...</p>
        </div>
      ) : deliveries.length === 0 ? (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assigned deliveries</h3>
          <p className="text-gray-600">You don't have any deliveries assigned to you yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deliveries.map((delivery) => (
            <DeliveryCard
              key={delivery.id}
              delivery={delivery}
              isSelected={false}
              onSelect={() => {}}
              showCheckbox={false}
            />
          ))}
          <Button
            onClick={onMarkDelivered}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            Mark as Delivered
          </Button>
        </div>
      )}
    </div>
  );
}

function DeliveryCard({
  delivery,
  isSelected,
  onSelect,
  showCheckbox
}: {
  delivery: Delivery;
  isSelected: boolean;
  onSelect: () => void;
  showCheckbox: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
        {showCheckbox && (
          <button
            onClick={onSelect}
            className="mt-1 flex-shrink-0"
          >
            {isSelected ? (
              <CheckSquare className="h-5 w-5 text-red-600" />
            ) : (
              <Square className="h-5 w-5 text-gray-400" />
            )}
          </button>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {delivery.customer_name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <MapPin className="h-3 w-3 text-gray-400" />
                <p className="text-xs text-gray-500 truncate">{delivery.address}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3 text-gray-400" />
              <span className="text-gray-500">Account:</span>
              <span className="font-medium">{delivery.account_number}</span>
            </div>
            <div className="flex items-center space-x-1">
              <FileText className="h-3 w-3 text-gray-400" />
              <span className="text-gray-500">Invoice:</span>
              <span className="font-medium">{delivery.invoice_number}</span>
            </div>
          </div>
          
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
              Round: {delivery.delivery_round}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarkDeliveredModal({ onClose }: { onClose: () => void }) {
  // This will be implemented in the next step
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mark as Delivered</h3>
        <p className="text-gray-600 mb-4">This feature will be implemented in the next step.</p>
        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </div>
  );
} 