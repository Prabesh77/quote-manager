'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';

interface SnackbarProps {
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

export const Snackbar = ({ 
  message, 
  type = 'error', 
  duration = 4000, 
  onClose 
}: SnackbarProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Small delay for entrance animation
    const entranceTimer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    const exitTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(exitTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 100);
    }, 200);
  };

  const getStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 shadow-red-100 hover:border-red-300';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 shadow-green-100 hover:border-green-300';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800 shadow-yellow-100 hover:border-yellow-300';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800 shadow-blue-100 hover:border-blue-300';
      default:
        return 'bg-red-50 border-red-200 text-red-800 shadow-red-100 hover:border-red-300';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
      case 'success':
        return <CheckCircle className="h-3.5 w-3.5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />;
      case 'info':
        return <Info className="h-3.5 w-3.5 text-blue-500" />;
      default:
        return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'error':
        return 'bg-red-100';
      case 'success':
        return 'bg-green-100';
      case 'warning':
        return 'bg-yellow-100';
      case 'info':
        return 'bg-blue-100';
      default:
        return 'bg-red-100';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-xs w-full transform transition-all duration-200 ease-out hover:scale-[1.02] ${
        !isVisible 
          ? 'translate-x-full opacity-0 scale-95' 
          : isExiting 
            ? 'translate-x-full opacity-0 scale-95' 
            : 'translate-x-0 opacity-100 scale-100'
      }`}
    >
      <div
        className={`${getStyles()} rounded-lg border shadow-lg hover:shadow-xl backdrop-blur-sm flex items-center space-x-2.5 p-2.5 transition-all duration-200 ease-out`}
      >
        {/* Icon with background */}
        <div className={`${getIconBg()} rounded-md p-1 flex-shrink-0`}>
          {getIcon()}
        </div>
        
        {/* Message */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium leading-tight break-words">
            {message}
          </p>
        </div>
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-5 rounded-md transition-all duration-150 ease-out hover:scale-110 active:scale-95"
          title="Close notification"
        >
          <X className="h-3 w-3 text-gray-500" />
        </button>
      </div>
    </div>
  );
};

// Snackbar Manager Context
interface SnackbarContextType {
  showSnackbar: (message: string, type?: 'error' | 'success' | 'warning' | 'info') => void;
}

const SnackbarContext = React.createContext<SnackbarContextType | undefined>(undefined);

export const useSnackbar = () => {
  const context = React.useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};

interface SnackbarProviderProps {
  children: React.ReactNode;
}

export const SnackbarProvider = ({ children }: SnackbarProviderProps) => {
  const [snackbars, setSnackbars] = useState<Array<{
    id: string;
    message: string;
    type: 'error' | 'success' | 'warning' | 'info';
  }>>([]);

  const showSnackbar = (message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error') => {
    const id = Math.random().toString(36).substr(2, 9);
    setSnackbars(prev => [...prev, { id, message, type }]);
  };

  const removeSnackbar = (id: string) => {
    setSnackbars(prev => prev.filter(snackbar => snackbar.id !== id));
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      {/* Render snackbars with proper spacing */}
      {snackbars.map((snackbar, index) => (
        <div
          key={snackbar.id}
          style={{ top: `${1 + index * 3.5}rem` }}
          className="fixed right-4 z-50"
        >
          <Snackbar
            message={snackbar.message}
            type={snackbar.type}
            onClose={() => removeSnackbar(snackbar.id)}
          />
        </div>
      ))}
    </SnackbarContext.Provider>
  );
}; 