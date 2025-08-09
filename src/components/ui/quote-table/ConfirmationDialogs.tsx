import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  isOpen,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
        </div>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this quote? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

interface OrderConfirmationProps {
  isOpen: boolean;
  taxInvoiceNumber: string;
  onTaxInvoiceChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  selectedPartsCount?: number;
}

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  isOpen,
  taxInvoiceNumber,
  onTaxInvoiceChange,
  onConfirm,
  onCancel,
  selectedPartsCount
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Mark as Order</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {selectedPartsCount !== undefined && (
          <p className="text-gray-600 mb-4">
            {selectedPartsCount} part{selectedPartsCount !== 1 ? 's' : ''} will be included in this order.
          </p>
        )}
        
        <div className="mb-6">
          <label htmlFor="taxInvoice" className="block text-sm font-medium text-gray-700 mb-2">
            Tax Invoice Number
          </label>
          <input
            id="taxInvoice"
            type="text"
            value={taxInvoiceNumber}
            onChange={(e) => onTaxInvoiceChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter tax invoice number"
            autoFocus
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!taxInvoiceNumber.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-md transition-colors"
          >
            Mark as Order
          </button>
        </div>
      </div>
    </div>
  );
}; 