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
}

const QuickFillInput = forwardRef<HTMLInputElement, QuickFillInputProps>(({
  value,
  onChange,
  placeholder = "Enter notes...",
  className = "",
  label,
  disabled = false
}, ref) => {
  const { isOpen, triggerRef, open, close } = useQuickFillNotes();

  const handleInputClick = () => {
    if (!disabled) {
      open();
    }
  };

  const handleQuickFillSelect = (selectedValue: string) => {
    onChange(selectedValue.toUpperCase());
  };

  return (
    <div className="relative">
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
        className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className} ${
          disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white cursor-text'
        }`}
      />
      
      {/* Quick Fill Icon */}
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16l-4-4m0 0l4-4m-4 4h18"
          />
        </svg>
      </div>

      {/* Quick Fill Notes Popup */}
      <QuickFillNotes
        isOpen={isOpen}
        onClose={close}
        onSelect={handleQuickFillSelect}
        triggerRef={triggerRef}
        currentValue={value}
      />
    </div>
  );
});

QuickFillInput.displayName = 'QuickFillInput';

export default QuickFillInput;
