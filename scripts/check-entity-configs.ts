#!/usr/bin/env tsx

/**
 * Entity Library Config Checker
 * 
 * Basic runtime checks for EntityConfig objects used by EntityTablePage.
 * 
 * Usage: tsx scripts/check-entity-configs.ts
 */

import type { EntityConfig, StatusEnum } from '../src/entity-library/config/entity-library-config';

// Import all entity configs here
import { systemConfigAttributeOptionEntityConfig } from '../src/app/(protected)/(features)/system-config-attribute-options/config/entity.config';
import { systemConfigEntityConfig } from '../src/app/(protected)/(features)/system-configs/config/entity.config';

const configs = [
  {
    name: 'System Config Attribute Options',
    config: systemConfigAttributeOptionEntityConfig,
  },
  {
    name: 'System Configs',
    config: systemConfigEntityConfig,
  },
  // Add more configs as they are created
];

function validateEntityConfig(config: EntityConfig<any, StatusEnum>) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.entityName?.trim()) errors.push('entityName is required');
  if (!config.basePath?.startsWith('/')) errors.push('basePath must start with "/"');
  if (!config.queryKeyPrefix?.startsWith('/')) warnings.push('queryKeyPrefix should start with "/"');
  if (!config.tableConfig?.columns?.length) errors.push('tableConfig.columns must not be empty');
  if (!config.tableConfig?.pagination?.defaultPageSize) errors.push('pagination.defaultPageSize is required');
  if (!config.tableConfig?.pagination?.pageSizeOptions?.length) warnings.push('pagination.pageSizeOptions is empty');

  return { isValid: errors.length === 0, errors, warnings };
}

console.log('🔍 Checking EntityConfig objects...\n');

let totalErrors = 0;
let totalWarnings = 0;
let totalConfigs = configs.length;
let validConfigs = 0;

configs.forEach(({ name, config }) => {
  console.log(`\n📋 Validating: ${name}`);
  console.log('─'.repeat(50));
  
  const validation = validateEntityConfig(config as EntityConfig<any, StatusEnum>);
  
  if (validation.isValid) {
    console.log('✅ Valid configuration');
    validConfigs++;
  } else {
    console.log('❌ Invalid configuration');
  }
  
  if (validation.errors.length > 0) {
    console.log('\n🔴 Errors:');
    validation.errors.forEach(error => {
      console.log(`   - ${error}`);
    });
    totalErrors += validation.errors.length;
  }
  
  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    validation.warnings.forEach(warning => {
      console.log(`   - ${warning}`);
    });
    totalWarnings += validation.warnings.length;
  }
  
  if (validation.isValid && validation.warnings.length === 0) {
    console.log('🎉 Perfect configuration!');
  }
});

console.log('\n' + '='.repeat(50));
console.log('📊 Validation Summary:');
console.log('='.repeat(50));
console.log(`Total Configs: ${totalConfigs}`);
console.log(`Valid: ${validConfigs} ✅`);
console.log(`Invalid: ${totalConfigs - validConfigs} ❌`);
console.log(`Total Errors: ${totalErrors}`);
console.log(`Total Warnings: ${totalWarnings}`);

if (validConfigs === totalConfigs && totalErrors === 0) {
  console.log('\n🎊 All configurations are valid!');
  process.exit(0);
} else {
  console.log('\n❌ Some configurations need attention.');
  process.exit(1);
}
