'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { getPaginationPageItems } from './getPaginationPageItems';
import { TablePaginationIconButton } from './TablePaginationIconButton';
import { TablePaginationPageButtons } from './TablePaginationPageButtons';

export function TablePaginationButtons({
  page,
  maxPage,
  onPageChange,
}: {
  page: number;
  maxPage: number;
  onPageChange: (page: number) => void;
}) {
  const pageItems = getPaginationPageItems(page, maxPage);

  return (
    <div className="flex items-center gap-1">
      <TablePaginationIconButton
        Icon={ChevronsLeft}
        onClick={() => onPageChange(1)}
        disabled={page === 1}
        className="h-7 w-7 border-[oklch(0.45_0.06_243)]/20 p-0"
      />
      <TablePaginationIconButton
        Icon={ChevronLeft}
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="h-7 border-[oklch(0.45_0.06_243)]/20 px-2"
      />
      <div className="hidden sm:flex items-center gap-1">
        <TablePaginationPageButtons items={pageItems} page={page} onPageChange={onPageChange} />
      </div>
      <TablePaginationIconButton
        Icon={ChevronRight}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= maxPage}
        className="h-7 border-[oklch(0.45_0.06_243)]/20 px-2"
      />
      <TablePaginationIconButton
        Icon={ChevronsRight}
        onClick={() => onPageChange(maxPage)}
        disabled={page === maxPage}
        className="h-7 w-7 border-[oklch(0.45_0.06_243)]/20 p-0"
      />
    </div>
  );
}
