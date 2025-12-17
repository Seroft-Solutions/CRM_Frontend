import assert from 'node:assert/strict';

import type { EntityConfig, StatusEnum, TableConfig } from '@/entity-library/config';

function main(): void {
  const statusEnum = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    ARCHIVED: 'ARCHIVED',
  } as const satisfies StatusEnum;

  type ExampleEntity = { id: number; name: string; status: string };

  const tableConfig: TableConfig<ExampleEntity> = {
    columns: [{ field: 'id', header: 'ID', type: 'number', sortable: true }],
    pagination: {
      defaultPageSize: 10,
      pageSizeOptions: [10, 25, 50],
      strategy: 'offset',
    },
  };

  const example: EntityConfig<ExampleEntity, typeof statusEnum> = {
    entityName: 'Examples',
    basePath: '/examples',
    queryKeyPrefix: '/api/examples',
    getEntityId: (e: ExampleEntity) => e.id,
    statusEnum,
    useGetAll: () => ({ data: [], isLoading: false, refetch: () => undefined }),
    useUpdate: () => ({ mutateAsync: async () => ({}) }),
    tableConfig,
  };

  // Basic runtime sanity checks (type safety is enforced by compilation).
  assert.equal(example.basePath.startsWith('/'), true);
  assert.equal(example.queryKeyPrefix.startsWith('/'), true);
  assert.ok(example.tableConfig.columns.length > 0);
}

main();
