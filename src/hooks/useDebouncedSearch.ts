import { useState, useEffect } from 'react';

interface UseDebouncedSearchOptions {
  debounceMs?: number;
  onSearchChange?: (searchTerm: string) => void;
}

interface UseDebouncedSearchReturn {
  searchTerm: string;
  debouncedSearchTerm: string;
  setSearchTerm: (term: string) => void;
}

/**
 * Custom hook for handling debounced search functionality
 * @param options Configuration options for the debounced search
 * @returns Object containing search state and setter
 */
export function useDebouncedSearch(options: UseDebouncedSearchOptions = {}): UseDebouncedSearchReturn {
  const { debounceMs = 500, onSearchChange } = options;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      
      // Call optional callback when search term changes
      if (onSearchChange) {
        onSearchChange(searchTerm);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs, onSearchChange]);

  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
  };
}

/**
 * Custom hook for handling debounced search with page reset functionality
 * @param onPageReset Callback function to reset page when search changes
 * @param options Configuration options for the debounced search
 * @returns Object containing search state and setter
 */
export function useDebouncedSearchWithPageReset(
  onPageReset: () => void,
  options: UseDebouncedSearchOptions = {}
): UseDebouncedSearchReturn {
  const { searchTerm, debouncedSearchTerm, setSearchTerm } = useDebouncedSearch(options);
  
  // Reset page when search term changes
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      onPageReset();
    }
  }, [searchTerm, debouncedSearchTerm, onPageReset]);

  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm,
  };
}
