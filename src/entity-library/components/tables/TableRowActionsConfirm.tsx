'use client';

import type { RowActionConfig } from '@/entity-library/config';
import { ConfirmDialog } from '../common/ConfirmDialog';

export function TableRowActionsConfirm<TEntity extends object>({
  action,
  row,
  open,
  onOpenChange,
  onConfirm,
}: {
  action: RowActionConfig<TEntity>;
  row: TEntity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
}) {
  const description =
    typeof action.confirmationMessage === 'function'
      ? action.confirmationMessage(row)
      : action.confirmationMessage;

  return (
    <ConfirmDialog
      open={open}
      title={action.label}
      description={description}
      confirmLabel={action.label}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
    />
  );
}
