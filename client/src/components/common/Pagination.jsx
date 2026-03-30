import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/24/outline';

/**
 * Reusable Pagination Component
 * 
 * @param {Object} props
 * @param {number} props.currentPage - Current page number (1-indexed)
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.totalItems - Total number of items
 * @param {number} props.itemsPerPage - Number of items per page
 * @param {boolean} props.hasNextPage - Whether there is a next page
 * @param {boolean} props.hasPrevPage - Whether there is a previous page
 * @param {Function} props.onPageChange - Callback when page changes
 * @param {Function} props.onItemsPerPageChange - Callback when items per page changes
 * @param {boolean} props.showItemsPerPage - Whether to show items per page selector
 * @param {boolean} props.isLoading - Whether data is loading
 * @param {string} props.itemName - Name of the items (e.g., "flashcards", "decks")
 */
const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 20,
  hasNextPage = false,
  hasPrevPage = false,
  onPageChange,
  onItemsPerPageChange,
  showItemsPerPage = true,
  isLoading = false,
  itemName = 'items'
}) => {
  const itemsPerPageOptions = [10, 20, 50, 100];

  // Calculate display range
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);
      
      // Calculate range around current page
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if at the beginning
      if (currentPage <= 3) {
        end = Math.min(4, totalPages - 1);
      }
      
      // Adjust if at the end
      if (currentPage >= totalPages - 2) {
        start = Math.max(2, totalPages - 3);
      }
      
      // Add ellipsis if needed
      if (start > 2) {
        pages.push('...');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }
      
      // Show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (totalItems === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-stone-800 border-t border-stone-200 dark:border-stone-700 rounded-b-lg transition-colors">
      {/* Left side - Results info */}
      <div className="flex items-center text-sm text-stone-700 dark:text-stone-300">
        <span>
          Showing <span className="font-medium">{startItem}</span> to{' '}
          <span className="font-medium">{endItem}</span> of{' '}
          <span className="font-medium">{totalItems}</span> {itemName}
        </span>
      </div>

      {/* Center - Page numbers */}
      <div className="flex items-center gap-1">
        {/* First page button */}
        <button
          onClick={() => onPageChange(1)}
          disabled={!hasPrevPage || isLoading}
          className={`p-2 rounded-md transition-colors ${
            hasPrevPage && !isLoading
              ? 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
              : 'text-stone-300 dark:text-stone-600 cursor-not-allowed'
          }`}
          title="First page"
        >
          <ChevronDoubleLeftIcon className="h-4 w-4" />
        </button>

        {/* Previous page button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!hasPrevPage || isLoading}
          className={`p-2 rounded-md transition-colors ${
            hasPrevPage && !isLoading
              ? 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
              : 'text-stone-300 dark:text-stone-600 cursor-not-allowed'
          }`}
          title="Previous page"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((page, index) => (
            <button
              key={`${page}-${index}`}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...' || page === currentPage || isLoading}
              className={`min-w-[2.5rem] h-10 px-3 rounded-md text-sm font-medium transition-colors ${
                page === currentPage
                  ? 'bg-brand-600 text-white'
                  : page === '...'
                  ? 'text-stone-400 dark:text-stone-500 cursor-default'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Mobile page indicator */}
        <span className="sm:hidden text-sm text-stone-700 dark:text-stone-300 px-2">
          Page {currentPage} of {totalPages}
        </span>

        {/* Next page button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!hasNextPage || isLoading}
          className={`p-2 rounded-md transition-colors ${
            hasNextPage && !isLoading
              ? 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
              : 'text-stone-300 dark:text-stone-600 cursor-not-allowed'
          }`}
          title="Next page"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>

        {/* Last page button */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={!hasNextPage || isLoading}
          className={`p-2 rounded-md transition-colors ${
            hasNextPage && !isLoading
              ? 'text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700'
              : 'text-stone-300 dark:text-stone-600 cursor-not-allowed'
          }`}
          title="Last page"
        >
          <ChevronDoubleRightIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Right side - Items per page */}
      {showItemsPerPage && (
        <div className="flex items-center gap-2">
          <label htmlFor="itemsPerPage" className="text-sm text-stone-700 dark:text-stone-300">
            Per page:
          </label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            disabled={isLoading}
            className="block w-20 rounded-md border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-700 text-stone-900 dark:text-white text-sm focus:border-brand-500 focus:ring-brand-500 disabled:opacity-50 transition-colors"
          >
            {itemsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default Pagination;
