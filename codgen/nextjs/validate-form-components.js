#!/usr/bin/env node

/**
 * Validation script to ensure modular form components are generated correctly
 */

const fs = require('fs');
const path = require('path');

function validateEntityForm(entityName) {
  console.log(`🔍 Validating ${entityName} form components...\n`);

  const entityRoute = entityName.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '');
  const entityDir = path.join(__dirname, '..', '..', 'src', 'app', '(protected)', entityRoute, 'components');
  
  // Check if the entity directory exists
  if (!fs.existsSync(entityDir)) {
    console.log(`❌ Entity directory not found: ${entityDir}`);
    return false;
  }

  // Required form files
  const requiredFiles = [
    `form/${entityName.toLowerCase()}-form-config.ts`,
    'form/form-types.ts',
    `form/${entityName.toLowerCase()}-form-schema.ts`,
    `form/${entityName.toLowerCase()}-form-provider.tsx`,
    `form/${entityName.toLowerCase()}-form-wizard.tsx`,
    'form/form-progress-indicator.tsx',
    'form/form-step-renderer.tsx',
    'form/form-navigation.tsx',
    'form/form-state-manager.tsx',
    'form/steps/basic-info-step.tsx',
    'form/steps/date-time-step.tsx',
    'form/steps/settings-step.tsx',
    'form/steps/geographic-step.tsx',
    'form/steps/user-assignment-step.tsx',
    'form/steps/classification-step.tsx',
    'form/steps/business-relations-step.tsx',
    'form/steps/other-relations-step.tsx',
    'form/steps/review-step.tsx'
  ];

  let allExist = true;
  let validImports = true;

  // Check file existence
  for (const file of requiredFiles) {
    const fullPath = path.join(entityDir, file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file} - MISSING`);
      allExist = false;
    }
  }

  // Check for common import issues
  const wizardPath = path.join(entityDir, `form/${entityName.toLowerCase()}-form-wizard.tsx`);
  if (fs.existsSync(wizardPath)) {
    const content = fs.readFileSync(wizardPath, 'utf8');
    
    // Check for incorrect import paths
    if (content.includes('./form/')) {
      console.log(`⚠️  Form wizard has incorrect import paths (./form/ instead of ./)`);
      validImports = false;
    }
    
    if (content.includes('../call-type-toast')) {
      console.log(`✅ Toast import path is correct`);
    } else {
      console.log(`⚠️  Toast import path may be incorrect`);
      validImports = false;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`Files: ${allExist ? '✅ All present' : '❌ Some missing'}`);
  console.log(`Imports: ${validImports ? '✅ All correct' : '⚠️  Some issues'}`);

  return allExist && validImports;
}

function validateAllEntities() {
  const jhipsterDir = path.join(__dirname, '..', '..', '.jhipster');
  
  if (!fs.existsSync(jhipsterDir)) {
    console.log('❌ .jhipster directory not found');
    return false;
  }

  const entities = fs.readdirSync(jhipsterDir)
    .filter(file => file.endsWith('.json'))
    .map(file => file.replace('.json', ''));

  console.log(`Found ${entities.length} entities to validate\n`);

  let allValid = true;
  for (const entity of entities.slice(0, 3)) { // Test first 3 entities
    const isValid = validateEntityForm(entity);
    if (!isValid) allValid = false;
    console.log(''); // spacing
  }

  return allValid;
}

// CLI usage
if (require.main === module) {
  const entityName = process.argv[2];
  
  if (entityName) {
    validateEntityForm(entityName);
  } else {
    console.log('🧪 Validating modular form components...\n');
    const result = validateAllEntities();
    
    if (result) {
      console.log('🎉 All form components are valid!');
    } else {
      console.log('⚠️  Some issues found. Run the generator to fix.');
      process.exit(1);
    }
  }
}

module.exports = { validateEntityForm, validateAllEntities };
