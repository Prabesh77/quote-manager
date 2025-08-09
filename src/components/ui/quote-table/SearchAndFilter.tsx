import React from 'react';
import { Search } from 'lucide-react';
import { FilterType } from './types';

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  quotesCount: number;
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchTerm,
  onSearchChange,
  filter,
  onFilterChange,
  quotesCount
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="search-input"
              type="text"
              placeholder="Search quotes by ref, VIN, make, model, or customer..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 mr-2">Filter:</span>
          <button
            onClick={() => onFilterChange('all')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => onFilterChange('unpriced')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filter === 'unpriced'
                ? 'bg-orange-100 text-orange-800 border border-orange-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Unpriced
          </button>
          <button
            onClick={() => onFilterChange('priced')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              filter === 'priced'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Priced
          </button>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-500">
          {quotesCount} {quotesCount === 1 ? 'quote' : 'quotes'}
        </div>
      </div>
    </div>
  );
}; 