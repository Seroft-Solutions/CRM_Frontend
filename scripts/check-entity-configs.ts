#!/usr/bin/env tsx

/**
 * Entity Library Config Checker
 * 
 * Validates all entity library configurations in the project
 * Ensures no capabilities are overlooked
 * 
 * Usage: tsx scripts/check-entity-configs.ts
 */

import { validateEntityLibraryConfig } from '../src/entity-library/config/entity-library-config';

// Import all entity configs here
import { systemConfigAttributeOptionFullConfig } from '../src/app/(protected)/(features)/system-config-attribute-options/config/entity-library.config';
import { systemConfigLibraryConfig } from '../src/app/(protected)/(features)/system-configs/config/entity-library.config';

const configs = [
  {
    name: 'System Config Attribute Options',
    config: systemConfigAttributeOptionFullConfig,
  },
  {
    name: 'System Configs',
    config: systemConfigLibraryConfig,
  },
  // Add more configs as they are created
];

console.log('🔍 Validating Entity Library Configurations...\n');

let totalErrors = 0;
let totalWarnings = 0;
let totalConfigs = configs.length;
let validConfigs = 0;

configs.forEach(({ name, config }) => {
  console.log(`\n📋 Validating: ${name}`);
  console.log('─'.repeat(50));
  
  const validation = validateEntityLibraryConfig(config);
  
  if (validation.isValid) {
    console.log('✅ Valid configuration');
    validConfigs++;
  } else {
    console.log('❌ Invalid configuration');
  }
  
  if (validation.missingRequired.length > 0) {
    console.log('\n🔴 Missing Required Fields:');
    validation.missingRequired.forEach(field => {
      console.log(`   - ${field}`);
    });
    totalErrors += validation.missingRequired.length;
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
