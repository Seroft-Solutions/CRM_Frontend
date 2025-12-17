import assert from 'node:assert/strict';

import { validateEntityLibraryConfig } from '@/entity-library/config';
import { systemConfigLibraryConfig } from '@/app/(protected)/(features)/system-configs/config/entity-library.config';

function testSystemConfigsComprehensiveConfigValid(): void {
  assert.ok(systemConfigLibraryConfig);

  const result = validateEntityLibraryConfig(systemConfigLibraryConfig);
  assert.equal(result.isValid, true, JSON.stringify(result));
}

function testMissingCoreFieldsFail(): void {
  const result = validateEntityLibraryConfig({} as any);
  assert.equal(result.isValid, false);
  assert.ok(result.missingRequired.includes('entityId'));
  assert.ok(result.missingRequired.includes('useGetAll'));
}

function main(): void {
  testSystemConfigsComprehensiveConfigValid();
  testMissingCoreFieldsFail();
}

main();
