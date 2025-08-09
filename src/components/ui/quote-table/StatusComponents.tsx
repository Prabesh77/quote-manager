import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { QuoteStatus } from './types';
import { getDeadlineInfo } from './utils';

interface StatusChipProps {
  status: QuoteStatus;
}

export const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  const getStatusConfig = (status: QuoteStatus) => {
    switch (status) {
      case 'unpriced':
        return {
          label: 'Waiting for Price',
          className: 'bg-gray-100 text-gray-800',
        };
      case 'waiting_verification':
        return {
          label: 'Waiting for Verification',
          className: 'bg-amber-100 text-amber-800',
        };
      case 'priced':
        return {
          label: 'Priced',
          className: 'bg-blue-100 text-blue-800',
        };
      case 'completed':
        return {
          label: 'Completed',
          className: 'bg-green-100 text-green-800',
        };
      case 'ordered':
        return {
          label: 'Ordered',
          className: 'bg-purple-100 text-purple-800',
        };
      case 'delivered':
        return {
          label: 'Delivered',
          className: 'bg-indigo-100 text-indigo-800',
        };
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-800',
        };
    }
  };

  const { label, className } = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
};

interface DeadlineIndicatorProps {
  requiredBy: string | undefined;
}

export const DeadlineIndicator: React.FC<DeadlineIndicatorProps> = ({ requiredBy }) => {
  if (!requiredBy) return null;

  const deadlineInfo = getDeadlineInfo(requiredBy);
  if (!deadlineInfo) return null;

  const { isOverdue, isUrgent, daysRemaining, color, bgColor } = deadlineInfo;

  const getDeadlineText = () => {
    if (isOverdue) {
      return `${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} overdue`;
    }
    if (daysRemaining === 0) {
      return 'Due today';
    }
    if (daysRemaining === 1) {
      return 'Due tomorrow';
    }
    return `${daysRemaining} days remaining`;
  };

  const getIcon = () => {
    if (isOverdue) {
      return <AlertTriangle className="h-3 w-3 mr-1" />;
    }
    if (isUrgent) {
      return <AlertTriangle className="h-3 w-3 mr-1" />;
    }
    return <CheckCircle className="h-3 w-3 mr-1" />;
  };

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${color} ${bgColor}`}>
      {getIcon()}
      {getDeadlineText()}
    </div>
  );
};

interface VerifyButtonProps {
  quoteId: string;
  onVerify: (quoteId: string) => Promise<void>;
}

export const VerifyButton: React.FC<VerifyButtonProps> = ({ quoteId, onVerify }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onVerify(quoteId);
  };

  return (
    <button
      onClick={handleClick}
      className="p-1 bg-green-600 hover:bg-green-700 text-white rounded-full transition-colors cursor-pointer"
      title="Confirm pricing and move to priced status"
    >
      <CheckCircle className="h-5 w-5 font-bold" />
    </button>
  );
}; 