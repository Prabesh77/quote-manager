'use client';

import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
  showInfo?: boolean;
  maxPageNumbers?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className = '',
  showInfo = true,
  maxPageNumbers = 5
}) => {
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  // Calculate which page numbers to show
  const getVisiblePageNumbers = () => {
    if (totalPages <= maxPageNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxPageNumbers / 2);
    let start = Math.max(1, currentPage - half);
    const end = Math.min(totalPages, start + maxPageNumbers - 1);

    // Adjust if we're near the end
    if (end === totalPages) {
      start = Math.max(1, end - maxPageNumbers + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = getVisiblePageNumbers();

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        {showInfo && (
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {endIndex} of {totalItems} items
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          {/* Previous Page Button */}
          <button
            onClick={goToPrevPage}
            disabled={currentPage === 1}
            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              currentPage === 1
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }`}
            aria-label="Go to previous page"
          >
            Previous
          </button>
          
          {/* Page Numbers */}
          <div className="flex items-center space-x-1">
            {visiblePages.map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  page === currentPage
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
                aria-label={`Go to page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            ))}
          </div>
          
          {/* Next Page Button */}
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              currentPage === totalPages
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
            }`}
            aria-label="Go to next page"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

// Compact version for smaller spaces
export const CompactPagination: React.FC<Omit<PaginationProps, 'showInfo' | 'className'> & {
  className?: string;
}> = ({ className = '', ...props }) => (
  <Pagination
    {...props}
    className={className}
    showInfo={false}
  />
);

// Minimal version with just page numbers
export const MinimalPagination: React.FC<Omit<PaginationProps, 'showInfo' | 'className'> & {
  className?: string;
}> = ({ className = '', ...props }) => (
  <div className={`flex items-center justify-center space-x-2 ${className}`}>
    <button
      onClick={() => props.onPageChange(props.currentPage - 1)}
      disabled={props.currentPage === 1}
      className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
      aria-label="Previous page"
    >
      ←
    </button>
    
    <span className="text-sm text-gray-600">
      {props.currentPage} / {props.totalPages}
    </span>
    
    <button
      onClick={() => props.onPageChange(props.currentPage + 1)}
      disabled={props.currentPage === props.totalPages}
      className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
      aria-label="Next page"
    >
      →
    </button>
  </div>
);
