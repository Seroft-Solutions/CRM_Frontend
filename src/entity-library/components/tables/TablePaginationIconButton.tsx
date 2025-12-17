'use client';

import type { ComponentType } from 'react';

import { Button } from '@/components/ui/button';

export function TablePaginationIconButton({
  Icon,
  onClick,
  disabled,
  className,
}: {
  Icon: ComponentType<{ className?: string }>;
  onClick: () => void;
  disabled: boolean;
  className: string;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      <Icon className="h-3.5 w-3.5" />
    </Button>
  );
}
