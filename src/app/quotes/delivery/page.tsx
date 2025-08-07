'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Camera, FileText, User, Package, CheckCircle, Clock, MapPin, PenTool } from 'lucide-react';
import { useDelivery, Delivery } from '@/components/ui/useDelivery';
import { useQuotes } from '@/components/ui/useQuotes';
import SignatureCanvas from '@/components/ui/SignatureCanvas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAccessibleStorageUrl, testBucketAccess, ensureBucketExists } from '@/utils/storage';
import Navigation from '@/components/ui/Navigation';
import DashboardSidebar from '@/components/ui/DashboardSidebar';

export default function DeliveryPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const { deliveries, addDelivery, loading } = useDelivery();
  const { quotes } = useQuotes();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <DashboardSidebar />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Delivery Management</h1>
            <p className="text-sm text-gray-500">Track and manage deliveries</p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-red-600 hover:bg-red-700"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Delivery</span>
          </Button>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Delivered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {deliveries.filter((d: Delivery) => d.status === 'delivered').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {deliveries.filter((d: Delivery) => d.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Deliveries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {deliveries.filter((d: Delivery) => {
                    const today = new Date().toDateString();
                    const deliveryDate = new Date(d.deliveredAt).toDateString();
                    return deliveryDate === today;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Deliveries List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Deliveries</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading deliveries...</p>
            </div>
          ) : deliveries.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No deliveries yet</h3>
              <p className="text-gray-500 mb-4">Start by adding your first delivery</p>
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-red-600 hover:bg-red-700"
              >
                Add First Delivery
              </Button>
            </div>
          ) : (
                         <div className="divide-y divide-gray-200">
               {deliveries.map((delivery: Delivery) => (
                 <DeliveryCard key={delivery.id} delivery={delivery} />
               ))}
             </div>
          )}
        </div>
      </div>

      {/* Add Delivery Modal */}
      {showAddModal && (
        <AddDeliveryModal
          onClose={() => setShowAddModal(false)}
          onAdd={addDelivery}
          quotes={quotes}
        />
      )}
    </div>
  );
}

function DeliveryCard({ delivery }: { delivery: Delivery }) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className={`p-2 rounded-lg ${
            delivery.status === 'delivered' 
              ? 'bg-green-100' 
              : 'bg-yellow-100'
          }`}>
            {delivery.status === 'delivered' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Clock className="h-5 w-5 text-yellow-600" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {delivery.customerName}
              </h3>
              <span className={`px-2 py-1 text-xs rounded-full ${
                delivery.status === 'delivered'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {delivery.status === 'delivered' ? 'Delivered' : 'Pending'}
              </span>
            </div>
                         <p className="text-sm text-gray-500">Tax Invoice: {delivery.taxInvoiceNumber}</p>
            <p className="text-sm text-gray-500">Receiver: {delivery.receiverName}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <FileText className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {showDetails && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {delivery.photoProof && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Photo Proof</p>
                <img
                  src={delivery.photoProof}
                  alt="Delivery proof"
                  className="w-full h-32 object-contain rounded-lg border bg-gray-50"
                  onError={async (e) => {
                    const target = e.target as HTMLImageElement;
                    try {
                      const accessibleUrl = await getAccessibleStorageUrl(delivery.photoProof);
                      if (accessibleUrl !== delivery.photoProof) {
                        target.src = accessibleUrl;
                        return;
                      }
                    } catch (error) {
                      console.warn('Could not get accessible URL for photo:', error);
                    }
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-full h-32 bg-gray-100 rounded-lg border flex items-center justify-center">
                  <p className="text-xs text-gray-500">Photo not available</p>
                </div>
              </div>
            )}
            {delivery.signature && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Signature</p>
                <img
                  src={delivery.signature}
                  alt="Receiver signature"
                  className="w-full h-32 object-contain rounded-lg border bg-gray-50"
                  onError={async (e) => {
                    const target = e.target as HTMLImageElement;
                    try {
                      const accessibleUrl = await getAccessibleStorageUrl(delivery.signature);
                      if (accessibleUrl !== delivery.signature) {
                        target.src = accessibleUrl;
                        return;
                      }
                    } catch (error) {
                      console.warn('Could not get accessible URL for signature:', error);
                    }
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden w-full h-32 bg-gray-100 rounded-lg border flex items-center justify-center">
                  <p className="text-xs text-gray-500">Signature not available</p>
                </div>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500">
            Delivered: {new Date(delivery.deliveredAt).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}

function AddDeliveryModal({ onClose, onAdd, quotes }: { 
  onClose: () => void; 
  onAdd: (delivery: Omit<Delivery, 'id' | 'deliveredAt'> & { matchingQuoteId?: string }) => void;
  quotes: any[];
}) {
  const [formData, setFormData] = useState({
    customerName: '',
    taxInvoiceNumber: '',
    receiverName: '',
    photoProof: '',
    signature: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showSignatureCanvas, setShowSignatureCanvas] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Get ordered quotes with customer names
  const orderedQuotes = quotes.filter(quote => quote.status === 'ordered' && quote.customer);
  const customerSuggestions = [...new Set(orderedQuotes.map(quote => quote.customer))];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      // Convert photo file to base64
      let photoProof = '';
      
      if (photoFile) {
        photoProof = await fileToBase64(photoFile);
      }
      
      // Check if there's a matching ordered quote with the same tax invoice number
      const matchingQuote = orderedQuotes.find(quote => 
        quote.taxInvoiceNumber === formData.taxInvoiceNumber
      );
      
      await onAdd({
        ...formData,
        photoProof,
        signature: signatureDataUrl,
        status: 'delivered' as const,
        matchingQuoteId: matchingQuote?.id, // Pass the matching quote ID
      });
      
      onClose();
    } catch (error) {
      console.error('Error adding delivery:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 transform transition-all max-h-[90vh] overflow-y-auto">
        <div className="flex items-center space-x-3 mb-4">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Package className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Add New Delivery</h3>
            <p className="text-sm text-gray-500">Record delivery details</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name
            </label>
            <Input
              type="text"
              required
              value={formData.customerName}
              onChange={(e) => {
                setFormData({ ...formData, customerName: e.target.value });
                setShowSuggestions(e.target.value.length > 0);
              }}
              onFocus={() => setShowSuggestions(formData.customerName.length > 0)}
              placeholder="Enter customer name"
              disabled={isSubmitting}
            />
            {showSuggestions && customerSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                {customerSuggestions
                  .filter(name => name.toLowerCase().includes(formData.customerName.toLowerCase()))
                  .map((name, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      onClick={() => {
                        setFormData({ ...formData, customerName: name });
                        setShowSuggestions(false);
                      }}
                    >
                      {name}
                    </button>
                  ))}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tax Invoice Number
            </label>
            <Input
              type="text"
              required
              value={formData.taxInvoiceNumber}
              onChange={(e) => setFormData({ ...formData, taxInvoiceNumber: e.target.value })}
              placeholder="Enter tax invoice number"
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Receiver Name
            </label>
            <Input
              type="text"
              required
              value={formData.receiverName}
              onChange={(e) => setFormData({ ...formData, receiverName: e.target.value })}
              placeholder="Enter receiver name"
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Photo Proof
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                className="hidden"
                id="photo-input"
                disabled={isSubmitting}
              />
              <label htmlFor="photo-input" className={`cursor-pointer ${isSubmitting ? 'opacity-50' : ''}`}>
                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {photoFile ? photoFile.name : 'Tap to take photo or select image'}
                </p>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Receiver Signature
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <button
                type="button"
                onClick={() => setShowSignatureCanvas(true)}
                className={`w-full cursor-pointer ${isSubmitting ? 'opacity-50' : ''}`}
                disabled={isSubmitting}
              >
                <PenTool className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  {signatureDataUrl ? 'Signature captured - tap to re-sign' : 'Tap to capture signature'}
                </p>
              </button>
            </div>
            {signatureDataUrl && (
              <div className="mt-2">
                <img
                  src={signatureDataUrl}
                  alt="Captured signature"
                  className="w-full h-20 object-contain border rounded-lg"
                />
              </div>
            )}
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Adding...</span>
                </div>
              ) : (
                'Add Delivery'
              )}
            </Button>
          </div>
        </form>
      </div>
      
      {/* Signature Canvas Modal */}
      {showSignatureCanvas && (
        <SignatureCanvas
          onSave={(signatureDataUrl) => {
            setSignatureDataUrl(signatureDataUrl);
            setShowSignatureCanvas(false);
          }}
          onCancel={() => setShowSignatureCanvas(false)}
        />
      )}
    </div>
  );
} 