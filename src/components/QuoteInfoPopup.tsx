'use client';

import React, { useState, useEffect } from 'react';
import { Info, User, DollarSign, CheckCircle, Calendar, X } from 'lucide-react';
import { QuoteActionsService } from '@/services/quoteActions/quoteActionsService';
import { QuoteActionWithUser } from '@/types/quoteActions';

interface QuoteInfoPopupProps {
  quoteId: string;
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLElement>;
}

const QuoteInfoPopup: React.FC<QuoteInfoPopupProps> = ({ quoteId, isOpen, onClose, triggerRef }) => {
  const [actions, setActions] = useState<QuoteActionWithUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && quoteId) {
      fetchQuoteActions();
      updatePosition();
    }
  }, [isOpen, quoteId]);

  useEffect(() => {
    const handleResize = () => updatePosition();
    const handleScroll = () => updatePosition();
    
    if (isOpen) {
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll);
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isOpen]);

  const fetchQuoteActions = async () => {
    setLoading(true);
    try {
      const result = await QuoteActionsService.getQuoteActionsByQuoteId(quoteId);
      if (result) {
        setActions(result);
      }
    } catch (error) {
      console.error('Error fetching quote actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const popupWidth = 320;
      const popupHeight = 200;
      
      let top = rect.bottom + 8;
      let left = rect.right - popupWidth;
      
      // Adjust if popup would go off screen
      if (left < 8) {
        left = rect.left;
      }
      if (top + popupHeight > window.innerHeight - 8) {
        top = rect.top - popupHeight - 8;
      }
      
      setPosition({ top, left });
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'CREATED':
        return <User className="h-4 w-4 text-blue-600" />;
      case 'PRICED':
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-purple-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (actionType: string) => {
    switch (actionType) {
      case 'CREATED':
        return 'text-blue-600 bg-blue-50';
      case 'PRICED':
        return 'text-green-600 bg-green-50';
      case 'COMPLETED':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Popup */}
      <div 
        className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80"
        style={{ top: position.top, left: position.left }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">Quote History</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : actions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-gray-500">No actions recorded yet</p>
            </div>
          ) : (
            actions.map((action) => (
              <div key={action.id} className="flex items-start space-x-3">
                <div className={`flex-shrink-0 p-2 rounded-full ${getActionColor(action.action_type)}`}>
                  {getActionIcon(action.action_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {action.action_type.toLowerCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      by {action.user?.raw_user_meta_data?.full_name || action.user?.email || 'User'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 mt-1">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {formatDate(action.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default QuoteInfoPopup;
