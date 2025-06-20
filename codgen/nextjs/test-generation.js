#!/usr/bin/env node

/**
 * Test script to verify the modular form system works correctly
 * Generates forms for a specific entity and validates the output
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function testFormGeneration(entityName) {
  console.log(`🧪 Testing form generation for entity: ${entityName}\n`);

  try {
    // Check if entity definition exists
    const entityPath = path.join(__dirname, '..', '..', '.jhipster', `${entityName}.json`);
    if (!fs.existsSync(entityPath)) {
      console.log(`❌ Entity definition not found: ${entityPath}`);
      console.log('Available entities:');
      const jhipsterDir = path.dirname(entityPath);
      if (fs.existsSync(jhipsterDir)) {
        const entities = fs.readdirSync(jhipsterDir)
          .filter(file => file.endsWith('.json'))
          .map(file => file.replace('.json', ''));
        entities.forEach(entity => console.log(`   - ${entity}`));
      }
      return false;
    }

    console.log(`✅ Found entity definition: ${entityName}`);

    // Generate the entity
    console.log('🔄 Generating components...');
    const command = `node ${__dirname}/generator.js ${entityName}`;
    execSync(command, { stdio: 'inherit' });

    // Validate generated files
    console.log('\n🔍 Validating generated files...');
    const outputDir = path.join(__dirname, '..', '..', 'src', 'app', '(protected)');
    const entityRoute = entityName.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '');
    const entityDir = path.join(outputDir, entityRoute);

    const expectedFiles = [
      'components/form/form-config.ts',
      'components/form/form-types.ts',
      'components/form/entity-form-schema.ts',
      'components/form/entity-form-provider.tsx',
      'components/form/entity-form-wizard.tsx',
      'components/form/steps/basic-info-step.tsx',
      'components/form/steps/review-step.tsx'
    ];

    let allGenerated = true;
    for (const file of expectedFiles) {
      const fullPath = path.join(entityDir, file);
      if (fs.existsSync(fullPath)) {
        console.log(`✅ Generated: ${file}`);
      } else {
        console.log(`❌ Missing: ${file}`);
        allGenerated = false;
      }
    }

    if (allGenerated) {
      console.log('\n🎉 Form generation successful!');
      console.log('\n📝 Next steps:');
      console.log('1. Review the generated form configuration');
      console.log('2. Customize steps/fields as needed');
      console.log('3. Test the form in your application');
      console.log(`4. Check: src/app/(protected)/${entityRoute}/components/form/`);
      return true;
    } else {
      console.log('\n⚠️  Some files were not generated correctly');
      return false;
    }

  } catch (error) {
    console.error('❌ Generation failed:', error.message);
    return false;
  }
}

function showUsage() {
  console.log('🔧 Modular Form System - Test Generator\n');
  console.log('Usage: npm run test-forms [EntityName]');
  console.log('   or: node test-generation.js [EntityName]\n');
  console.log('Example: node test-generation.js Call\n');
  console.log('This will generate a modular form for the Call entity and validate the output.');
}

if (require.main === module) {
  const entityName = process.argv[2];
  
  if (!entityName) {
    showUsage();
    process.exit(1);
  }

  const success = testFormGeneration(entityName);
  process.exit(success ? 0 : 1);
}

module.exports = { testFormGeneration };
