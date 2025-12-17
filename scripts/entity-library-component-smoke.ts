import assert from 'node:assert/strict';

import { EntityTable } from '@/entity-library/components/tables/EntityTable';
import { EntityForm } from '@/entity-library/components/forms/EntityForm';
import { FormWizard } from '@/entity-library/components/forms/FormWizard';

function main(): void {
  assert.equal(typeof EntityTable, 'function');
  assert.equal(typeof EntityForm, 'function');
  assert.equal(typeof FormWizard, 'function');
}

main();

