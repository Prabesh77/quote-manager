'use client';

import { Edit, Trash2, Save, X, CheckCircle, ShoppingCart, Check } from 'lucide-react';
import { QuoteStatus } from '@/types/common';

interface QuoteActionsProps {
  quoteId: string;
  status: QuoteStatus;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onMarkCompleted?: () => void;
  onMarkAsOrdered?: () => void;
  onVerifyPrice?: () => void;
  showCompleted?: boolean;
  showVerifyAction?: boolean;
  className?: string;
}

export const QuoteActions = ({
  quoteId,
  status,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onMarkCompleted,
  onMarkAsOrdered,
  onVerifyPrice,
  showCompleted = false,
  showVerifyAction = false,
  className = ''
}: QuoteActionsProps) => {
  const shouldShowActions = (status !== 'completed' && status !== 'ordered') || showCompleted;

  if (!shouldShowActions) return null;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {isEditing ? (
        <>
          <button
            onClick={onSave}
            className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors cursor-pointer"
            title="Save changes"
          >
            <Save className="h-4 w-4" />
          </button>
          <button
            onClick={onCancel}
            className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer"
            title="Cancel editing"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <button
            onClick={onEdit}
            className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors cursor-pointer"
            title="Edit quote"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors cursor-pointer"
            title="Delete quote"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          
          {status === 'waiting_verification' && showVerifyAction && onVerifyPrice && (
            <button
              onClick={onVerifyPrice}
              className="p-1.5 bg-green-500 hover:bg-green-600 rounded-full transition-colors cursor-pointer"
              title="Verify and approve price"
            >
              <Check className="h-5 w-5 text-white" />
            </button>
          )}
          
          {status === 'priced' && onMarkCompleted && (
            <button
              onClick={onMarkCompleted}
              className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors cursor-pointer"
              title="Mark as completed"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
          
          {status === 'completed' && onMarkAsOrdered && (
            <button
              onClick={onMarkAsOrdered}
              className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded transition-colors cursor-pointer"
              title="Mark as order"
            >
              <ShoppingCart className="h-4 w-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
}; 