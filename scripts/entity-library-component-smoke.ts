import assert from 'node:assert/strict';

import { EntityForm, EntityTable, FormWizard } from '@/entity-library';

function main(): void {
  assert.equal(typeof EntityTable, 'function');
  assert.equal(typeof EntityForm, 'function');
  assert.equal(typeof FormWizard, 'function');
}

main();

