import { entityConfigSchema } from '@/entity-library/config';

function main(): void {
  const example = {
    entityName: 'example',
    displayName: 'Example',
    displayNamePlural: 'Examples',
    generatedDtoType: {},
    apiBasePath: '/api/examples',
    table: {
      columns: [{ field: 'name', header: 'Name', type: 'text', sortable: true }],
      pagination: {
        defaultPageSize: 25,
        pageSizeOptions: [10, 25, 50],
        strategy: 'offset',
      },
    },
  };

  entityConfigSchema.parse(example);
}

main();
