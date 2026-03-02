'use client';

import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import type { PaginationPageItem } from './getPaginationPageItems';

export function TablePaginationPageButtons({
  items,
  page,
  onPageChange,
}: {
  items: PaginationPageItem[];
  page: number;
  onPageChange: (page: number) => void;
}) {
  return items.map((p) =>
    p === 'ellipsis-start' || p === 'ellipsis-end' ? (
      <Button
        key={p}
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 w-7 cursor-default p-0"
        disabled
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </Button>
    ) : (
      <Button
        key={p}
        type="button"
        size="sm"
        variant={p === page ? 'default' : 'outline'}
        onClick={() => onPageChange(p)}
        className={`h-7 w-7 p-0 ${
          p === page
            ? 'bg-[oklch(0.45_0.06_243)] text-white hover:bg-[oklch(0.45_0.06_243)]/90'
            : 'border-[oklch(0.45_0.06_243)]/20'
        }`}
      >
        {p}
      </Button>
    )
  );
}
