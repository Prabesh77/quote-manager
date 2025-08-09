'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronRight, Edit, Trash2, Save, X, Search, Eye, Copy, Car, CheckCircle, AlertTriangle, ShoppingCart, Package } from 'lucide-react';
import { Quote, Part } from './useQuotes';
import { SkeletonLoader } from './SkeletonLoader';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface QuoteTableProps {
  quotes: Quote[];
  parts: Part[];
  onUpdateQuote: (id: string, fields: Record<string, any>) => Promise<{ error: Error | null }>;
  onDeleteQuote: (id: string) => Promise<{ error: Error | null }>;
  onUpdatePart: (id: string, updates: Partial<Part>) => Promise<{ data: Part; error: Error | null }>;
  onUpdateMultipleParts: (updates: Array<{ id: string; updates: Partial<Part> }>) => Promise<void>;
  onMarkCompleted?: (id: string) => Promise<{ error: Error | null }>;
  onMarkAsOrdered?: (id: string, taxInvoiceNumber: string) => Promise<{ error: Error | null }>;
  onMarkAsOrderedWithParts?: (id: string, taxInvoiceNumber: string, partIds: string[]) => Promise<{ error: Error | null }>;
  showCompleted?: boolean;
  defaultFilter?: FilterType;
  isLoading?: boolean;
  isRefetching?: boolean; // New prop for background loading
}

type FilterType = 'all' | 'unpriced' | 'priced';

type QuoteStatus = 'unpriced' | 'priced' | 'completed' | 'ordered' | 'delivered';

