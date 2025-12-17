'use client';

import type { BulkActionConfig } from '@/entity-library/config';
import { Button } from '@/components/ui/button';
import { useConfirmAction } from '@/entity-library/hooks';
import { TableActionsConfirm } from './TableActionsConfirm';

export function TableActions<TEntity extends object>({
  actions,
  selectedRows,
}: {
  actions?: Array<BulkActionConfig<TEntity>>;
  selectedRows: TEntity[];
}) {
  if (!actions?.length || selectedRows.length === 0) return null;

  const { pending, pendingId, setPendingId } = useConfirmAction(actions);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 p-3">
        {actions.map((a) => (
          <Button
            key={a.id}
            type="button"
            size="sm"
            variant={a.variant === 'destructive' ? 'destructive' : 'default'}
            onClick={async () => {
              const msg = typeof a.confirmationMessage === 'function' ? a.confirmationMessage(selectedRows.length) : a.confirmationMessage;
              if (a.requiresConfirmation && msg) return setPendingId(a.id);
              await a.onClick?.(selectedRows);
            }}
          >
            {a.label} {selectedRows.length ? `(${selectedRows.length})` : null}
          </Button>
        ))}
      </div>
      {pending ? (
        <TableActionsConfirm
          action={pending}
          open={!!pendingId}
          count={selectedRows.length}
          onOpenChange={(o) => (o ? undefined : setPendingId(null))}
          onConfirm={async () => (await pending.onClick?.(selectedRows), setPendingId(null))}
        />
      ) : null}
    </>
  );
}
