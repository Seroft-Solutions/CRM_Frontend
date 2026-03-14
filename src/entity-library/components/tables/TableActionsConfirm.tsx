'use client';

import type { BulkActionConfig } from '@/entity-library/config';
import { ConfirmDialog } from '../common/ConfirmDialog';

export function TableActionsConfirm<TEntity extends object>({
  action,
  open,
  onOpenChange,
  onConfirm,
  count,
}: {
  action: BulkActionConfig<TEntity>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  count: number;
}) {
  const description =
    typeof action.confirmationMessage === 'function'
      ? action.confirmationMessage(count)
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
