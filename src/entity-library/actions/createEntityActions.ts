import { toast } from 'sonner';
import type { BulkActionConfig, RowActionConfig, StatusEnum } from '@/entity-library/config';

export function createEntityActions<TEntity extends object, TStatus extends StatusEnum>({
  updateMutation,
  invalidateQueries,
  statusEnum,
  router,
  basePath,
  getEntityId,
  includeViewAction = true,
  includeEditAction = true,
}: {
  updateMutation: (id: number, data: TEntity) => Promise<void>;
  invalidateQueries: () => Promise<void>;
  statusEnum: TStatus;
  router?: { push: (url: string) => void };
  basePath?: string;
  getEntityId: (entity: TEntity) => number | undefined;
  includeViewAction?: boolean;
  includeEditAction?: boolean;
}) {
  const setStatusForRow = async (row: TEntity, status: string) => {
    const id = getEntityId(row);

    if (typeof id !== 'number') {
      toast.info('No valid row selected');

      return;
    }

    try {
      await updateMutation(id, { ...row, status } as TEntity);
      await invalidateQueries();
      toast.success('Item updated');
    } catch (e) {
      toast.error('Failed to update item');
      throw e;
    }
  };

  const setStatusForRows = async (selectedRows: TEntity[], status: string) => {
    const targets = selectedRows.filter((r) => typeof getEntityId(r) === 'number');

    if (targets.length === 0) {
      toast.info('No selectable rows');

      return;
    }

    try {
      for (const row of targets) {
        const id = getEntityId(row);

        if (typeof id === 'number') {
          await updateMutation(id, { ...row, status } as TEntity);
        }
      }
      await invalidateQueries();
      toast.success(`Updated ${targets.length} item(s)`);
    } catch (e) {
      toast.error('Failed to update items');
      throw e;
    }
  };

  const createBulkActions = (): BulkActionConfig<TEntity>[] => {
    const actions: BulkActionConfig<TEntity>[] = [];

    if (statusEnum.ARCHIVED) {
      actions.push({
        id: 'archive',
        label: 'Archive',
        variant: 'destructive' as const,
        requiresConfirmation: true,
        confirmationMessage: (count: number) => `Archive ${count} item(s)?`,
        onClick: (rows: TEntity[]) => setStatusForRows(rows, statusEnum.ARCHIVED),
      });
    }

    if (statusEnum.ACTIVE) {
      actions.push({
        id: 'set-active',
        label: 'Set Active',
        onClick: (rows: TEntity[]) => setStatusForRows(rows, statusEnum.ACTIVE),
      });
    }

    if (statusEnum.INACTIVE) {
      actions.push({
        id: 'set-inactive',
        label: 'Set Inactive',
        onClick: (rows: TEntity[]) => setStatusForRows(rows, statusEnum.INACTIVE),
      });
    }

    return actions;
  };

  const createRowActions = (): RowActionConfig<TEntity>[] => {
    const actions: RowActionConfig<TEntity>[] = [];

    if (router && basePath) {
      if (includeViewAction) {
        actions.push({
          id: 'view',
          label: 'View',
          onClick: (row: TEntity) => {
            const id = getEntityId(row);

            if (typeof id === 'number') {
              router.push(`${basePath}/${id}`);
            }
          },
        });
      }

      if (includeEditAction) {
        actions.push({
          id: 'edit',
          label: 'Edit',
          onClick: (row: TEntity) => {
            const id = getEntityId(row);

            if (typeof id === 'number') {
              router.push(`${basePath}/${id}/edit`);
            }
          },
        });
      }
    }

    if (statusEnum.ARCHIVED) {
      actions.push({
        id: 'archive-row',
        label: 'Archive',
        variant: 'destructive',
        requiresConfirmation: true,
        confirmationMessage: () => 'Archive this item?',
        onClick: (row: TEntity) => setStatusForRow(row, statusEnum.ARCHIVED),
      });
    }

    return actions;
  };

  return {
    setStatusForRow,
    setStatusForRows,
    createBulkActions,
    createRowActions,
  };
}
