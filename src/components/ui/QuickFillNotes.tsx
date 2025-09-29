import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface QuickFillNotesProps {
  onSelect: (value: string) => void;
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLDivElement | null>;
  currentValue?: string;
}

const QuickFillNotes: React.FC<QuickFillNotesProps> = ({
  onSelect,
  isOpen,
  onClose,
  triggerRef,
  currentValue = ''
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [selectedItems, setSelectedItems] = useState<{
    location?: string;
    availableIn?: string;
    brand?: string;
    info?: string[];
    eta?: string;
  }>({});

  // Parse current value to show selected items
  useEffect(() => {
    if (currentValue && currentValue.trim()) {
      const items: any = {};
      const parts = currentValue.split(' | ').map(part => part.trim()).filter(part => part);
      
      parts.forEach(part => {
        if (part.startsWith('EX ')) {
          items.location = part.replace('EX ', '').trim();
        } else if (part.startsWith('AVAILABLE IN ')) {
          items.availableIn = part.replace('AVAILABLE IN ', '').trim();
        } else if (part.startsWith('ETA ')) {
          items.eta = part.replace('ETA ', '').trim();
        } else if (['STOCK ARRIVING', 'ON BACKORDER', 'INVOICE PRICE: $', 'COMPLETE FAN ASSEMBLY', 'GENUINE WITH BRACKET', 'GENUINE WITHOUT BRACKET'].includes(part.toUpperCase())) {
          if (!items.info) items.info = [];
          if (!items.info.includes(part.toUpperCase())) {
            items.info.push(part.toUpperCase());
          }
        } else if (['GENUINE WITH LOGO', 'ZILAX', 'CRYOMAX', 'KOYO', 'DELPHI', 'MAHLE', 'DENSO', 'DELANG', 'NRF', 'HELLA', 'VALEO'].includes(part.toUpperCase())) {
          items.brand = part.toUpperCase();
        } else if (part.toUpperCase() === 'GENUINE') {
          items.brand = 'GENUINE';
        }
      });
      
      setSelectedItems(items);
    } else {
      // Reset selected items if no current value
      setSelectedItems({});
    }
  }, [currentValue]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  // Close popup when pressing Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Update position on scroll
  useEffect(() => {
    const handleScroll = () => {
      // Force re-render to update position
      if (isOpen) {
        // This will trigger a re-render and recalculate position
        setSelectedItems(prev => ({ ...prev }));
      }
    };

    if (isOpen) {
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleScroll);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen]);

  const handleSelect = (section: string, value: string, displayValue: string) => {
    const newSelectedItems = { ...selectedItems };
    
    if (section === 'info') {
      // Handle multiple selection for info items
      if (!newSelectedItems.info) newSelectedItems.info = [];
      if (newSelectedItems.info.includes(displayValue)) {
        // Remove if already selected
        newSelectedItems.info = newSelectedItems.info.filter(item => item !== displayValue);
      } else {
        // Add if not selected
        newSelectedItems.info.push(displayValue);
      }
    } else {
      // Replace existing item in the same section (no need to delete first)
      if (section === 'location') {
        newSelectedItems.location = displayValue;
      } else if (section === 'availableIn') {
        newSelectedItems.availableIn = displayValue;
      } else if (section === 'brand') {
        newSelectedItems.brand = displayValue;
      } else if (section === 'eta') {
        newSelectedItems.eta = displayValue;
      }
    }
    
    // Build the final string by combining existing text with new quick fill items
    const parts = [];
    if (newSelectedItems.location) parts.push(`EX ${newSelectedItems.location.toUpperCase()}`);
    if (newSelectedItems.availableIn) parts.push(`AVAILABLE IN ${newSelectedItems.availableIn.toUpperCase()}`);
    if (newSelectedItems.brand) parts.push(newSelectedItems.brand);
    if (newSelectedItems.info && newSelectedItems.info.length > 0) {
      parts.push(...newSelectedItems.info);
    }
    if (newSelectedItems.eta) parts.push(`ETA ${newSelectedItems.eta}`);
    
    // Combine quick fill items with any existing custom text
    const quickFillText = parts.join(' | ');
    const existingText = currentValue.trim();
    
    let finalValue = quickFillText;
    
    // If there's existing text that's not part of quick fill items, append it
    if (existingText && existingText !== quickFillText) {
      // Extract custom text by removing quick fill patterns
      const quickFillPatterns = [
        /EX\s+[A-Z\s]+/g,
        /AVAILABLE\s+IN\s+[A-Z\s]+/g,
        /ETA\s+[A-Z0-9\s]+/g,
        /GENUINE\s+WITH\s+BRACKET/g,
        /GENUINE\s+WITHOUT\s+BRACKET/g,
        /STOCK\s+ARRIVING/g,
        /ON\s+BACKORDER/g,
        /INVOICE\s+PRICE:\s+\$/g,
        /COMPLETE\s+FAN\s+ASSEMBLY/g,
        /GENUINE\s+WITH\s+LOGO/g,
        /\bGENUINE\b/g,
        /\bZILAX\b/g,
        /\bCRYOMAX\b/g,
        /\bKOYO\b/g,
        /\bDELPHI\b/g,
        /\bMAHLE\b/g,
        /\bDENSO\b/g,
        /\bDELANG\b/g,
        /\bNRF\b/g,
        /\bHELLA\b/g,
        /\bVALEO\b/g
      ];
      
      let customText = existingText;
      quickFillPatterns.forEach(pattern => {
        customText = customText.replace(pattern, '').trim();
      });
      
      // Clean up separators
      customText = customText.replace(/\|\s*\|\s*/g, '|').replace(/^\|\s*|\s*\|$/g, '').trim();
      
      if (customText) {
        finalValue = quickFillText ? `${quickFillText} | ${customText}` : customText;
      }
    }
    
    // Update local state first
    setSelectedItems(newSelectedItems);
    
    // Use a longer timeout to ensure state is fully updated
    setTimeout(() => {
      onSelect(finalValue);
    }, 50);
  };

  const removeItem = (section: string, itemValue?: string) => {
    const newSelectedItems = { ...selectedItems };
    
    if (section === 'info' && itemValue) {
      // Remove specific info item
      if (newSelectedItems.info) {
        newSelectedItems.info = newSelectedItems.info.filter(item => item !== itemValue);
        if (newSelectedItems.info.length === 0) {
          delete newSelectedItems.info;
        }
      }
    } else {
      // Remove entire section
      delete newSelectedItems[section as keyof typeof newSelectedItems];
    }
    
    const parts = [];
    if (newSelectedItems.location) parts.push(`EX ${newSelectedItems.location.toUpperCase()}`);
    if (newSelectedItems.availableIn) parts.push(`AVAILABLE IN ${newSelectedItems.availableIn.toUpperCase()}`);
    if (newSelectedItems.brand) parts.push(newSelectedItems.brand);
    if (newSelectedItems.info && newSelectedItems.info.length > 0) {
      parts.push(...newSelectedItems.info);
    }
    if (newSelectedItems.eta) parts.push(`ETA ${newSelectedItems.eta}`);
    
    // Combine remaining quick fill items with any existing custom text
    const quickFillText = parts.join(' | ');
    const existingText = currentValue.trim();
    
    let finalValue = quickFillText;
    
    // If there's existing text that's not part of quick fill items, append it
    if (existingText && existingText !== quickFillText) {
      // Extract custom text by removing quick fill patterns
      const quickFillPatterns = [
        /EX\s+[A-Z\s]+/g,
        /AVAILABLE\s+IN\s+[A-Z\s]+/g,
        /ETA\s+[A-Z0-9\s]+/g,
        /GENUINE\s+WITH\s+BRACKET/g,
        /GENUINE\s+WITHOUT\s+BRACKET/g,
        /STOCK\s+ARRIVING/g,
        /ON\s+BACKORDER/g,
        /INVOICE\s+PRICE:\s+\$/g,
        /COMPLETE\s+FAN\s+ASSEMBLY/g,
        /GENUINE\s+WITH\s+LOGO/g,
        /\bGENUINE\b/g,
        /\bZILAX\b/g,
        /\bCRYOMAX\b/g,
        /\bKOYO\b/g,
        /\bDELPHI\b/g,
        /\bMAHLE\b/g,
        /\bDENSO\b/g,
        /\bDELANG\b/g,
        /\bNRF\b/g,
        /\bHELLA\b/g,
        /\bVALEO\b/g
      ];
      
      let customText = existingText;
      quickFillPatterns.forEach(pattern => {
        customText = customText.replace(pattern, '').trim();
      });
      
      // Clean up separators
      customText = customText.replace(/\|\s*\|\s*/g, '|').replace(/^\|\s*|\s*\|$/g, '').trim();
      
      if (customText) {
        finalValue = quickFillText ? `${quickFillText} | ${customText}` : customText;
      }
    }
    
    // Update local state first
    setSelectedItems(newSelectedItems);
    
    // Use a longer timeout to ensure state is fully updated
    setTimeout(() => {
      onSelect(finalValue);
    }, 50);
  };

  if (!isOpen) return null;

  // Safety check for SSR
  if (typeof document === 'undefined') return null;

  // Calculate position relative to viewport
  const getPopupPosition = () => {
    if (!triggerRef.current) {
      return { top: 0, left: 0 };
    }
    
    const rect = triggerRef.current.getBoundingClientRect();
    const popupWidth = 800; // Width of the popup (5 columns)
    const popupHeight = 320; // Approximate height of the popup
    
    // Calculate initial position
    let left = rect.left;
    let top = rect.bottom + 5;
    
    // Check if popup would go off the right edge
    if (left + popupWidth > window.innerWidth) {
      left = window.innerWidth - popupWidth - 10;
    }
    
    // Check if popup would go off the left edge
    if (left < 10) {
      left = 10;
    }
    
    // Check if popup would go off the bottom edge
    if (top + popupHeight > window.innerHeight) {
      // Show above the input instead
      top = rect.top - popupHeight - 5;
    }
    
    // Ensure popup doesn't go above the top of the viewport
    if (top < 10) {
      top = 10;
    }
    
    return { top, left };
  };

  const position = getPopupPosition();

  // Create portal to render at document body level
  return createPortal(
    <div
      ref={popupRef}
      className="fixed z-[9999] w-[800px] bg-white border border-gray-200 rounded-lg shadow-lg max-h-200 overflow-y-auto"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* Editable Preview Area */}
      <div className="p-2 border-b border-gray-100 bg-gray-50">
        <h3 className="text-xs font-semibold text-gray-700 mb-2">NOTES PREVIEW</h3>
        <textarea
          value={currentValue}
          onChange={(e) => onSelect(e.target.value)}
          placeholder="Click quick fill options above or type custom notes here..."
          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows={2}
          style={{ minHeight: '40px' }}
        />
        {Object.keys(selectedItems).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {selectedItems.location && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md flex items-center gap-1">
                EX {selectedItems.location}
                <button
                  onClick={() => removeItem('location')}
                  className="text-blue-500 hover:text-blue-700"
                >
                  ×
                </button>
              </span>
            )}
            {selectedItems.availableIn && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md flex items-center gap-1">
                AVAILABLE IN {selectedItems.availableIn}
                <button
                  onClick={() => removeItem('availableIn')}
                  className="text-green-500 hover:text-green-700"
                >
                  ×
                </button>
              </span>
            )}
            {selectedItems.brand && (
              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-md flex items-center gap-1">
                {selectedItems.brand}
                <button
                  onClick={() => removeItem('brand')}
                  className="text-purple-500 hover:text-purple-700"
                >
                  ×
                </button>
              </span>
            )}
            {selectedItems.info && selectedItems.info.map((infoItem, index) => (
              <span key={index} className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-md flex items-center gap-1">
                {infoItem}
                <button
                  onClick={() => removeItem('info', infoItem)}
                  className="text-orange-500 hover:text-orange-700"
                >
                  ×
                </button>
              </span>
            ))}
            {selectedItems.eta && (
              <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-md flex items-center gap-1">
                ETA {selectedItems.eta}
                <button
                  onClick={() => removeItem('eta')}
                  className="text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-5 gap-2 p-3">
        {/* Ex Section */}
        <div className="border border-gray-200 rounded-lg p-2 bg-blue-50 min-w-0">
          <h3 className="text-xs font-semibold text-blue-700 mb-2 text-center">EX</h3>
          <div className="space-y-1">
            {['SYDNEY', 'BRISBANE', 'MELBOURNE', 'PERTH', 'WESTERN AUSTRALIA', 'VICTORIA', 'QUEENSLAND', 'EAST COAST'].map((location) => (
              <button
                key={location}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect('location', location, location);
                }}
                className={`w-full px-2 py-1 text-xs rounded-md transition-colors truncate ${
                  selectedItems.location === location
                    ? 'bg-blue-200 text-blue-800'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
                title={location}
              >
                {location}
              </button>
            ))}
          </div>
        </div>

        {/* Available In Section */}
        <div className="border border-gray-200 rounded-lg p-2 bg-green-50 min-w-0">
          <h3 className="text-xs font-semibold text-green-700 mb-2 text-center">AVAILABLE IN</h3>
          <div className="space-y-1">
            {['SYDNEY', 'BRISBANE', 'MELBOURNE', 'PERTH', 'WESTERN AUSTRALIA', 'VICTORIA', 'QUEENSLAND', 'EAST COAST'].map((location) => (
              <button
                key={location}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect('availableIn', location, location);
                }}
                className={`w-full px-2 py-1 text-xs rounded-md transition-colors truncate ${
                  selectedItems.availableIn === location
                    ? 'bg-green-200 text-green-800'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
                title={location}
              >
                {location}
              </button>
            ))}
          </div>
        </div>

        {/* Brands Section */}
        <div className="border border-gray-200 rounded-lg p-2 bg-purple-50 min-w-0">
          <h3 className="text-xs font-semibold text-purple-700 mb-2 text-center">BRANDS</h3>
          <div className="space-y-1">
            {[
              'GENUINE', 'GENUINE WITH LOGO', 'ZILAX', 'CRYOMAX', 'KOYO', 'DELPHI', 'MAHLE', 'DENSO', 'DELANG', 'NRF', 'HELLA', 'VALEO'
            ].map((brand) => (
              <button
                key={brand}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect('brand', brand, brand);
                }}
                className={`w-full px-2 py-1 text-xs rounded-md transition-colors truncate ${
                  selectedItems.brand === brand
                    ? 'bg-purple-200 text-purple-800'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
                title={brand}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        {/* Stock & Info Section */}
        <div className="border border-gray-200 rounded-lg p-2 bg-orange-50 min-w-0">
          <h3 className="text-xs font-semibold text-orange-700 mb-2 text-center">STOCK & INFO</h3>
          
          {/* Stock Section */}
          <div className="mb-3">
            <h4 className="text-xs font-medium text-orange-600 mb-1">STOCK</h4>
            <div className="space-y-1">
              {['STOCK ARRIVING', 'ON BACKORDER', 'INVOICE PRICE: $', 'COMPLETE FAN ASSEMBLY'].map((stock) => (
                <button
                  key={stock}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect('info', stock, stock);
                  }}
                  className={`w-full px-2 py-1 text-xs rounded-md transition-colors truncate ${
                    selectedItems.info && selectedItems.info.includes(stock)
                      ? 'bg-orange-200 text-orange-800'
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  }`}
                  title={stock}
                >
                  {stock}
                </button>
              ))}
            </div>
          </div>
          
          {/* Info Section */}
          <div>
            <h4 className="text-xs font-medium text-orange-600 mb-1">INFO</h4>
            <div className="space-y-1">
              {['GENUINE WITH BRACKET', 'GENUINE WITHOUT BRACKET'].map((info) => (
                <button
                  key={info}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSelect('info', info, info);
                  }}
                  className={`w-full px-2 py-1 text-xs rounded-md transition-colors truncate ${
                    selectedItems.info && selectedItems.info.includes(info)
                      ? 'bg-orange-200 text-orange-800'
                      : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  }`}
                  title={info}
                >
                  {info}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ETA Section */}
        <div className="border border-gray-200 rounded-lg p-2 bg-red-50 min-w-0">
          <h3 className="text-xs font-semibold text-red-700 mb-2 text-center">ETA</h3>
          <div className="space-y-1">
            {[
              'NEXT DAY', '1 DAY', '2 DAYS', '3 DAYS', '5 DAYS', '1 WEEK', '2 WEEKS', '3 WEEKS', '1 MONTH', '2 MONTHS'
            ].map((eta) => (
              <button
                key={eta}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect('eta', eta, eta);
                }}
                className={`w-full px-2 py-1 text-xs rounded-md transition-colors truncate ${
                  selectedItems.eta === eta
                    ? 'bg-red-200 text-red-800'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
                title={eta}
              >
                {eta}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QuickFillNotes;
