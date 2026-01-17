'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface AdvancedPaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;

  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;

  pageSizeOptions?: number[];
  showPageSizeSelector?: boolean;
  showPageInput?: boolean;
  showItemsInfo?: boolean;
  showFirstLastButtons?: boolean;
  maxPageButtons?: number;

  isLoading?: boolean;

  compact?: boolean;
}

export function AdvancedPagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  showPageSizeSelector = true,
  showPageInput = true,
  showItemsInfo = true,
  showFirstLastButtons = true,
  maxPageButtons = 7,
  isLoading = false,
  compact = false,
}: AdvancedPaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    if (totalPages <= maxPageButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const halfWindow = Math.floor(maxPageButtons / 2);
    let start = Math.max(1, currentPage - halfWindow);
    let end = Math.min(totalPages, start + maxPageButtons - 1);

    if (end - start + 1 < maxPageButtons) {
      start = Math.max(1, end - maxPageButtons + 1);
    }

    const pages = [];

    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('ellipsis-start');
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= totalPages) {
      onPageChange(value);
    }
  };

  const handlePageInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handlePageInputChange(e as any);
    }
  };

  if (totalItems === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-col gap-3 ${compact ? 'sm:flex-row sm:items-center sm:justify-between' : 'lg:flex-row lg:items-center lg:justify-between'}`}
    >
      {/* Items Info & Page Size Selector */}
      <div
        className={`flex flex-col gap-2 ${compact ? 'sm:flex-row sm:items-center' : 'lg:flex-row lg:items-center'}`}
      >
        {showItemsInfo && (
          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {compact ? (
              <span className="hidden sm:inline">
                {startItem}-{endItem} of {totalItems.toLocaleString()}
              </span>
            ) : (
              <span>
                Showing <span className="font-medium">{startItem}</span> to{' '}
                <span className="font-medium">{endItem}</span> of{' '}
                <span className="font-medium">{totalItems.toLocaleString()}</span> results
              </span>
            )}
            <span className="sm:hidden">
              {startItem}-{endItem} of {totalItems.toLocaleString()}
            </span>
          </div>
        )}

        {showPageSizeSelector && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {compact ? 'Show:' : 'Items per page:'}
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(Number(value))}
              disabled={isLoading}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div
        className={`flex items-center gap-2 ${compact ? '' : 'flex-wrap justify-center lg:justify-end'}`}
      >
        {/* Page Input */}
        {showPageInput && !compact && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Page</span>
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={handlePageInputChange}
              onKeyPress={handlePageInputKeyPress}
              className="w-16 h-8 text-center"
              disabled={isLoading}
            />
            <span className="text-sm text-muted-foreground whitespace-nowrap">of {totalPages}</span>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          {/* First Page */}
          {showFirstLastButtons && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1 || isLoading}
              className="h-8 w-8 p-0"
              aria-label="Go to first page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
          )}

          {/* Previous Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            className={`h-8 ${compact ? 'w-8 p-0' : 'px-3'}`}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="h-4 w-4" />
            {!compact && <span className="ml-1 hidden sm:inline">Previous</span>}
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {pageNumbers.map((page, index) => {
              if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                return (
                  <Button
                    key={page}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 cursor-default"
                    disabled
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                );
              }

              const pageNum = page as number;
              const isActive = pageNum === currentPage;

              return (
                <Button
                  key={pageNum}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  disabled={isLoading}
                  className={`h-8 w-8 p-0 ${isActive ? 'pointer-events-none' : ''}`}
                  aria-label={`Go to page ${pageNum}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          {/* Next Page */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            className={`h-8 ${compact ? 'w-8 p-0' : 'px-3'}`}
            aria-label="Go to next page"
          >
            <ChevronRight className="h-4 w-4" />
            {!compact && <span className="mr-1 hidden sm:inline">Next</span>}
          </Button>

          {/* Last Page */}
          {showFirstLastButtons && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages || isLoading}
              className="h-8 w-8 p-0"
              aria-label="Go to last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Compact Page Input */}
        {showPageInput && compact && (
          <div className="flex items-center gap-1 ml-2">
            <Input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={handlePageInputChange}
              onKeyPress={handlePageInputKeyPress}
              className="w-12 h-8 text-center text-xs"
              disabled={isLoading}
              placeholder={currentPage.toString()}
            />
            <span className="text-xs text-muted-foreground">/{totalPages}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function usePaginationState(initialPage: number = 1, initialPageSize: number = 10) {
  const [page, setPage] = React.useState(initialPage);
  const [pageSize, setPageSize] = React.useState(initialPageSize);

  const handlePageChange = React.useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handlePageSizeChange = React.useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  const resetPagination = React.useCallback(() => {
    setPage(1);
  }, []);

  return {
    page,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
    resetPagination,
  };
}
