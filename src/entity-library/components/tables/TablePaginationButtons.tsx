'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';

export function TablePaginationButtons({
  page,
  maxPage,
  onPageChange,
}: {
  page: number;
  maxPage: number;
  onPageChange: (page: number) => void;
}) {
  const getPageNumbers = () => {
    const maxButtons = 5;
    if (maxPage <= maxButtons) {
      return Array.from({ length: maxPage }, (_, i) => i + 1);
    }

    const halfWindow = Math.floor(maxButtons / 2);
    let start = Math.max(1, page - halfWindow);
    let end = Math.min(maxPage, start + maxButtons - 1);

    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }

    const pages = [];
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('ellipsis-start');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < maxPage) {
      if (end < maxPage - 1) pages.push('ellipsis-end');
      pages.push(maxPage);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onPageChange(1)}
        disabled={page === 1}
        className="h-7 w-7 p-0 border-[oklch(0.45_0.06_243)]/20"
      >
        <ChevronsLeft className="h-3.5 w-3.5" />
      </Button>

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="h-7 px-2 border-[oklch(0.45_0.06_243)]/20"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>

      <div className="hidden sm:flex items-center gap-1">
        {pageNumbers.map((p, i) => {
          if (p === 'ellipsis-start' || p === 'ellipsis-end') {
            return (
              <Button
                key={p}
                type="button"
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 cursor-default"
                disabled
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            );
          }

          const pageNum = p as number;
          const isActive = pageNum === page;

          return (
            <Button
              key={pageNum}
              type="button"
              size="sm"
              variant={isActive ? 'default' : 'outline'}
              onClick={() => onPageChange(pageNum)}
              className={`h-7 w-7 p-0 ${isActive ? 'bg-[oklch(0.45_0.06_243)] text-white hover:bg-[oklch(0.45_0.06_243)]/90' : 'border-[oklch(0.45_0.06_243)]/20'}`}
            >
              {pageNum}
            </Button>
          );
        })}
      </div>

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= maxPage}
        className="h-7 px-2 border-[oklch(0.45_0.06_243)]/20"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => onPageChange(maxPage)}
        disabled={page === maxPage}
        className="h-7 w-7 p-0 border-[oklch(0.45_0.06_243)]/20"
      >
        <ChevronsRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
