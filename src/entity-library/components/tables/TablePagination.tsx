'use client';

import type { PaginationConfig } from '@/entity-library/config';
import { TablePageSizeSelect } from './TablePageSizeSelect';
import { TablePaginationButtons } from './TablePaginationButtons';

export function TablePagination({
  pagination,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  pagination: PaginationConfig;
  page: number;
  pageSize: number;
  total?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  const maxPage = total ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = total ? Math.min(page * pageSize, total) : 0;

  return (
    <div className="flex flex-col gap-3 border-t-2 border-[oklch(0.45_0.06_243)]/20 bg-gradient-to-r from-[oklch(0.45_0.06_243)]/5 to-transparent px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between rounded-b-lg">
      <div className="flex items-center gap-3 text-muted-foreground">
        {total !== undefined && (
          <span>
            Showing <span className="font-semibold text-[oklch(0.45_0.06_243)]">{startItem}</span>{' '}
            to <span className="font-semibold text-[oklch(0.45_0.06_243)]">{endItem}</span> of{' '}
            <span className="font-semibold text-[oklch(0.45_0.06_243)]">
              {total.toLocaleString()}
            </span>
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <TablePaginationButtons page={page} maxPage={maxPage} onPageChange={onPageChange} />

        <div className="flex items-center gap-3">
          {pagination.showPageSizeSelector ? (
            <TablePageSizeSelect
              pageSize={pageSize}
              options={pagination.pageSizeOptions}
              onChange={onPageSizeChange}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
