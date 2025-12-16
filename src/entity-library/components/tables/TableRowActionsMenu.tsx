'use client';

import type { RowActionConfig } from '@/entity-library/config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';

export function TableRowActionsMenu<TEntity extends object>({
  actions,
  onAction,
}: {
  actions: Array<RowActionConfig<TEntity>>;
  onAction: (action: RowActionConfig<TEntity>) => void | Promise<void>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="Row actions">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((a) => (
          <DropdownMenuItem
            key={a.id}
            className={a.variant === 'destructive' ? 'text-destructive focus:text-destructive' : undefined}
            onSelect={() => onAction(a)}
          >
            {a.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
