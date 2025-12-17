'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TableState } from '@/entity-library/types';
import type {
  EntityTablePageConfig,
  StatusEnum,
  StatusTab,
  TableConfig,
} from '@/entity-library/config';

import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useEntityMutations } from '../hooks/useEntityMutations';
import { createEntityActions } from '../actions/createEntityActions';
import { EntityTable } from './tables/EntityTable';
import { EntityStatusTabs } from './tables/EntityStatusTabs';

interface EntityTablePageProps<TEntity extends object, TStatus extends StatusEnum> {
  config: EntityTablePageConfig<TEntity, TStatus>;
}

export function EntityTablePage<TEntity extends object, TStatus extends StatusEnum>({
  config,
}: EntityTablePageProps<TEntity, TStatus>) {
  const router = useRouter();
  const { invalidateQueries } = useEntityMutations(config.queryKeyPrefix);
  const [activeStatusTab, setActiveStatusTab] = useState<StatusTab>('active');
  const showStatusTabs = config.toolbar?.showStatusTabs !== false;
  const statusTabs = config.toolbar?.statusTabs ?? ['active', 'inactive', 'archived', 'all'];
  const toolbarTheme = config.toolbar?.theme ?? 'default';

  const [state, setState] = useState<TableState<TEntity>>({
    page: 1,
    pageSize: config.tableConfig.pagination.defaultPageSize,
    sort: config.tableConfig.defaultSort,
    filters: {},
    selectedIds: [],
  });

  // Build query params
  const queryParams = useMemo(() => {
    const apiPage = state.page - 1;
    const sortField = state.sort?.field || config.tableConfig.defaultSort?.field;
    const sortDirection = state.sort?.direction || 'asc';

    const filterParams: Record<string, string> = {};

    Object.entries(state.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        filterParams[`${key}.contains`] = value;
      }
    });

    if (activeStatusTab !== 'all') {
      filterParams['status.equals'] = activeStatusTab.toUpperCase();
    }

    return {
      page: apiPage,
      size: state.pageSize,
      sort: [`${String(sortField)},${sortDirection}`],
      ...filterParams,
    };
  }, [activeStatusTab, config.tableConfig.defaultSort, state]);

  const { data, refetch } = config.useGetAll(queryParams);

  const { rows, total } = useMemo(() => {
    if (!data) {
      return { rows: [] as TEntity[], total: 0 };
    }

    // Support APIs that return a Spring Page-like object
    if (!Array.isArray(data) && typeof data === 'object') {
      const maybePage = data as { content?: TEntity[]; totalElements?: number };

      return {
        rows: maybePage.content ?? [],
        total: maybePage.totalElements ?? maybePage.content?.length ?? 0,
      };
    }

    // Support APIs that return a plain array (client-side pagination)
    const allRows = (data as TEntity[]) ?? [];
    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;

    return {
      rows: allRows.slice(start, end),
      total: allRows.length,
    };
  }, [data, state.page, state.pageSize]);

  const { mutateAsync: updateAsync } = config.useUpdate();

  const { createBulkActions, createRowActions } = useMemo(
    () =>
      createEntityActions<TEntity, TStatus>({
        updateMutation: async (id: number, data: TEntity) => {
          await updateAsync({ id, data });
        },
        invalidateQueries,
        statusEnum: config.statusEnum,
        router,
        basePath: config.basePath,
        getEntityId: config.getEntityId,
        includeViewAction: config.includeViewAction,
        includeEditAction: config.includeEditAction,
      }),
    [updateAsync, invalidateQueries, config, router]
  );

  const tableConfig: TableConfig<TEntity> = useMemo(() => {
    return {
      ...config.tableConfig,
      bulkActions: createBulkActions(),
      rowActions: createRowActions(),
    };
  }, [config.tableConfig, createBulkActions, createRowActions]);

  const handleRefresh = useCallback(() => {
    refetch();
    toast.success(`Refreshed ${config.entityName}`);
  }, [refetch, config.entityName]);

  const statusTabsNode = showStatusTabs ? (
    <EntityStatusTabs
      value={activeStatusTab}
      onValueChange={setActiveStatusTab}
      tabs={statusTabs}
      theme={toolbarTheme}
    />
  ) : null;

  const toolbarLeft =
    config.toolbar?.left || statusTabsNode ? (
      <div className="flex flex-wrap items-center gap-2">
        {config.toolbar?.left}
        {statusTabsNode}
      </div>
    ) : undefined;

  const toolbarRight = config.toolbar?.right ? (
    <div className="flex flex-wrap items-center gap-2">{config.toolbar.right}</div>
  ) : undefined;

  return (
    <>
      <EntityTable<TEntity>
        config={tableConfig}
        rows={rows}
        total={total}
        getRowId={(row: TEntity) => String(config.getEntityId(row) || '')}
        onStateChange={setState}
        toolbar={toolbarLeft}
        toolbarTheme={toolbarTheme}
        actions={
          <>
            {toolbarRight}
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className={
                toolbarTheme === 'sidebar'
                  ? 'border-[color:var(--sidebar-accent)] bg-transparent text-[color:var(--sidebar-accent)] hover:bg-[color:var(--sidebar-accent)] hover:text-[color:var(--sidebar-accent-foreground)]'
                  : undefined
              }
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </>
        }
      />
    </>
  );
}
