'use client';

import { useCallback, useMemo, useState } from 'react';
import type { TableState } from '@/entity-library/types';
import type { EntityConfig, StatusTab, TableConfig } from '@/entity-library/config';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { EntityTable } from './tables/EntityTable';
import { createEntityActions } from '@/entity-library/actions';
import type { StatusEnum } from '@/entity-library/config';

interface EntityTablePageProps<TEntity extends object, TStatus extends StatusEnum> {
  config: EntityConfig<TEntity, TStatus>;
}

export function EntityTablePage<TEntity extends object, TStatus extends StatusEnum>({
  config,
}: EntityTablePageProps<TEntity, TStatus>) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [activeStatusTab, setActiveStatusTab] = useState<StatusTab>('active');

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

    const filterParams: Record<string, any> = {};
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
  }, [state, activeStatusTab]);

  const { data, isLoading, refetch } = config.useGetAll(queryParams);

  const { rows, total } = useMemo(() => {
    if (!data) {
      return { rows: [] as TEntity[], total: 0 };
    }

    // Support APIs that return a Spring Page-like object
    if (!Array.isArray(data) && typeof data === 'object') {
      const maybePage = data as { content?: TEntity[]; totalElements?: number };
      return {
        rows: maybePage.content ?? [],
        total: maybePage.totalElements ?? (maybePage.content?.length ?? 0),
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

  const invalidateQueries = useCallback(
    async () =>
      queryClient.invalidateQueries({
        predicate: (q) =>
          typeof q.queryKey?.[0] === 'string' &&
          (q.queryKey[0] as string).startsWith(config.queryKeyPrefix),
      }),
    [queryClient, config.queryKeyPrefix]
  );

  const { createBulkActions, createRowActions } = useMemo(
    () =>
      createEntityActions<TEntity, TStatus>({
        updateMutation: async (id, data) => {
          await updateAsync({ id, data });
        },
        invalidateQueries,
        statusEnum: config.statusEnum,
        router,
        basePath: config.basePath,
        getEntityId: config.getEntityId,
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

  return (
    <>
      <EntityTable<TEntity>
        config={tableConfig}
        rows={rows}
        total={total}
        getRowId={(row) => String(config.getEntityId(row) || '')}
        onStateChange={setState}
        toolbar={
          <Tabs value={activeStatusTab} onValueChange={(v) => setActiveStatusTab(v as StatusTab)}>
            <TabsList>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
        }
        actions={
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RotateCcw className="h-4 w-4" />
          </Button>
        }
      />
    </>
  );
}

