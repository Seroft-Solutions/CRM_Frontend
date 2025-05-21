const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const pluralize = require('pluralize'); // Use the established pluralize library

/**
 * Delete directories that might have been created with incorrect names
 */
function cleanupIncorrectDirectories(outputDir) {
  const protectedDir = path.join(outputDir, 'app', '(protected)');
  if (!fs.existsSync(protectedDir)) return;

  const dirs = fs.readdirSync(protectedDir);
  
  // Common incorrect plurals to look for
  const problematicDirs = [
    'call-categorys',
    'call-statuss',
    'citys',
    'partys',
    'prioritys'
  ];
  
  for (const dir of dirs) {
    if (problematicDirs.includes(dir)) {
      const dirToRemove = path.join(protectedDir, dir);
      console.log(`Removing incorrectly named directory: ${dirToRemove}`);
      try {
        fs.rmSync(dirToRemove, { recursive: true, force: true });
      } catch (error) {
        console.error(`Error removing directory ${dirToRemove}:`, error);
      }
    }
  }
}

class NextJsGenerator {
  constructor(projectRoot, jhipsterDir, templateDir, outputDir) {
    this.projectRoot = projectRoot;
    this.jhipsterDir = jhipsterDir;
    this.templateDir = templateDir;
    this.outputDir = outputDir;
  }

  async generateAll() {
    const entityFiles = fs.readdirSync(this.jhipsterDir).filter(file => file.endsWith('.json'));
    
    console.log(`Found ${entityFiles.length} entity definitions in ${this.jhipsterDir}`);
    
    // Clean up incorrectly named directories first
    cleanupIncorrectDirectories(this.outputDir);
    
    for (const entityFile of entityFiles) {
      const entityName = entityFile.replace('.json', '');
      await this.generateEntity(entityName);
    }
  }

  async generateEntity(entityName) {
    console.log(`Generating components for entity: ${entityName}`);
    
    // Read entity definition
    const entityDefinitionPath = path.join(this.jhipsterDir, `${entityName}.json`);
    console.log(`Reading entity definition from: ${entityDefinitionPath}`);
    
    const entityDefinition = JSON.parse(fs.readFileSync(entityDefinitionPath, 'utf8'));
    
    // Prepare variables for templates
    const vars = this.prepareTemplateVariables(entityName, entityDefinition);
    
    // Generate directory structure for entity
    const entityDir = path.join(this.outputDir, 'app', '(protected)', vars.routePath);
    console.log(`Creating directories at: ${entityDir}`);
    
    this.ensureDir(entityDir);
    this.ensureDir(path.join(entityDir, 'new'));
    this.ensureDir(path.join(entityDir, '[id]'));
    this.ensureDir(path.join(entityDir, '[id]', 'edit'));
    this.ensureDir(path.join(entityDir, 'components'));
    
    // Generate files from templates
    console.log(`Generating component files...`);
    
    await this.generateFile('entity/page.tsx.ejs', path.join(entityDir, 'page.tsx'), vars);
    await this.generateFile('entity/new/page.tsx.ejs', path.join(entityDir, 'new', 'page.tsx'), vars);
    await this.generateFile('entity/[id]/page.tsx.ejs', path.join(entityDir, '[id]', 'page.tsx'), vars);
    await this.generateFile('entity/[id]/edit/page.tsx.ejs', path.join(entityDir, '[id]', 'edit', 'page.tsx'), vars);
    
    await this.generateFile('entity/components/entity-table.tsx.ejs', 
      path.join(entityDir, 'components', `${vars.entityFileName}-table.tsx`), vars);
    await this.generateFile('entity/components/entity-form.tsx.ejs', 
      path.join(entityDir, 'components', `${vars.entityFileName}-form.tsx`), vars);
    await this.generateFile('entity/components/entity-details.tsx.ejs', 
      path.join(entityDir, 'components', `${vars.entityFileName}-details.tsx`), vars);
    
    console.log(`Successfully generated components for ${entityName}`);
  }

  prepareTemplateVariables(entityName, entityDefinition) {
    const entityFileName = this.camelToKebab(entityName);
    const entityClass = entityName;
    const entityInstance = this.lowerFirstCamelCase(entityName);

    // Use the proper pluralization library
    const entityClassPlural = pluralize(entityClass); // For code variables, properly pluralized
    const entityClassPluralHumanized = pluralize(this.humanize(entityClass)); // For display text, properly pluralized
    
    // For URLs and directory paths, use the pluralize library on the kebab-case name
    const routePath = pluralize(entityFileName);

    return {
      entityName,
      entityFileName,
      entityClass,
      entityClassPlural,
      entityClassHumanized: this.humanize(entityClass),
      entityClassPluralHumanized: entityClassPluralHumanized,
      entityInstance: entityInstance,
      entityRoute: routePath, // Use the pluralized route path for links
      routePath, // This is the properly pluralized path for directories
      primaryKey: { name: 'id', type: 'number' },
      fields: entityDefinition.fields,
      relationships: entityDefinition.relationships || [],
      searchEngineAny: entityDefinition.searchEngine,
      anyFieldIsDateDerived: entityDefinition.fields.some(f => 
        f.fieldTypeTimed || f.fieldTypeLocalDate || f.fieldTypeZonedDateTime || f.fieldTypeInstant),
      anyFieldIsBlobDerived: entityDefinition.fields.some(f => f.fieldTypeBinary),
      persistableRelationships: (entityDefinition.relationships || [])
        .filter(r => r.relationshipType !== 'one-to-many'),
      readOnly: entityDefinition.readOnly || false,
      pagination: entityDefinition.pagination || 'no',
      service: entityDefinition.service || 'no',
      dto: entityDefinition.dto || 'no',
    };
  }

  async generateFile(templatePath, outputPath, variables) {
    const fullTemplatePath = path.join(this.templateDir, templatePath);
    
    if (!fs.existsSync(fullTemplatePath)) {
      console.error(`Template file not found: ${fullTemplatePath}`);
      return;
    }
    
    const template = fs.readFileSync(fullTemplatePath, 'utf8');
    
    try {
      const output = ejs.render(template, variables, {
        escape: str => str, // Don't escape output
      });
      
      fs.writeFileSync(outputPath, output);
      console.log(`Generated: ${outputPath}`);
    } catch (error) {
      console.error(`Error generating file ${outputPath}:`, error);
    }
  }

  ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  camelToKebab(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  upperFirstCamelCase(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  lowerFirstCamelCase(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  humanize(str) {
    return str
      // Split camelCase
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      // uppercase first letter
      .replace(/^./, s => s.toUpperCase());
  }
}

// Main function
async function main() {
  try {
    // FIXED ABSOLUTE PATHS
    const projectRoot = 'D:\\code\\CRMCup\\CRM_Frontend';
    const jhipsterDir = path.join(projectRoot, '.jhipster');
    const templateDir = path.join(projectRoot, 'codgen', 'nextjs', 'templates');
    const outputDir = path.join(projectRoot, 'src');
    
    console.log('Using paths:');
    console.log('- Project root:', projectRoot);
    console.log('- JHipster directory:', jhipsterDir);
    console.log('- Template directory:', templateDir);
    console.log('- Output directory:', outputDir);
    
    const generator = new NextJsGenerator(
      projectRoot,
      jhipsterDir,
      templateDir,
      outputDir
    );
    
    const entityName = process.argv[2];
    if (entityName) {
      await generator.generateEntity(entityName);
    } else {
      await generator.generateAll();
    }
  } catch (error) {
    console.error('Error generating components:', error);
    process.exit(1);
  }
}

// Run the main function
main();
