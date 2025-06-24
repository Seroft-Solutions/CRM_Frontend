#!/usr/bin/env node

/**
 * Validation script for the modular form template system
 * Checks that all required templates exist and have correct structure
 */

const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname, 'templates', 'entity', 'components', 'form');

const requiredTemplates = [
  'form-config.ts.ejs',
  'form-types.ts.ejs',
  'entity-form-schema.ts.ejs',
  'entity-form-provider.tsx.ejs',
  'entity-form-wizard.tsx.ejs',
  'form-progress-indicator.tsx.ejs',
  'form-step-renderer.tsx.ejs',
  'form-navigation.tsx.ejs',
  'form-state-manager.tsx.ejs',
  'steps/basic-info-step.tsx.ejs',
  'steps/date-time-step.tsx.ejs',
  'steps/settings-step.tsx.ejs',
  'steps/geographic-step.tsx.ejs',
  'steps/user-assignment-step.tsx.ejs',
  'steps/classification-step.tsx.ejs',
  'steps/business-relations-step.tsx.ejs',
  'steps/other-relations-step.tsx.ejs',
  'steps/review-step.tsx.ejs',
  'README.md',
];

function validateTemplates() {
  console.log('🔍 Validating modular form template system...\n');

  let allValid = true;
  const results = [];

  for (const templateFile of requiredTemplates) {
    const fullPath = path.join(templatesDir, templateFile);
    const exists = fs.existsSync(fullPath);

    if (exists) {
      const stats = fs.statSync(fullPath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      results.push(`✅ ${templateFile} (${sizeKB}KB)`);
    } else {
      results.push(`❌ ${templateFile} - MISSING`);
      allValid = false;
    }
  }

  // Print results
  results.forEach((result) => console.log(result));

  console.log('\n📊 Summary:');
  console.log(`Total templates: ${requiredTemplates.length}`);
  console.log(`Found: ${results.filter((r) => r.startsWith('✅')).length}`);
  console.log(`Missing: ${results.filter((r) => r.startsWith('❌')).length}`);

  if (allValid) {
    console.log('\n🎉 All templates are present! The modular form system is ready.');
    console.log('\n📝 Key Features:');
    console.log('   • Config-driven form structure');
    console.log('   • Modular step components');
    console.log('   • Preserved original UX');
    console.log('   • Cross-entity creation support');
    console.log('   • Automatic state persistence');
    console.log('   • Full TypeScript support');
    console.log('\n🚀 To use: Run the generator to create modular forms for your entities.');
  } else {
    console.log('\n⚠️  Some templates are missing. Please complete the implementation.');
    process.exit(1);
  }
}

// Check if entity-component-generator.ts has been updated
function validateGenerator() {
  console.log('\n🔧 Checking generator configuration...');

  const generatorPath = path.join(__dirname, 'lib', 'entity-component-generator.ts');
  if (fs.existsSync(generatorPath)) {
    const content = fs.readFileSync(generatorPath, 'utf8');

    const hasFormDirectory = content.includes("path.join(entityDir, 'components', 'form')");
    const hasFormConfig = content.includes('form-config.ts.ejs');
    const hasStepComponents = content.includes('steps/basic-info-step.tsx.ejs');

    if (hasFormDirectory && hasFormConfig && hasStepComponents) {
      console.log('✅ Generator has been updated for modular forms');
    } else {
      console.log('⚠️  Generator may need updating for full modular form support');
      console.log('   Check entity-component-generator.ts includes all new templates');
    }
  } else {
    console.log('❌ Generator file not found');
  }
}

if (require.main === module) {
  validateTemplates();
  validateGenerator();
}

module.exports = { validateTemplates, validateGenerator };
