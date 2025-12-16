import assert from 'node:assert/strict';

import { entityConfigSchema } from '@/entity-library/config';
import { customerEntityConfig } from '@/app/(protected)/(features)/customers/config';

function testValidConfigParses(): void {
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
    search: {
      globalSearchFields: ['name'],
      debounceMs: 300,
    },
  };

  const parsed = entityConfigSchema.parse(example);
  assert.equal(parsed.entityName, 'example');
}

function testCustomersConfigParses(): void {
  const parsed = entityConfigSchema.parse(customerEntityConfig);
  assert.equal(parsed.entityName, 'customer');
}

function testMissingEntityNameFails(): void {
  assert.throws(() => {
    entityConfigSchema.parse({
      displayName: 'Example',
      displayNamePlural: 'Examples',
      generatedDtoType: {},
      apiBasePath: '/api/examples',
      table: {
        columns: [{ field: 'name', header: 'Name' }],
        pagination: { defaultPageSize: 25, pageSizeOptions: [25] },
      },
    });
  });
}

function testEmptyColumnsFails(): void {
  assert.throws(() => {
    entityConfigSchema.parse({
      entityName: 'example',
      displayName: 'Example',
      displayNamePlural: 'Examples',
      generatedDtoType: {},
      apiBasePath: '/api/examples',
      table: {
        columns: [],
        pagination: { defaultPageSize: 25, pageSizeOptions: [25] },
      },
    });
  });
}

function main(): void {
  testValidConfigParses();
  testCustomersConfigParses();
  testMissingEntityNameFails();
  testEmptyColumnsFails();
}

main();
