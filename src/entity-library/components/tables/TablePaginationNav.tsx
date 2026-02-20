'use client';

import { Button } from '@/components/ui/button';

export function TablePaginationNav({
  page,
  maxPage,
  onPrev,
  onNext,
}: {
  page: number;
  maxPage?: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={page <= 1}
        onClick={onPrev}
        className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white disabled:opacity-50"
      >
        Prev
      </Button>
      <span className="font-medium">
        Page {page}
        {maxPage ? ` / ${maxPage}` : null}
      </span>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={maxPage ? page >= maxPage : false}
        onClick={onNext}
        className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white disabled:opacity-50"
      >
        Next
      </Button>
    </div>
  );
}
