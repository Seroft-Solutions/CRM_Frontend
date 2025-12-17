import assert from 'node:assert/strict';

import type { EntityConfig, StatusEnum, TableConfig } from '@/entity-library/config';

function testEntityConfigShape(): void {
  const statusEnum = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    ARCHIVED: 'ARCHIVED',
  } as const satisfies StatusEnum;

  type ExampleEntity = { id: number; name: string; status: string };

  const tableConfig: TableConfig<ExampleEntity> = {
    columns: [{ field: 'name', header: 'Name', sortable: true, filterable: true }],
    pagination: { defaultPageSize: 10, pageSizeOptions: [10, 25], strategy: 'offset' },
  };

  const config: EntityConfig<ExampleEntity, typeof statusEnum> = {
    entityName: 'Examples',
    basePath: '/examples',
    queryKeyPrefix: '/api/examples',
    tableConfig,
    statusEnum,
    getEntityId: (e: ExampleEntity) => e.id,
    useGetAll: () => ({ data: [], isLoading: false, refetch: () => undefined }),
    useUpdate: () => ({ mutateAsync: async () => ({}) }),
  };

  assert.equal(typeof config.entityName, 'string');
  assert.ok(config.entityName.length > 0);
  assert.equal(config.basePath.startsWith('/'), true);
  assert.equal(config.queryKeyPrefix.startsWith('/'), true);
  assert.ok(config.tableConfig.columns.length > 0);
}

function main(): void {
  testEntityConfigShape();
}

main();
