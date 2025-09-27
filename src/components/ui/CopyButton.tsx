'use client';

import React, { useState, useCallback } from 'react';
import { Copy, CheckCircle } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  iconClassName?: string;
  onClick?: (e: React.MouseEvent) => void;
}

const CopyButton: React.FC<CopyButtonProps> = ({
  text,
  title = 'Copy to clipboard',
  size = 'md',
  className = '',
  iconClassName = '',
  onClick
}) => {
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  const copyToClipboard = useCallback(async (textToCopy: string, event?: React.MouseEvent) => {
    if (onClick) {
      onClick(event!);
    }

    try {
      await navigator.clipboard.writeText(textToCopy);

      // Create a unique key for this copied item
      const copiedKey = `${textToCopy}_${Date.now()}`;
      
      // Add to copied items set
      setCopiedItems(prev => new Set([...prev, copiedKey]));

      // Remove from copied items after 1.5 seconds
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(copiedKey);
          return newSet;
        });
      }, 1500);

    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, [onClick]);

  // Helper function to check if this specific text was recently copied
  const isRecentlyCopied = useCallback((textToCheck: string) => {
    return Array.from(copiedItems).some(key => key.startsWith(`${textToCheck}_`));
  }, [copiedItems]);

  // Size configurations
  const sizeConfig = {
    sm: {
      button: 'p-1',
      icon: 'h-3 w-3'
    },
    md: {
      button: 'p-1.5',
      icon: 'h-4 w-4'
    },
    lg: {
      button: 'p-2',
      icon: 'h-5 w-5'
    }
  };

  const config = sizeConfig[size];
  const isCopied = isRecentlyCopied(text);

  return (
    <button
      onClick={(e) => copyToClipboard(text, e)}
      className={`${config.button} ${className}`}
      title={title}
    >
      {isCopied ? (
        <CheckCircle className={`${config.icon} text-green-500 ${iconClassName}`} />
      ) : (
        <Copy className={`${config.icon} ${iconClassName}`} />
      )}
    </button>
  );
};

export default CopyButton;
