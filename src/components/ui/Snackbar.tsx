'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface SnackbarProps {
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

export const Snackbar = ({ 
  message, 
  type = 'error', 
  duration = 5000, 
  onClose 
}: SnackbarProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const getStyles = () => {
    switch (type) {
      case 'error':
        return 'bg-red-500 text-white border-red-600';
      case 'success':
        return 'bg-green-500 text-white border-green-600';
      case 'warning':
        return 'bg-yellow-500 text-white border-yellow-600';
      case 'info':
        return 'bg-blue-500 text-white border-blue-600';
      default:
        return 'bg-red-500 text-white border-red-600';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-5 w-5 flex-shrink-0" />;
      case 'success':
        return <div className="h-5 w-5 flex-shrink-0 rounded-full bg-white bg-opacity-20 flex items-center justify-center">✓</div>;
      case 'warning':
        return <AlertCircle className="h-5 w-5 flex-shrink-0" />;
      case 'info':
        return <div className="h-5 w-5 flex-shrink-0 rounded-full bg-white bg-opacity-20 flex items-center justify-center">i</div>;
      default:
        return <AlertCircle className="h-5 w-5 flex-shrink-0" />;
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full transform transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div
        className={`${getStyles()} rounded-lg shadow-lg border-l-4 p-4 flex items-start space-x-3`}
      >
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-5 break-words">
            {message}
          </p>
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
        >
          <X className="h-4 w-4" />
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
      {/* Render snackbars */}
      {snackbars.map((snackbar, index) => (
        <div
          key={snackbar.id}
          style={{ top: `${1 + index * 5}rem` }}
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