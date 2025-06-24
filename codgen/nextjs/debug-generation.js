const path = require('path');
const fs = require('fs');

// Import the generators
const { NextJsGenerator } = require('./generator.ts');

async function debugGeneration() {
  console.log('🔍 Debugging UserAvailability generation...\n');

  try {
    const projectRoot = 'D:\\code\\CRMCup\\CRM_Frontend';
    const jhipsterDir = path.join(projectRoot, '.jhipster');
    const templateDir = path.join(projectRoot, 'codgen', 'nextjs', 'templates');
    const outputDir = path.join(projectRoot, 'src');

    const generator = new NextJsGenerator(projectRoot, jhipsterDir, templateDir, outputDir);

    console.log('📂 Template directory contents:');
    const formTemplatesPath = path.join(templateDir, 'entity', 'components', 'form');
    if (fs.existsSync(formTemplatesPath)) {
      console.log('✅ Form templates directory exists');
      const formTemplates = fs.readdirSync(formTemplatesPath, { recursive: true });
      formTemplates.forEach((file) => console.log(`   - ${file}`));
    } else {
      console.log('❌ Form templates directory missing');
    }

    console.log('\n🎯 Generating UserAvailability...');
    await generator.generateEntity('UserAvailability');

    console.log('\n📋 Generated files:');
    const entityDir = path.join(
      outputDir,
      'app',
      '(protected)/(features)',
      'user-availabilities',
      'components',
      'form'
    );
    if (fs.existsSync(entityDir)) {
      const generatedFiles = fs.readdirSync(entityDir, { recursive: true });
      generatedFiles.forEach((file) => console.log(`   ✅ ${file}`));

      // Check specifically for schema file
      const schemaFile = path.join(entityDir, 'user-availability-form-schema.ts');
      if (fs.existsSync(schemaFile)) {
        console.log('\n✅ Schema file exists');
      } else {
        console.log('\n❌ Schema file missing');
      }
    } else {
      console.log('❌ Form directory not found');
    }
  } catch (error) {
    console.error('❌ Error during generation:', error);
  }
}

debugGeneration();
