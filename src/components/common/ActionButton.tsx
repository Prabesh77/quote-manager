'use client';

import React from 'react';
import { LucideIcon, Copy, Edit3, Save, X, Trash2, CheckCircle, ShoppingCart } from 'lucide-react';

interface ActionButtonProps {
  onClick: (e: React.MouseEvent) => void;
  icon: LucideIcon;
  title: string;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  icon: Icon,
  title,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  children
}) => {
  const baseClasses = "inline-flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "text-blue-600 hover:text-blue-700 hover:bg-blue-100 focus:ring-blue-500",
    secondary: "text-gray-600 hover:text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
    success: "text-green-600 hover:text-green-700 hover:bg-green-100 focus:ring-green-500",
    danger: "text-red-600 hover:text-red-700 hover:bg-red-100 focus:ring-red-500",
    warning: "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100 focus:ring-yellow-500",
    info: "text-purple-600 hover:text-purple-700 hover:bg-purple-100 focus:ring-purple-500"
  };

  const sizeClasses = {
    sm: "p-1",
    md: "p-1.5",
    lg: "p-2"
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      onClick={onClick}
      className={classes}
      title={title}
      disabled={disabled}
    >
      <Icon className={iconSizes[size]} />
      {children}
    </button>
  );
};

// Specialized button variants for common use cases
export const CopyButton: React.FC<{
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ onClick, title = "Copy", size = 'md', className = '' }) => (
  <ActionButton
    onClick={onClick}
    icon={Copy}
    title={title}
    variant="secondary"
    size={size}
    className={className}
  />
);

export const EditButton: React.FC<{
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ onClick, title = "Edit", size = 'md', className = '' }) => (
  <ActionButton
    onClick={onClick}
    icon={Edit3}
    title={title}
    variant="primary"
    size={size}
    className={className}
  />
);

export const SaveButton: React.FC<{
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ onClick, title = "Save", size = 'md', className = '' }) => (
  <ActionButton
    onClick={onClick}
    icon={Save}
    title={title}
    variant="success"
    size={size}
    className={className}
  />
);

export const CancelButton: React.FC<{
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ onClick, title = "Cancel", size = 'md', className = '' }) => (
  <ActionButton
    onClick={onClick}
    icon={X}
    title={title}
    variant="primary"
    size={size}
    className={className}
  />
);

export const DeleteButton: React.FC<{
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ onClick, title = "Delete", size = 'md', className = '' }) => (
  <ActionButton
    onClick={onClick}
    icon={Trash2}
    title={title}
    variant="danger"
    size={size}
    className={className}
  />
);

export const VerifyButton: React.FC<{
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ onClick, title = "Verify", size = 'md', className = '' }) => (
  <ActionButton
    onClick={onClick}
    icon={CheckCircle}
    title={title}
    variant="success"
    size={size}
    className={`bg-green-600 hover:bg-green-700 text-white rounded-full ${className}`}
  />
);

export const CompleteButton: React.FC<{
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ onClick, title = "Complete", size = 'md', className = '' }) => (
  <ActionButton
    onClick={onClick}
    icon={CheckCircle}
    title={title}
    variant="success"
    size={size}
    className={className}
  />
);

export const OrderButton: React.FC<{
  onClick: (e: React.MouseEvent) => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ onClick, title = "Order", size = 'md', className = '' }) => (
  <ActionButton
    onClick={onClick}
    icon={ShoppingCart}
    title={title}
    variant="info"
    size={size}
    className={className}
  />
);
