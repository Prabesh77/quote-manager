import React, { forwardRef } from 'react';
import { useQuickFillNotes } from '../../hooks/ui/useQuickFillNotes';
import QuickFillNotes from './QuickFillNotes';

interface QuickFillInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onQuickFillSelect?: () => void; // Callback when quick fill selection starts
  onPopupClose?: () => void; // Callback when quick fill popup is closed
  textMode?: boolean; // When true, looks like normal text when popup is closed
  loading?: boolean; // When true, shows loading spinner
}

const QuickFillInput = forwardRef<HTMLInputElement, QuickFillInputProps>(({
  value,
  onChange,
  placeholder = "Enter notes...",
  className = "",
  label,
  disabled = false,
  autoFocus = false,
  onQuickFillSelect,
  onPopupClose,
  textMode = false,
  loading = false
}, ref) => {
  const { isOpen, triggerRef, open, close } = useQuickFillNotes();

  const handleInputClick = () => {
    if (!disabled) {
      open();
    }
  };

  const handleQuickFillSelect = (selectedValue: string) => {
    // Notify parent that quick fill selection is happening
    if (onQuickFillSelect) {
      onQuickFillSelect();
    }
    onChange(selectedValue.toUpperCase());
  };

  const handleClose = () => {
    close();
    // Notify parent that popup is closing
    if (onPopupClose) {
      onPopupClose();
    }
  };


  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        ref={(element) => {
          // Forward the ref to parent component
          if (typeof ref === 'function') {
            ref(element);
          } else if (ref) {
            ref.current = element;
          }
          // Also set the triggerRef for positioning
          if (triggerRef) {
            triggerRef.current = element;
          }
        }}
        type="text"
        value={value.toUpperCase()}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        onClick={handleInputClick}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={`w-full px-3 py-1 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white cursor-text'
        } ${
          textMode && !isOpen ? 'opacity-0' : ''
        }`}
      />
      
      {/* Text element that looks like input when in text mode */}
      {textMode && !isOpen && (
        <div
          className="absolute top-0 left-0 w-full px-3 py-1 border border-transparent bg-transparent hover:border-gray-200 hover:bg-gray-50 cursor-text whitespace-nowrap text-gray-500 flex items-center"
          onClick={handleInputClick}
          style={{ zIndex: 1 }}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-400">Saving...</span>
            </>
          ) : (
            value || placeholder
          )}
        </div>
      )}

      {/* Quick Fill Notes Popup */}
      <QuickFillNotes
        isOpen={isOpen}
        onClose={handleClose}
        onSelect={handleQuickFillSelect}
        triggerRef={triggerRef}
        currentValue={value}
      />
    </div>
  );
});

QuickFillInput.displayName = 'QuickFillInput';

export default QuickFillInput;
