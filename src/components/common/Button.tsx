'use client';

import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  title?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
  fullWidth = false,
  icon,
  title
}) => {
  const baseClasses = "inline-flex items-center justify-center font-medium transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    warning: "bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500",
    info: "bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500",
    ghost: "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500"
  };

  const sizeClasses = {
    xs: "px-3 py-1 text-xs rounded",
    sm: "px-3 py-1.5 text-sm rounded",
    md: "px-4 py-2 text-sm rounded-lg",
    lg: "px-6 py-3 text-base rounded-lg"
  };

  const widthClass = fullWidth ? "w-full" : "";
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`;

  return (
    <button
      type={type}
      onClick={onClick}
      className={classes}
      disabled={disabled}
      title={title}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

// Specialized button variants for common use cases
export const PrimaryButton: React.FC<Omit<ButtonProps, 'variant'> & {
  className?: string;
}> = ({ className = '', ...props }) => (
  <Button
    {...props}
    variant="primary"
    className={className}
  />
);

export const SecondaryButton: React.FC<Omit<ButtonProps, 'variant'> & {
  className?: string;
}> = ({ className = '', ...props }) => (
  <Button
    {...props}
    variant="secondary"
    className={className}
  />
);

export const SuccessButton: React.FC<Omit<ButtonProps, 'variant'> & {
  className?: string;
}> = ({ className = '', ...props }) => (
  <Button
    {...props}
    variant="success"
    className={className}
  />
);

export const DangerButton: React.FC<Omit<ButtonProps, 'variant'> & {
  className?: string;
}> = ({ className = '', ...props }) => (
  <Button
    {...props}
    variant="danger"
    className={className}
  />
);

export const GhostButton: React.FC<Omit<ButtonProps, 'variant'> & {
  className?: string;
}> = ({ className = '', ...props }) => (
  <Button
    {...props}
    variant="ghost"
    className={className}
  />
);

// Icon button variants
export const IconButton: React.FC<Omit<ButtonProps, 'size' | 'children'> & {
  icon: React.ReactNode;
  label: string;
  className?: string;
}> = ({ icon, label, className = '', ...props }) => (
  <Button
    {...props}
    size="xs"
    className={`p-2 ${className}`}
    title={label}
  >
    {icon}
  </Button>
);

// Small action buttons (like the ones in QuoteTable)
export const SmallActionButton: React.FC<Omit<ButtonProps, 'size' | 'variant'> & {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
  className?: string;
}> = ({ variant = 'primary', icon, className = '', children, ...props }) => (
  <Button
    {...props}
    variant={variant}
    size="xs"
    className={`flex items-center space-x-1 ${className}`}
    icon={icon}
  >
    {children}
  </Button>
);

// Large action buttons (like the modal buttons)
export const LargeActionButton: React.FC<Omit<ButtonProps, 'size' | 'variant'> & {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'ghost';
  fullWidth?: boolean;
  className?: string;
}> = ({ variant = 'primary', fullWidth = false, className = '', ...props }) => (
  <Button
    {...props}
    variant={variant}
    size="md"
    fullWidth={fullWidth}
    className={className}
  />
);

// Button group for multiple buttons
export const ButtonGroup: React.FC<{
  children: React.ReactNode;
  className?: string;
  direction?: 'horizontal' | 'vertical';
}> = ({ children, className = '', direction = 'horizontal' }) => {
  const directionClass = direction === 'horizontal' ? 'flex space-x-3' : 'flex flex-col space-y-3';
  
  return (
    <div className={`${directionClass} ${className}`}>
      {children}
    </div>
  );
};
