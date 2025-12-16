'use client';

import type { RowActionConfig } from '@/entity-library/config';
import { useConfirmAction } from '@/entity-library/hooks/useConfirmAction';
import { TableRowActionsMenu } from './TableRowActionsMenu';
import { TableRowActionsConfirm } from './TableRowActionsConfirm';

export function TableRowActions<TEntity extends object>({
  actions,
  row,
}: {
  actions: Array<RowActionConfig<TEntity>>;
  row: TEntity;
}) {
  if (!actions.length) return null;

  const { pending, pendingId, setPendingId } = useConfirmAction(actions);

  const run = async (a: RowActionConfig<TEntity>) => {
    const msg = typeof a.confirmationMessage === 'function' ? a.confirmationMessage(row) : a.confirmationMessage;
    if (a.requiresConfirmation && msg) return setPendingId(a.id);
    await a.onClick?.(row);
  };

  return (
    <>
      <TableRowActionsMenu actions={actions} onAction={run} />

      {pending ? (
        <TableRowActionsConfirm
          action={pending}
          row={row}
          open={!!pendingId}
          onOpenChange={(o) => (o ? undefined : setPendingId(null))}
          onConfirm={async () => (await pending.onClick?.(row), setPendingId(null))}
        />
      ) : null}
    </>
  );
}
