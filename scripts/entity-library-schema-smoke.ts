import { createDefaultEntityLibraryConfig, validateEntityLibraryConfig } from '@/entity-library/config';

function main(): void {
  const statusEnum = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    ARCHIVED: 'ARCHIVED',
  } as const;

  type ExampleEntity = { id: number; name: string; status: string };

  const example = createDefaultEntityLibraryConfig<ExampleEntity, typeof statusEnum>({
    entityId: 'example',
    displayName: 'Example',
    displayNamePlural: 'Examples',
    basePath: '/examples',
    apiKeyPrefix: '/api/examples',
    getEntityId: (e) => e.id,
    statusEnum,
    useGetAll: () => ({ data: [], isLoading: false, refetch: () => undefined }),
    useUpdate: () => ({ mutateAsync: async () => ({}) }),
    tableConfig: {
      columns: [{ field: 'id', header: 'ID', type: 'number', sortable: true }],
      pagination: {
        defaultPageSize: 10,
        pageSizeOptions: [10, 25, 50],
        strategy: 'offset',
      },
    },
  });

  const result = validateEntityLibraryConfig(example);
  if (!result.isValid) {
    throw new Error(`EntityLibraryConfig smoke test failed: ${JSON.stringify(result)}`);
  }
}

main();