export default function QuoteTable({ quotes, parts, onUpdateQuote, onDeleteQuote, onUpdatePart, onUpdateMultipleParts, onMarkCompleted, onMarkAsOrdered, onMarkAsOrderedWithParts, showCompleted = false, defaultFilter = 'all', isLoading = false, isRefetching = false }: QuoteTableProps) {
  const [editingQuote, setEditingQuote] = useState<string | null>(null);
  const [editingParts, setEditingParts] = useState<string | null>(null);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [partEditData, setPartEditData] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>(defaultFilter);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showOrderConfirm, setShowOrderConfirm] = useState<string | null>(null);
  const [taxInvoiceNumber, setTaxInvoiceNumber] = useState('');
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);

  // Brand colors
  const brandRed = '#d0202d';
  const brandColors = {
    primary: brandRed,
    secondary: '#1f2937',
    accent: '#f3f4f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: brandRed,
  };

  // Update current time every minute for deadline indicators
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditingQuote(null);
        setEditingParts(null);
      }
      
      if (e.key === 'Enter' && (editingQuote || editingParts)) {
        handleSave();
      }
      
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingQuote, editingParts]);

  // Debug: Log body values
  useEffect(() => {
    quotes.forEach(quote => {
      console.log('Quote', quote.id, 'body value:', quote.body);
    });
  }, [quotes]);

  const handleSave = async () => {
    if (editingQuote) {
      await onUpdateQuote(editingQuote, editData);
      setEditingQuote(null);
      setEditData({});
    }
    if (editingParts) {
      const updates = Object.keys(partEditData).map(id => ({
        id,
        updates: partEditData[id] || {}
      }));
      await onUpdateMultipleParts(updates);
      setEditingParts(null);
      setPartEditData({});
    }
  };

  const startEditingQuote = (quote: Quote) => {
    setEditingQuote(quote.id);
    setEditData({
      quoteRef: quote.quoteRef,
      vin: quote.vin,
      make: quote.make,
      model: quote.model,
      series: quote.series,
      auto: quote.auto,
      body: quote.body,
      mthyr: quote.mthyr,
      rego: quote.rego,
    });
  };

  const startEditingParts = (quoteParts: Part[], quoteId: string) => {
    const newPartEditData: Record<string, Record<string, any>> = {};
    quoteParts.forEach(part => {
      newPartEditData[part.id] = {
        name: part.name,
        number: part.number,
        price: part.price,
        note: part.note
      };
    });
    setPartEditData(newPartEditData);
    setEditingParts(quoteId);
  };

  const handleQuoteEditChange = (field: string, value: string | number | boolean) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handlePartEditChange = (partId: string, field: string, value: string | number | null) => {
    setPartEditData(prev => ({
      ...prev,
      [partId]: {
        ...prev[partId],
        [field]: value
      }
    }));
  };

  const getQuoteParts = (partRequested: string): Part[] => {
    if (!partRequested) {
      return [];
    }
    
    const partIds = partRequested.split(',').map(id => id.trim());
    
    const foundParts = parts.filter(part => {
      const isFound = partIds.includes(String(part.id));
      return isFound;
    });
    
    return foundParts;
  };

  const getQuoteStatus = (quoteParts: Part[], quoteStatus?: string): QuoteStatus => {
    // Prioritize database status over calculated status
    if (quoteStatus === 'delivered') return 'delivered';
    if (quoteStatus === 'ordered') return 'ordered';
    if (quoteStatus === 'completed') return 'completed';
    if (quoteStatus === 'priced') return 'priced';
    if (quoteStatus === 'unpriced') return 'unpriced';
    if (quoteStatus === 'active') {
      // Fallback to calculation for legacy quotes
    if (quoteParts.length === 0) return 'unpriced';
    const hasPricedParts = quoteParts.some(part => part.price && part.price > 0);
    return hasPricedParts ? 'priced' : 'unpriced';
    }
    return 'unpriced';
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const getVehicleLogo = (make: string) => {
    const logos: Record<string, string> = {
      'toyota': '/car-logos/toyota.png',
      'honda': '/car-logos/honda.png',
      'ford': '/car-logos/ford.png',
      'bmw': '/car-logos/bmw.png',
      'mercedes': '/car-logos/mercedes.png',
      'audi': '/car-logos/audi.png',
      'volkswagen': '/car-logos/volkswagen.png',
      'nissan': '/car-logos/nissan.png',
      'hyundai': '/car-logos/hyundai.png',
      'kia': '/car-logos/kia.png',
      'chevrolet': '/car-logos/chevrolet.png',
      'mazda': '/car-logos/mazda.png',
      'lexus': '/car-logos/lexus.png',
      'volvo': '/car-logos/volvo.png',
      'subaru': '/car-logos/subaru.png',
      'land rover': '/car-logos/landrover.png',
      'jaguar': '/car-logos/jaguar.png',
      'mini': '/car-logos/mini.png',
      'peugeot': '/car-logos/peugeot.png',
      'renault': '/car-logos/renault.png',
      'skoda': '/car-logos/skoda.png',
      'alfa romeo': '/car-logos/alfaromeo.png',
      'infiniti': '/car-logos/infiniti.png',
      'jeep': '/car-logos/jeep.png',
      'mg': '/car-logos/mg.png',
      'mitsubishi': '/car-logos/mitsubisi.png',
    };
    return logos[make.toLowerCase()] || '/car-logos/toyota.png'; // Default to Toyota if make not found
  };

  const getPartIcon = (partName: string): string | null => {
    const iconMap: Record<string, string> = {
      'Radiator': '/part-icons/radiator.png',
      'Left Headlamp': '/part-icons/headlight-left.png',
      'Right Headlamp': '/part-icons/headlight-right.png',
      'Condenser': '/part-icons/condenser.png',
      'Radar Sensor': '/part-icons/sensor.png',
      'Fan Assembly': '/part-icons/fan.png',
      'Intercooler': '/part-icons/intercooler.png',
    };
    
    return iconMap[partName] || null;
  };

  const getDeadlineIndicator = (requiredBy: string | undefined) => {
    if (!requiredBy) return null;
    
    try {
              // Check if it's an ISO timestamp (contains 'T' and 'Z' or timezone)
        if (requiredBy.includes('T')) {
          // ISO timestamp format
          const deadline = new Date(requiredBy);
          const now = currentTime; // Use currentTime from state instead of new Date()
          const diffMs = deadline.getTime() - now.getTime();
          const diffMins = Math.floor(diffMs / (1000 * 60));
          
          let color = 'bg-green-500';
          let animation = '';
          
          if (diffMins < 0) {
            // Overdue
            color = 'bg-red-500';
            animation = '';
          } else if (diffMins < 15) {
            // Less than 15 minutes
            color = 'bg-red-500';
            animation = '';
          } else if (diffMins < 30) {
            // Less than 30 minutes
            color = 'bg-yellow-500';
            animation = '';
          } else {
            // More than 30 minutes
            color = 'bg-green-500';
          }
        
        // Format the time display
        let timeDisplay = '';
        if (diffMins < 0) {
          // Overdue - show negative time
          const absMins = Math.abs(diffMins);
          if (absMins < 60) {
            timeDisplay = `-${absMins}m`;
          } else if (absMins < 1440) { // Less than 24 hours
            const hours = Math.floor(absMins / 60);
            const mins = absMins % 60;
            timeDisplay = `-${hours}h ${mins}m`;
          } else if (absMins < 10080) { // Less than 7 days
            const days = Math.floor(absMins / 1440);
            const remainingMins = absMins % 1440;
            const hours = Math.floor(remainingMins / 60);
            const mins = remainingMins % 60;
            timeDisplay = `-${days}d ${hours}h ${mins}m`;
          } else {
            const weeks = Math.floor(absMins / 10080);
            const remainingMins = absMins % 10080;
            const days = Math.floor(remainingMins / 1440);
            const hours = Math.floor((remainingMins % 1440) / 60);
            const mins = remainingMins % 60;
            timeDisplay = `-${weeks}wk ${days}d ${hours}h ${mins}m`;
          }
        } else if (diffMins < 60) {
          // Less than 1 hour
          timeDisplay = `${diffMins}m`;
        } else if (diffMins < 1440) { // Less than 24 hours
          const hours = Math.floor(diffMins / 60);
          const mins = diffMins % 60;
          timeDisplay = `${hours}h ${mins}m`;
        } else if (diffMins < 10080) { // Less than 7 days
          const days = Math.floor(diffMins / 1440);
          const remainingMins = diffMins % 1440;
          const hours = Math.floor(remainingMins / 60);
          const mins = remainingMins % 60;
          timeDisplay = `${days}d ${hours}h ${mins}m`;
        } else {
          // More than 7 days
          const weeks = Math.floor(diffMins / 10080);
          const remainingMins = diffMins % 10080;
          const days = Math.floor(remainingMins / 1440);
          const hours = Math.floor((remainingMins % 1440) / 60);
          const mins = remainingMins % 60;
          timeDisplay = `${weeks}wk ${days}d ${hours}h ${mins}m`;
        }
        
        return { color, animation, timeDisplay };
      } else {
        // Legacy format (date and time as string) - Australian dd/mm/yyyy format
        const [datePart, timePart] = requiredBy.split(' ');
        const [day, month, year] = datePart.split('/');
        const timeStr = timePart.toLowerCase();
        
        let hours = 0;
        let minutes = 0;
        
        if (timeStr.includes('pm')) {
          const time = timeStr.replace('pm', '');
          if (time.includes(':')) {
            const [h, m] = time.split(':');
            const hour = parseInt(h);
            // 12 PM should be 12, not 24
            hours = hour === 12 ? 12 : hour + 12;
            minutes = parseInt(m || '0');
          } else {
            // Handle format like "1200pm"
            const timeNum = parseInt(time);
            const hour = Math.floor(timeNum / 100);
            // 12 PM should be 12, not 24
            hours = hour === 12 ? 12 : hour + 12;
            minutes = timeNum % 100;
          }
        } else if (timeStr.includes('am')) {
          const time = timeStr.replace('am', '');
          if (time.includes(':')) {
            const [h, m] = time.split(':');
            hours = parseInt(h);
            minutes = parseInt(m || '0');
          } else {
            // Handle format like "1200am"
            const timeNum = parseInt(time);
            hours = Math.floor(timeNum / 100);
            minutes = timeNum % 100;
          }
        }
        
        const deadline = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), hours, minutes);
        const now = currentTime; // Use currentTime from state instead of new Date()
        const diffMs = deadline.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        
        let color = 'bg-green-500';
        let animation = '';
        
        if (diffMins < 0) {
          // Overdue
          color = 'bg-red-500';
          animation = '';
        } else if (diffMins < 15) {
          // Less than 15 minutes
          color = 'bg-red-500';
          animation = '';
        } else if (diffMins < 30) {
          // Less than 30 minutes
          color = 'bg-yellow-500';
          animation = '';
        } else {
          // More than 30 minutes
          color = 'bg-green-500';
        }
        
        // Format the time display
        let timeDisplay = '';
        if (diffMins < 0) {
          // Overdue - show negative time
          const absMins = Math.abs(diffMins);
          if (absMins < 60) {
            timeDisplay = `-${absMins}m`;
          } else if (absMins < 1440) { // Less than 24 hours
            const hours = Math.floor(absMins / 60);
            const mins = absMins % 60;
            timeDisplay = `-${hours}h ${mins}m`;
          } else if (absMins < 10080) { // Less than 7 days
            const days = Math.floor(absMins / 1440);
            const remainingMins = absMins % 1440;
            const hours = Math.floor(remainingMins / 60);
            const mins = remainingMins % 60;
            timeDisplay = `-${days}d ${hours}h ${mins}m`;
          } else {
            const weeks = Math.floor(absMins / 10080);
            const remainingMins = absMins % 10080;
            const days = Math.floor(remainingMins / 1440);
            const hours = Math.floor((remainingMins % 1440) / 60);
            const mins = remainingMins % 60;
            timeDisplay = `-${weeks}wk ${days}d ${hours}h ${mins}m`;
          }
        } else if (diffMins < 60) {
          // Less than 1 hour
          timeDisplay = `${diffMins}m`;
        } else if (diffMins < 1440) { // Less than 24 hours
          const hours = Math.floor(diffMins / 60);
          const mins = diffMins % 60;
          timeDisplay = `${hours}h ${mins}m`;
        } else if (diffMins < 10080) { // Less than 7 days
          const days = Math.floor(diffMins / 1440);
          const remainingMins = diffMins % 1440;
          const hours = Math.floor(remainingMins / 60);
          const mins = remainingMins % 60;
          timeDisplay = `${days}d ${hours}h ${mins}m`;
        } else {
          // More than 7 days
          const weeks = Math.floor(diffMins / 10080);
          const remainingMins = diffMins % 10080;
          const days = Math.floor(remainingMins / 1440);
          const hours = Math.floor((remainingMins % 1440) / 60);
          const mins = remainingMins % 60;
          timeDisplay = `${weeks}wk ${days}d ${hours}h ${mins}m`;
        }
        
        return { color, animation, timeDisplay };
      }
    } catch (error) {
      return null;
    }
  };

  const getStatusChip = (status: QuoteStatus) => {
    const statusConfig = {
      unpriced: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        icon: AlertTriangle,
        label: 'Waiting for Price'
      },
      priced: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
        icon: CheckCircle,
        label: 'Priced'
      },
      completed: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200',
        icon: CheckCircle,
        label: 'Completed'
      },
      ordered: {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
        border: 'border-purple-200',
        icon: ShoppingCart,
        label: 'Ordered'
      },
      delivered: {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-200',
        icon: Package,
        label: 'Delivered'
      }
    };

    const config = statusConfig[status];
    const IconComponent = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${config.bg} ${config.text} ${config.border} shadow-sm whitespace-nowrap`}>
        <IconComponent className="h-4 w-4" />
        <span>{config.label}</span>
      </div>
    );
  };

  // Function to calculate deadline priority (lower number = higher priority)
  const getDeadlinePriority = (quote: Quote) => {
    if (!quote.requiredBy) return Infinity; // No deadline = lowest priority
    
    try {
      const deadline = new Date(quote.requiredBy);
      const now = currentTime;
      const diffMs = deadline.getTime() - now.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      // Overdue items get highest priority (negative values)
      if (diffMins < 0) return diffMins; // Negative values for overdue
      
      // Items due soon get higher priority
      return diffMins;
    } catch (error) {
      return Infinity; // Invalid date = lowest priority
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const quoteParts = getQuoteParts(quote.partRequested);
    const status = getQuoteStatus(quoteParts, quote.status);
    
    // Filter by completion status
    if (showCompleted && quote.status !== 'completed') return false;
    if (!showCompleted && quote.status === 'completed') return false;
    
    // Apply search filter
    const matchesSearch = 
      quote.quoteRef?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.vin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.make?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }).sort((a, b) => {
    // For completed quotes, sort by creation date (newest first)
    if (showCompleted) {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    }
    
    // For active quotes, sort by deadline priority
    const priorityA = getDeadlinePriority(a);
    const priorityB = getDeadlinePriority(b);
    
    // Lower priority number = higher priority (shows first)
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If same priority, sort by creation date (oldest first for active quotes)
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateA - dateB;
  });

  // Memoize the array of IDs so it doesn't change on every render
  const allQuoteIds = useMemo(() => filteredQuotes.map(q => q.id), [filteredQuotes]);

  const handleDeleteWithConfirm = async (quoteId: string) => {
    setShowDeleteConfirm(quoteId);
  };

  const confirmDelete = async (quoteId: string) => {
    await onDeleteQuote(quoteId);
    setShowDeleteConfirm(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  const handleMarkAsOrder = (quoteId: string) => {
    setShowOrderConfirm(quoteId);
    setTaxInvoiceNumber('');
    
    // Auto-select all orderable parts (parts with price > 0)
    const quote = quotes.find(q => q.id === quoteId);
    if (quote) {
      const quoteParts = getQuoteParts(quote.partRequested);
      const orderableParts = quoteParts.filter(part => part.price && part.price > 0);
      const orderablePartIds = orderableParts.map(part => part.id);
      setSelectedPartIds(orderablePartIds);
    } else {
      setSelectedPartIds([]);
    }
  };

  const confirmOrder = async () => {
    if (!showOrderConfirm || !taxInvoiceNumber.trim() || !onMarkAsOrderedWithParts) return;
    
    // Validate that at least one part is selected
    if (selectedPartIds.length === 0) {
      alert('Please select at least one part to order');
      return;
    }
    
    // console.log('Marking quote as ordered:', showOrderConfirm, 'with tax invoice:', taxInvoiceNumber);
    
    const result = await onMarkAsOrderedWithParts(
      showOrderConfirm,
      taxInvoiceNumber.trim(),
      selectedPartIds
    );
    
    if (!result.error) {
      setShowOrderConfirm(null);
      setTaxInvoiceNumber('');
      setSelectedPartIds([]);
    }
  };

  const cancelOrder = () => {
    setShowOrderConfirm(null);
    setTaxInvoiceNumber('');
    setSelectedPartIds([]);
  };

  // Timer to update deadline indicators every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              id="search-input"
              type="text"
              placeholder="Search quotes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
        
      </div>

      {/* Quotes Accordion */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hidden lg:block relative">
        {/* Subtle refetching indicator */}
        {isRefetching && !isLoading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 animate-pulse z-20"></div>
        )}
        
        {isLoading && filteredQuotes.length === 0 ? (
          <>
            {/* Table Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
              <div className="grid grid-cols-6 gap-4 px-6 py-4" style={{ gridTemplateColumns: '1fr 1fr 2fr 1fr 0.5fr 0.5fr' }}>
                <div className="font-semibold text-gray-900 min-w-[150px]">Quote Ref</div>
                <div className="font-semibold text-gray-900 min-w-[180px]">VIN</div>
                <div className="font-semibold text-gray-900">Vehicle</div>
                <div className="font-semibold text-gray-900">Status</div>
                <div className="font-semibold text-gray-900">Parts</div>
                <div className="font-semibold text-gray-900">Actions</div>
              </div>
            </div>
            <SkeletonLoader count={5} />
          </>
        ) : filteredQuotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-8">
              <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">No quotes found</h3>
            <p className="text-gray-600 text-center max-w-lg mb-8 text-lg">
              {defaultFilter === 'unpriced' ? 'No quotes are waiting for pricing at the moment.' :
               defaultFilter === 'priced' ? 'No quotes have been priced yet.' :
               showCompleted ? 'No quotes have been completed yet.' :
               'Get started by adding your first quote to track parts and pricing.'}
            </p>
            <div className="flex items-center space-x-3 text-base text-gray-500">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Ready to get started</span>
            </div>
          </div>
        ) : (
        <>
          {/* Table Header */}
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="grid grid-cols-6 gap-4 px-6 py-4" style={{ gridTemplateColumns: '1fr 1fr 2fr 1fr 0.5fr 0.5fr' }}>
              <div className="font-semibold text-gray-900 min-w-[150px]">Quote Ref</div>
              <div className="font-semibold text-gray-900 min-w-[180px]">VIN</div>
              <div className="font-semibold text-gray-900">Vehicle</div>
              <div className="font-semibold text-gray-900">Status</div>
              <div className="font-semibold text-gray-900">Parts</div>
              <div className="font-semibold text-gray-900">Actions</div>
        </div>
      </div>

          {/* Quotes List */}
          <Accordion type="multiple" className="w-full">
              {filteredQuotes.map((quote) => {
                const quoteParts = getQuoteParts(quote.partRequested);
                const status = getQuoteStatus(quoteParts, quote.status);

                return (
              <AccordionItem key={quote.id} value={quote.id} className="border-b border-gray-100 last:border-b-0 relative">
                {/* Deadline Indicator - Only for unpriced and priced quotes */}
                {quote.status !== 'completed' && quote.status !== 'ordered' && quote.status !== 'delivered' && (() => {
                  const deadlineInfo = getDeadlineIndicator(quote.requiredBy);
                  if (!deadlineInfo) return null;
                  
                  return (
                    <>
                      {/* Desktop: Full left border and indicator */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${deadlineInfo.color} hidden sm:block`}></div>
                      <div className="absolute left-0 top-[11px] transform -translate-y-1/2 z-10 flex items-center space-x-2 hidden sm:flex">
                        <div className={`px-2 py-[2px] text-[12px] font-semibold text-white shadow-sm ${deadlineInfo.color} relative`}>
                          {deadlineInfo.timeDisplay}
                          {/* Small ping circle in top-right corner */}
                          {deadlineInfo.animation === '' && (deadlineInfo.color === 'bg-red-500' || deadlineInfo.color === 'bg-yellow-500') && (
                            <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-300 rounded-full animate-ping shadow-lg border border-red-600"></div>
                          )}
                        </div>
                        {quote.customer && (
                          <div className="px-2 py-[2px] text-[10px] text-orange-600 font-medium rounded shadow-sm">
                            {quote.customer}
                          </div>
                        )}
                      </div>
                      
                      {/* Mobile: Small rectangle indicator at top-left */}
                      <div className={`absolute top-0 left-0 w-6 h-6 ${deadlineInfo.color} block sm:hidden z-50`}></div>
                      <div className="absolute top-0 left-0 z-50 block sm:hidden">
                        <div className={`px-1 py-[1px] text-[8px] font-semibold text-white ${deadlineInfo.color} rounded-sm shadow-sm relative`}>
                          {deadlineInfo.timeDisplay}
                          {/* Small ping circle in top-right corner for mobile */}
                          {deadlineInfo.animation === '' && (deadlineInfo.color === 'bg-red-500' || deadlineInfo.color === 'bg-yellow-500') && (
                            <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-lime-400 rounded-full animate-ping shadow-lg border border-lime-300"></div>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
                
                <AccordionTrigger className="grid grid-cols-6 gap-4 w-full px-3 hover:bg-gray-50 transition-colors cursor-pointer" style={{ gridTemplateColumns: '1fr 1fr 2fr 1fr 0.5fr 0.5fr' }}>
                  {/* Quote Ref */}
                  <div>
                  <div className="flex items-center space-x-2 w-[160px]">
                    <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    {editingQuote === quote.id ? (
                          <input
                            type="text"
                        value={editData.quoteRef || quote.quoteRef || ''}
                            onChange={(e) => handleQuoteEditChange('quoteRef', e.target.value)}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                      <>
                        <span className="font-medium text-gray-900">{quote.quoteRef}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(quote.quoteRef || '');
                              }}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                              title="Copy quote ref"
                            >
                          <Copy className="h-4 w-4" />
                            </button>
                        
                      </>
                    )}
                  </div>
                   {/* Tax Invoice Number for Ordered Quotes - Main Row Display */}
                   {quote.status === 'ordered' && quote.taxInvoiceNumber && (
                        <div className="flex items-center space-x-1 border-t border-gray-100 pt-1">
                          <div className="flex items-center space-x-1 px-2 py-1 bg-purple-100 border border-purple-200 rounded text-xs">
                            <span className="text-purple-800 font-medium text-xs">Invoice:</span>
                            <span className="text-purple-900 font-mono text-[14px]">{quote.taxInvoiceNumber}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(quote.taxInvoiceNumber || '');
                              }}
                              className="p-0.5 text-purple-600 hover:text-purple-700 hover:bg-purple-200 rounded transition-colors cursor-pointer"
                              title="Copy tax invoice number"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          </div>
                        )}
                  </div>

                  {/* VIN */}
                  <div className="flex items-center space-x-2">
                    {editingQuote === quote.id ? (
                          <input
                            type="text"
                        value={editData.vin || quote.vin || ''}
                            onChange={(e) => handleQuoteEditChange('vin', e.target.value)}
                        className="px-2 py-1 text-sm font-mono border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Enter VIN"
                          />
                        ) : (
                      <>
                        <span className="font-mono text-sm text-gray-900">{quote.vin || '-'}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(quote.vin || '');
                                }}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                title="Copy VIN"
                              >
                          <Copy className="h-4 w-4" />
                              </button>
                      </>
                            )}
                          </div>

                  {/* Vehicle */}
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      <img 
                        src={getVehicleLogo(editingQuote === quote.id ? (editData.make || quote.make) : quote.make)} 
                        alt={editingQuote === quote.id ? (editData.make || quote.make) : quote.make} 
                        className="h-8 w-8 object-contain" 
                      />
                    </span>
                    {editingQuote === quote.id ? (
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2">
                          <div className="flex flex-col space-y-1 flex-1">
                            <label className="text-xs text-gray-500 font-medium">Make</label>
                            <input
                              type="text"
                              value={editData.make || quote.make || ''}
                              onChange={(e) => handleQuoteEditChange('make', e.target.value)}
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              onClick={(e) => e.stopPropagation()}
                              placeholder="Make"
                            />
                          </div>
                          <div className="flex flex-col space-y-1 flex-1">
                            <label className="text-xs text-gray-500 font-medium">Model</label>
                            <input
                              type="text"
                              value={editData.model || quote.model || ''}
                              onChange={(e) => handleQuoteEditChange('model', e.target.value)}
                              className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              onClick={(e) => e.stopPropagation()}
                              placeholder="Model"
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex flex-col space-y-1 flex-1">
                            <label className="text-xs text-gray-500 font-medium">Year</label>
                            <input
                              type="text"
                              value={editData.mthyr || quote.mthyr || ''}
                              onChange={(e) => handleQuoteEditChange('mthyr', e.target.value)}
                              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              onClick={(e) => e.stopPropagation()}
                              placeholder="e.g. 9/2017"
                            />
                          </div>
                          <div className="flex flex-col space-y-1 flex-1">
                            <label className="text-xs text-gray-500 font-medium">Series</label>
                            <input
                              type="text"
                              value={editData.series || quote.series || ''}
                              onChange={(e) => handleQuoteEditChange('series', e.target.value)}
                              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              onClick={(e) => e.stopPropagation()}
                              placeholder="Series"
                            />
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex flex-col space-y-1 flex-1">
                            <label className="text-xs text-gray-500 font-medium">Body</label>
                            <input
                              type="text"
                              value={editData.body || quote.body || ''}
                              onChange={(e) => handleQuoteEditChange('body', e.target.value)}
                              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              onClick={(e) => e.stopPropagation()}
                              placeholder="e.g. 5 Door Hatchback"
                            />
                          </div>
                          <div className="flex flex-col space-y-1 flex-1">
                            <label className="text-xs text-gray-500 font-medium">Transmission</label>
                            <select
                              value={editData.auto !== undefined ? editData.auto.toString() : quote.auto.toString()}
                              onChange={(e) => handleQuoteEditChange('auto', e.target.value === 'true')}
                              className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="true">Auto</option>
                              <option value="false">Manual</option>
                            </select>
                          </div>
                        </div>
                      </div>
                        ) : (
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">{quote.make} • {quote.model}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                          <span>{quote.mthyr || '-'}</span>
                          {quote.series && (
                            <>
                              <span>•</span>
                              <span>{quote.series}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-600">
                          <span>{quote.body || '-'}</span>
                          {quote.auto !== undefined && (
                            <>
                              <span>•</span>
                              <span>{quote.auto ? 'Auto' : 'Manual'}</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <div className="flex space-y-1">
                      {getStatusChip(status)}
                     
                    </div>
                  </div>

                  {/* Parts Count */}
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {quoteParts.length} {quoteParts.length === 1 ? 'part' : 'parts'}
                    </span>
                  </div>

                  {/* Actions */}
                          <div className="flex items-center space-x-2">
                    {(quote.status !== 'completed' || showCompleted) && (
                      <>
                        {editingQuote === quote.id ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSave();
                            }}
                            className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors cursor-pointer"
                            title="Save changes"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingQuote(quote);
                            }}
                            className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                            title="Edit quote"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        
                        {editingQuote === quote.id ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingQuote(null);
                              setEditData({});
                            }}
                            className="p-1 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                            title="Cancel editing"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWithConfirm(quote.id);
                            }}
                            className="p-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors cursor-pointer"
                            title="Delete quote"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                        
                        {status === 'priced' && onMarkCompleted && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMarkCompleted(quote.id);
                            }}
                            className="p-1 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors cursor-pointer"
                            title="Mark as completed"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                        )}
                        
                        {status === 'completed' && onMarkAsOrderedWithParts && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsOrder(quote.id);
                            }}
                            className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded transition-colors cursor-pointer"
                            title="Mark as order"
                          >
                            <ShoppingCart className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-6 py-4 bg-gray-50">
                  <div className="animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                          <Eye className="h-4 w-4" />
                          <span>Parts Details ({quoteParts.length})</span>
                        </h4>
                        {quoteParts.length === 0 && (
                          <span className="text-sm text-gray-500">No parts linked to this quote</span>
                        )}
                        {quoteParts.length > 0 && editingParts !== quote.id && quote.status !== 'completed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditingParts(quoteParts, quote.id);
                            }}
                            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors cursor-pointer flex items-center space-x-1"
                            title="Edit all parts in this quote"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Edit Parts</span>
                          </button>
                        )}
                        {editingParts === quote.id && (
                          <div className="flex space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSave();
                              }}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer flex items-center space-x-1"
                              title="Save all part changes"
                            >
                              <Save className="h-3 w-3" />
                              <span>Save All</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingParts(null);
                                setPartEditData({});
                              }}
                              className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors cursor-pointer flex items-center space-x-1"
                              title="Cancel editing and discard changes"
                            >
                              <X className="h-3 w-3" />
                              <span>Cancel</span>
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {quoteParts.length > 0 && (
                        <>
                          {/* Desktop Table View */}
                          <div className="hidden lg:block">
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                              <table className="w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Number</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {quoteParts.map((part) => {
                                    const isPartEditing = editingParts === quote.id;
                                    
                                    return (
                                      <tr key={part.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                          <div className="flex items-center space-x-3">
                                            {getPartIcon(part.name) && (
                                              <div className="bg-white rounded-full p-1 shadow-sm border border-gray-200">
                                                <img src={getPartIcon(part.name)!} alt={part.name} className="h-6 w-6 object-contain" />
                                              </div>
                                            )}
                            <div>
                                              {isPartEditing ? (
                                                <input
                                                  type="text"
                                                  value={partEditData[part.id]?.name || ''}
                                                  onChange={(e) => handlePartEditChange(part.id, 'name', e.target.value)}
                                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                                  autoFocus
                                                />
                                              ) : (
                                                <span className="text-sm font-medium text-gray-900">{part.name}</span>
                                              )}
                            </div>
                          </div>
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="flex items-center space-x-1">
                                            {isPartEditing ? (
                                              <input
                                                type="text"
                                                value={partEditData[part.id]?.number || ''}
                                                onChange={(e) => handlePartEditChange(part.id, 'number', e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                              />
                                            ) : (
                                              <>
                                                <span className="text-sm text-gray-600 font-mono">{part.number || '-'}</span>
                                                <button
                                                  onClick={() => copyToClipboard(part.number || '')}
                                                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                                  title="Copy to clipboard"
                                                >
                                                  <Copy className="h-3 w-3" />
                                                </button>
                                              </>
                                            )}
                                          </div>
                      </td>
                                        <td className="px-4 py-3">
                                          <div className="flex items-center space-x-1">
                                            {isPartEditing ? (
                                              <input
                                                type="number"
                                                value={partEditData[part.id]?.price || ''}
                                                onChange={(e) => handlePartEditChange(part.id, 'price', e.target.value ? Number(e.target.value) : null)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                              />
                                            ) : (
                                              <>
                                                <span className="text-sm font-medium text-gray-900">
                                                  {part.price ? `$${part.price.toFixed(2)}` : '-'}
                        </span>
                                                <button
                                                  onClick={() => copyToClipboard(part.price ? part.price.toString() : '')}
                                                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                                  title="Copy to clipboard"
                                                >
                                                  <Copy className="h-3 w-3" />
                                                </button>
                                              </>
                                            )}
                                          </div>
                      </td>
                                        <td className="px-4 py-3">
                                          <div className="flex items-center space-x-1">
                                            {isPartEditing ? (
                                              <input
                                                type="text"
                                                value={partEditData[part.id]?.note || ''}
                                                onChange={(e) => handlePartEditChange(part.id, 'note', e.target.value)}
                                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                              />
                                            ) : (
                                              <>
                                                <span className="text-sm text-gray-600">{part.note || '-'}</span>
                                                <button
                                                  onClick={() => copyToClipboard(part.note || '')}
                                                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                                  title="Copy to clipboard"
                                                >
                                                  <Copy className="h-3 w-3" />
                                                </button>
                                              </>
                                            )}
                                          </div>
                      </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Mobile Card View */}
                          <div className="lg:hidden space-y-3">
                            {quoteParts.map((part) => {
                              const isPartEditing = editingParts === quote.id;
                              
                              return (
                                <div key={part.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                                  <div className="relative">
                                    {getPartIcon(part.name) && (
                                      <div className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-sm border border-gray-200">
                                        <img src={getPartIcon(part.name)!} alt={part.name} className="h-7 w-7 object-contain" />
                                      </div>
                                    )}
                                    <div className="space-y-3 pr-12">
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-500 mb-1">Part Name</label>
                                          {isPartEditing ? (
                                            <input
                                              type="text"
                                              value={partEditData[part.id]?.name || ''}
                                              onChange={(e) => handlePartEditChange(part.id, 'name', e.target.value)}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                              autoFocus
                                            />
                                          ) : (
                                            <span className="text-sm font-medium text-gray-900">{part.name}</span>
                                          )}
                                        </div>
                                        
                                        <div>
                                          <label className="block text-xs font-medium text-gray-500 mb-1">Part Number</label>
                          <div className="flex items-center space-x-1">
                                            {isPartEditing ? (
                                              <input
                                                type="text"
                                                value={partEditData[part.id]?.number || ''}
                                                onChange={(e) => handlePartEditChange(part.id, 'number', e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                              />
                                            ) : (
                                              <>
                                                <span className="text-sm text-gray-600 font-mono">{part.number || '-'}</span>
                                                <button
                                                  onClick={() => copyToClipboard(part.number || '')}
                                                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                                  title="Copy to clipboard"
                                                >
                                                  <Copy className="h-3 w-3" />
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
                                          <div className="flex items-center space-x-1">
                                            {isPartEditing ? (
                                              <input
                                                type="number"
                                                value={partEditData[part.id]?.price || ''}
                                                onChange={(e) => handlePartEditChange(part.id, 'price', e.target.value ? Number(e.target.value) : null)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                              />
                                            ) : (
                                              <>
                                                <span className="text-sm font-medium text-gray-900">
                                                  {part.price ? `$${part.price.toFixed(2)}` : '-'}
                                                </span>
                                                <button
                                                  onClick={() => copyToClipboard(part.price ? part.price.toString() : '')}
                                                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                                  title="Copy to clipboard"
                                                >
                                                  <Copy className="h-3 w-3" />
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div>
                                          <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                                          <div className="flex items-center space-x-1">
                                            {isPartEditing ? (
                                              <input
                                                type="text"
                                                value={partEditData[part.id]?.note || ''}
                                                onChange={(e) => handlePartEditChange(part.id, 'note', e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                              />
                                            ) : (
                                              <>
                                                <span className="text-sm text-gray-600">{part.note || '-'}</span>
                                                <button
                                                  onClick={() => copyToClipboard(part.note || '')}
                                                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                                  title="Copy to clipboard"
                                                >
                                                  <Copy className="h-3 w-3" />
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        </>
        )}
      </div>

      {/* Mobile View */}
      <div className="lg:hidden space-y-4 p-1">
        {filteredQuotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No quotes found</h3>
            <p className="text-gray-600 text-center max-w-md mb-6">
              {defaultFilter === 'unpriced' ? 'No quotes are waiting for pricing at the moment.' :
               defaultFilter === 'priced' ? 'No quotes have been priced yet.' :
               showCompleted ? 'No quotes have been completed yet.' :
               'Get started by adding your first quote to track parts and pricing.'}
            </p>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Ready to get started</span>
            </div>
          </div>
        ) : (
          <Accordion type="multiple" className="w-full">
            {filteredQuotes.map((quote) => {
              const quoteParts = getQuoteParts(quote.partRequested);
              const status = getQuoteStatus(quoteParts, quote.status);
              
              return (
                <AccordionItem key={quote.id} value={quote.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  <AccordionTrigger className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="grid grid-rows-2 gap-3 w-full">
                      {/* Row 1: Quote Ref VIN Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <div className="flex items-center space-x-2">
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-gray-500">Quote Ref</span>
                              {editingQuote === quote.id ? (
                                <input
                                  type="text"
                                  value={editData.quoteRef || quote.quoteRef || ''}
                                  onChange={(e) => handleQuoteEditChange('quoteRef', e.target.value)}
                                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <span className="font-semibold text-gray-900">{quote.quoteRef}</span>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(quote.quoteRef || '');
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                              title="Copy quote ref"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-gray-500">VIN</span>
                              {editingQuote === quote.id ? (
                                <input
                                  type="text"
                                  value={editData.vin || quote.vin || ''}
                                  onChange={(e) => handleQuoteEditChange('vin', e.target.value)}
                                  className="px-2 py-1 text-sm font-mono border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="Enter VIN"
                                />
                              ) : (
                                <span className="text-sm font-mono text-gray-900">{quote.vin || '-'}</span>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(quote.vin || '');
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                              title="Copy VIN"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          {getStatusChip(status)}
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {quoteParts.length} {quoteParts.length === 1 ? 'part' : 'parts'}
                          </span>
                          {quote.customer && (
                            <span className="text-[10px] text-orange-600 font-medium">
                              {quote.customer}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Row 2: Vehicle Info Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
                            <img 
                              src={getVehicleLogo(editingQuote === quote.id ? (editData.make || quote.make) : quote.make)} 
                              alt={editingQuote === quote.id ? (editData.make || quote.make) : quote.make} 
                              className="h-8 w-8 object-contain" 
                            />
                          </span>
                        {editingQuote === quote.id ? (
                          <div className="flex flex-col space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col space-y-1">
                                <label className="text-xs text-gray-500 font-medium">Make</label>
                                <input
                                  type="text"
                                  value={editData.make || quote.make || ''}
                                  onChange={(e) => handleQuoteEditChange('make', e.target.value)}
                                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="Make"
                                />
                              </div>
                              <div className="flex flex-col space-y-1">
                                <label className="text-xs text-gray-500 font-medium">Model</label>
                                <input
                                  type="text"
                                  value={editData.model || quote.model || ''}
                                  onChange={(e) => handleQuoteEditChange('model', e.target.value)}
                                  className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="Model"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col space-y-1">
                                <label className="text-xs text-gray-500 font-medium">Year</label>
                                <input
                                  type="text"
                                  value={editData.mthyr || quote.mthyr || ''}
                                  onChange={(e) => handleQuoteEditChange('mthyr', e.target.value)}
                                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="e.g. 9/2017"
                                />
                              </div>
                              <div className="flex flex-col space-y-1">
                                <label className="text-xs text-gray-500 font-medium">Series</label>
                                <input
                                  type="text"
                                  value={editData.series || quote.series || ''}
                                  onChange={(e) => handleQuoteEditChange('series', e.target.value)}
                                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="Series"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col space-y-1">
                                <label className="text-xs text-gray-500 font-medium">Body</label>
                                <input
                                  type="text"
                                  value={editData.body || quote.body || ''}
                                  onChange={(e) => handleQuoteEditChange('body', e.target.value)}
                                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  onClick={(e) => e.stopPropagation()}
                                  placeholder="e.g. 5 Door Hatchback"
                                />
                              </div>
                              <div className="flex flex-col space-y-1">
                                <label className="text-xs text-gray-500 font-medium">Transmission</label>
                                <select
                                  value={editData.auto !== undefined ? editData.auto.toString() : quote.auto.toString()}
                                  onChange={(e) => handleQuoteEditChange('auto', e.target.value === 'true')}
                                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="true">Auto</option>
                                  <option value="false">Manual</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">{quote.make} - {quote.model}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-600">
                              <span>{quote.mthyr || '-'}</span>
                              {quote.series && (
                                <>
                                  <span>•</span>
                                  <span>{quote.series}</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-600">
                              <span>{quote.body || '-'}</span>
                              {quote.auto !== undefined && (
                                <>
                                  <span>•</span>
                                  <span>{quote.auto ? 'Auto' : 'Manual'}</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Action Buttons for Mobile */}
                      {(quote.status !== 'completed' || showCompleted) && (
                        <div className="flex items-center space-x-2">
                          {editingQuote === quote.id ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSave();
                                  }}
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors cursor-pointer"
                              title="Save changes"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingQuote(quote);
                              }}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                              title="Edit quote"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          
                          {editingQuote === quote.id ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingQuote(null);
                                    setEditData({});
                                  }}
                              className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer"
                              title="Cancel editing"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                            ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                handleDeleteWithConfirm(quote.id);
                                  }}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors cursor-pointer"
                              title="Delete quote"
                                >
                              <Trash2 className="h-4 w-4" />
                                </button>
                          )}
                          
                          {status === 'priced' && onMarkCompleted && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onMarkCompleted(quote.id);
                                    }}
                              className="p-2 text-green-600 hover:text-green-700 hover:bg-green-100 rounded transition-colors cursor-pointer"
                              title="Mark as completed"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </button>
                                )}
                          
                          {status === 'completed' && onMarkAsOrderedWithParts && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                handleMarkAsOrder(quote.id);
                                  }}
                              className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-100 rounded transition-colors cursor-pointer"
                              title="Mark as order"
                                >
                              <ShoppingCart className="h-4 w-4" />
                                </button>
                            )}
                          </div>
                        )}
                      
                      {quote.status === 'ordered' && quote.taxInvoiceNumber && (
                        <div className="flex items-center justify-between p-2 bg-purple-50 border border-purple-200 rounded">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-medium text-purple-800">Invoice:</span>
                            <span className="text-sm font-mono text-purple-900">{quote.taxInvoiceNumber}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(quote.taxInvoiceNumber || '');
                            }}
                            className="p-1 text-purple-600 hover:text-purple-700 hover:bg-purple-200 rounded transition-colors cursor-pointer"
                            title="Copy tax invoice number"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-4 pb-4 bg-gray-50">
                          <div className="animate-in slide-in-from-top-2 duration-300">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-gray-900 flex items-center space-x-2">
                                  <Eye className="h-4 w-4" />
                                  <span>Parts Details ({quoteParts.length})</span>
                                </h4>
                                {quoteParts.length === 0 && (
                                  <span className="text-sm text-gray-500">No parts linked to this quote</span>
                                )}
                          {quoteParts.length > 0 && editingParts !== quote.id && quote.status !== 'completed' && (
                                  <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingParts(quoteParts, quote.id);
                              }}
                              className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors cursor-pointer flex items-center space-x-1"
                              title="Edit all parts in this quote"
                                  >
                                    <Edit className="h-3 w-3" />
                              <span>Edit Parts</span>
                                  </button>
                                )}
                          {editingParts === quote.id && (
                                  <div className="flex space-x-1">
                                    <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSave();
                                }}
                                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors cursor-pointer flex items-center space-x-1"
                                title="Save all part changes"
                                    >
                                      <Save className="h-3 w-3" />
                                      <span>Save All</span>
                                    </button>
                                    <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingParts(null);
                                        setPartEditData({});
                                      }}
                                className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors cursor-pointer flex items-center space-x-1"
                                title="Cancel editing and discard changes"
                                    >
                                      <X className="h-3 w-3" />
                                      <span>Cancel</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                              
                              {quoteParts.length > 0 && (
                          <div className="space-y-3">
                                  {quoteParts.map((part) => {
                              const isPartEditing = editingParts === quote.id;
                                    
                                    return (
                                <div key={part.id} className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                                  <div className="relative">
                                    {getPartIcon(part.name) && (
                                      <div className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow-sm border border-gray-200">
                                        <img src={getPartIcon(part.name)!} alt={part.name} className="h-7 w-7 object-contain" />
                                      </div>
                                    )}
                                    <div className="space-y-3 pr-12">
                                      <div className="grid grid-cols-2 gap-3">
                                            <div>
                                              <label className="block text-xs font-medium text-gray-500 mb-1">Part Name</label>
                                              {isPartEditing ? (
                                                <input
                                                  type="text"
                                                  value={partEditData[part.id]?.name || ''}
                                                  onChange={(e) => handlePartEditChange(part.id, 'name', e.target.value)}
                                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                                  autoFocus
                                                />
                                              ) : (
                                                <span className="text-sm font-medium text-gray-900">{part.name}</span>
                                              )}
                                            </div>
                                            
                                            <div>
                                              <label className="block text-xs font-medium text-gray-500 mb-1">Part Number</label>
                                              <div className="flex items-center space-x-1">
                                                {isPartEditing ? (
                                                  <input
                                                    type="text"
                                                    value={partEditData[part.id]?.number || ''}
                                                    onChange={(e) => handlePartEditChange(part.id, 'number', e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                                  />
                                                ) : (
                                                  <>
                                                    <span className="text-sm text-gray-600 font-mono">{part.number || '-'}</span>
                                                    <button
                                                      onClick={() => copyToClipboard(part.number || '')}
                                                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                                      title="Copy to clipboard"
                                                    >
                                                      <Copy className="h-3 w-3" />
                                                    </button>
                                                  </>
                                                )}
                                          </div>
                                              </div>
                                            </div>
                                            
                                      <div className="grid grid-cols-2 gap-3">
                                            <div>
                                          <label className="block text-xs font-medium text-gray-500 mb-1">Price</label>
                                              <div className="flex items-center space-x-1">
                                                {isPartEditing ? (
                                                  <input
                                                    type="number"
                                                    value={partEditData[part.id]?.price || ''}
                                                    onChange={(e) => handlePartEditChange(part.id, 'price', e.target.value ? Number(e.target.value) : null)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                                  />
                                                ) : (
                                                  <>
                                                    <span className="text-sm font-medium text-gray-900">
                                                      {part.price ? `$${part.price.toFixed(2)}` : '-'}
                                                    </span>
                                                    <button
                                                      onClick={() => copyToClipboard(part.price ? part.price.toString() : '')}
                                                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                                      title="Copy to clipboard"
                                                    >
                                                      <Copy className="h-3 w-3" />
                                                    </button>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                            
                                            <div>
                                              <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                                              <div className="flex items-center space-x-1">
                                                {isPartEditing ? (
                                                  <input
                                                    type="text"
                                                    value={partEditData[part.id]?.note || ''}
                                                    onChange={(e) => handlePartEditChange(part.id, 'note', e.target.value)}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-red-500 focus:border-transparent"
                                                  />
                                                ) : (
                                                  <>
                                                    <span className="text-sm text-gray-600">{part.note || '-'}</span>
                                                    <button
                                                      onClick={() => copyToClipboard(part.note || '')}
                                                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                                                      title="Copy to clipboard"
                                                    >
                                                      <Copy className="h-3 w-3" />
                                                    </button>
                                                  </>
                                                )}
                                          </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                  </AccordionContent>
                </AccordionItem>
                );
              })}
          </Accordion>
        )}
        </div>
        
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={cancelDelete}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 transform transition-all">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
          </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Quote</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
      </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this quote? This will permanently remove the quote and all associated parts.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Delete Quote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmation Modal */}
      {showOrderConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={cancelOrder}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 transform transition-all max-h-[90vh] overflow-y-auto">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Mark as Order</h3>
                <p className="text-sm text-gray-500">Convert quote to order</p>
              </div>
            </div>
            
            {/* Tax Invoice Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax Invoice Number *
              </label>
              <input
                type="text"
                value={taxInvoiceNumber}
                onChange={(e) => setTaxInvoiceNumber(e.target.value)}
                placeholder="Enter tax invoice number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              />
            </div>
            
            {/* Parts Selection */}
            {(() => {
              const quote = quotes.find(q => q.id === showOrderConfirm);
              if (!quote) return null;
              const quoteParts = getQuoteParts(quote.partRequested);
              
              // Filter out parts with no price or zero price
              const orderableParts = quoteParts.filter(part => part.price && part.price > 0);
              const nonOrderableParts = quoteParts.filter(part => !part.price || part.price === 0);
              
              return (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Parts to Order *
                  </label>
                  
                  {/* Orderable Parts */}
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {orderableParts.map((part) => (
                      <label key={part.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedPartIds.includes(part.id)}
                          onChange={(e) => {
                            const newSelected = [...selectedPartIds];
                            if (e.target.checked) {
                              newSelected.push(part.id);
                            } else {
                              newSelected.splice(newSelected.indexOf(part.id), 1);
                            }
                            setSelectedPartIds(newSelected);
                          }}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{part.name}</div>
                          <div className="text-sm text-gray-500">
                            {part.number} • ${part.price?.toFixed(2) || 0}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  {/* Non-Orderable Parts Warning */}
                  {nonOrderableParts.length > 0 && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">!</span>
                        </div>
                        <span className="text-sm font-medium text-yellow-800">
                          Parts with no price cannot be ordered
                        </span>
                      </div>
                      <div className="text-xs text-yellow-700 space-y-1">
                        {nonOrderableParts.map((part) => (
                          <div key={part.id} className="flex items-center space-x-2">
                            <span>•</span>
                            <span>{part.name} ({part.number})</span>
                            <span className="text-yellow-600">
                              {!part.price ? 'No price set' : 'Price is $0'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    Selected {selectedPartIds.length} of {orderableParts.length} orderable parts
                  </p>
                </div>
              );
            })()}
           
            <div className="flex space-x-3">
              <button
                onClick={cancelOrder}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmOrder()}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors cursor-pointer"
              >
                Mark as Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
