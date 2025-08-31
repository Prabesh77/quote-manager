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
    info?: string;
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
        } else if (['STOCK ARRIVING', 'ON BACKORDER'].includes(part.toUpperCase())) {
          items.info = part.toUpperCase();
        } else if (['GENUINE', 'ZILAX', 'KOYO', 'CRYOMAX', 'MAHLE', 'DELPHI', 'DENSO', 'GENUINE WITH LOGO', 'GENUINE WITH BRACKET', 'GEN. W/O BRACKET'].includes(part.toUpperCase())) {
          items.brand = part.toUpperCase();
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
    // Prevent duplicate selections
    if (selectedItems[section as keyof typeof selectedItems] === displayValue) {
      return;
    }
    
    const newSelectedItems = { ...selectedItems };
    
    // Remove existing item from the same section
    if (section === 'location') {
      delete newSelectedItems.location;
    } else if (section === 'availableIn') {
      delete newSelectedItems.availableIn;
    } else if (section === 'brand') {
      delete newSelectedItems.brand;
    } else if (section === 'info') {
      delete newSelectedItems.info;
    } else if (section === 'eta') {
      delete newSelectedItems.eta;
    }
    
    // Add new item
    newSelectedItems[section as keyof typeof newSelectedItems] = displayValue;
    
    // Build the final string
    const parts = [];
    if (newSelectedItems.location) parts.push(`EX ${newSelectedItems.location.toUpperCase()}`);
    if (newSelectedItems.availableIn) parts.push(`AVAILABLE IN ${newSelectedItems.availableIn.toUpperCase()}`);
    if (newSelectedItems.brand) parts.push(newSelectedItems.brand);
    if (newSelectedItems.info) parts.push(newSelectedItems.info);
    if (newSelectedItems.eta) parts.push(`ETA ${newSelectedItems.eta}`);
    
    const finalValue = parts.join(' | ');
    
    // Update local state first
    setSelectedItems(newSelectedItems);
    
    // Use a longer timeout to ensure state is fully updated
    setTimeout(() => {
      onSelect(finalValue);
    }, 50);
  };

  const removeItem = (section: string) => {
    const newSelectedItems = { ...selectedItems };
    delete newSelectedItems[section as keyof typeof newSelectedItems];
    
    const parts = [];
    if (newSelectedItems.location) parts.push(`EX ${newSelectedItems.location.toUpperCase()}`);
    if (newSelectedItems.availableIn) parts.push(`AVAILABLE IN ${newSelectedItems.availableIn.toUpperCase()}`);
    if (newSelectedItems.brand) parts.push(newSelectedItems.brand);
    if (newSelectedItems.info) parts.push(newSelectedItems.info);
    if (newSelectedItems.eta) parts.push(`ETA ${newSelectedItems.eta}`);
    
    const finalValue = parts.join(' | ');
    
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
      console.log('❌ No triggerRef.current');
      return { top: 0, left: 0 };
    }
    
    const rect = triggerRef.current.getBoundingClientRect();
    console.log('📍 Input element position:', {
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
      right: rect.right,
      width: rect.width,
      height: rect.height
    });
    
    const popupWidth = 700; // Width of the popup
    const popupHeight = 320; // Approximate height of the popup
    
    // Calculate initial position
    let left = rect.left;
    let top = rect.bottom + 5;
    
    console.log('📍 Initial popup position:', { top, left });
    
    // Check if popup would go off the right edge
    if (left + popupWidth > window.innerWidth) {
      left = window.innerWidth - popupWidth - 10;
      console.log('📍 Adjusted left for right edge:', left);
    }
    
    // Check if popup would go off the left edge
    if (left < 10) {
      left = 10;
      console.log('📍 Adjusted left for left edge:', left);
    }
    
    // Check if popup would go off the bottom edge
    if (top + popupHeight > window.innerHeight) {
      // Show above the input instead
      top = rect.top - popupHeight - 5;
      console.log('📍 Adjusted top to show above input:', top);
    }
    
    // Ensure popup doesn't go above the top of the viewport
    if (top < 10) {
      top = 10;
      console.log('📍 Adjusted top for viewport top:', top);
    }
    
    console.log('📍 Final popup position:', { top, left });
    return { top, left };
  };

  const position = getPopupPosition();

  // Create portal to render at document body level
  return createPortal(
    <div
      ref={popupRef}
      className="fixed z-[9999] w-[700px] bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {/* Selected Items Display */}
      {Object.keys(selectedItems).length > 0 && (
        <div className="p-2 border-b border-gray-100 bg-gray-50">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">SELECTED ITEMS</h3>
          <div className="flex flex-wrap gap-1">
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
            {selectedItems.info && (
              <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-md flex items-center gap-1">
                {selectedItems.info}
                <button
                  onClick={() => removeItem('info')}
                  className="text-orange-500 hover:text-orange-700"
                >
                  ×
                </button>
              </span>
            )}
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
        </div>
      )}

      {/* Main Sections Grid */}
      <div className="grid grid-cols-5 gap-2 p-3">
        {/* Ex Section */}
        <div className="border border-gray-200 rounded-lg p-2 bg-blue-50 min-w-0">
          <h3 className="text-xs font-semibold text-blue-700 mb-2 text-center">EX</h3>
          <div className="space-y-1">
            {['Sydney', 'Melbourne', 'Perth', 'Brisbane', 'QLD', 'VIC', 'WA', 'East Coast'].map((location) => (
              <button
                key={location}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect('location', location, location);
                }}
                disabled={!!selectedItems.location}
                className={`w-full px-2 py-1 text-xs rounded-md transition-colors truncate ${
                  selectedItems.location === location
                    ? 'bg-blue-200 text-blue-800'
                    : selectedItems.location
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
            {['Sydney', 'Melbourne', 'Perth', 'Brisbane', 'QLD', 'VIC', 'WA', 'East Coast'].map((location) => (
              <button
                key={location}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect('availableIn', location, location);
                }}
                disabled={!!selectedItems.availableIn}
                className={`w-full px-2 py-1 text-xs rounded-md transition-colors truncate ${
                  selectedItems.availableIn === location
                    ? 'bg-green-200 text-green-800'
                    : selectedItems.availableIn
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
              'Genuine', 'Zilax', 'Koyo', 'Cryomax', 'Mahle', 'Delphi', 'Denso',
              'Genuine with Logo', 'Genuine with Bracket', 'Gen. w/o Bracket'
            ].map((brand) => (
              <button
                key={brand}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect('brand', brand, brand);
                }}
                disabled={!!selectedItems.brand}
                className={`w-full px-2 py-1 text-xs rounded-md transition-colors truncate ${
                  selectedItems.brand === brand
                    ? 'bg-purple-200 text-purple-800'
                    : selectedItems.brand
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
                title={brand}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="border border-gray-200 rounded-lg p-2 bg-orange-50 min-w-0">
          <h3 className="text-xs font-semibold text-orange-700 mb-2 text-center">INFO</h3>
          <div className="space-y-1">
            {['Stock Arriving', 'On Backorder'].map((info) => (
              <button
                key={info}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect('info', info, info);
                }}
                disabled={!!selectedItems.info}
                className={`w-full px-2 py-1 text-xs rounded-md transition-colors truncate ${
                  selectedItems.info === info
                    ? 'bg-orange-200 text-orange-800'
                    : selectedItems.info
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                }`}
                title={info}
              >
                {info}
              </button>
            ))}
          </div>
        </div>

        {/* ETA Section */}
        <div className="border border-gray-200 rounded-lg p-2 bg-red-50 min-w-0">
          <h3 className="text-xs font-semibold text-red-700 mb-2 text-center">ETA</h3>
          <div className="space-y-1">
            {[
              '3 Days', '4 Days', '5 Days', '1 Week', '2 Weeks', '3 Weeks',
              '4 Weeks', '8 Weeks', '1 Month', '2 Months'
            ].map((eta) => (
              <button
                key={eta}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect('eta', eta, eta);
                }}
                disabled={!!selectedItems.eta}
                className={`w-full px-2 py-1 text-xs rounded-md transition-colors truncate ${
                  selectedItems.eta === eta
                    ? 'bg-red-200 text-red-800'
                    : selectedItems.eta
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
