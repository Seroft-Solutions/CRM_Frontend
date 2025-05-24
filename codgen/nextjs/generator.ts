import * as fs from 'fs';
import * as path from 'path';
import * as ejs from 'ejs';
import { plural } from 'pluralize';

interface TemplateVariables {
  entityName: string;
  entityFileName: string;
  entityClass: string;
  entityClassPlural: string;
  entityClassHumanized: string;
  entityClassPluralHumanized: string;
  entityInstance: string;
  entityRoute: string;
  routePath: string;
  primaryKey: { name: string; type: string };
  fields: Field[];
  relationships: ProcessedRelationship[];
  persistableRelationships: ProcessedRelationship[];
  otherEntitiesWithPersistableRelationship: ProcessedRelationship['otherEntity'][];
  searchEngineAny?: boolean;
  anyFieldIsDateDerived: boolean;
  anyFieldIsBlobDerived: boolean;
  readOnly: boolean;
  pagination: string;
  service: string;
  dto: string;
}

interface Field {
  fieldName: string;
  fieldType: string;
  fieldTypeBinary?: boolean;
  fieldTypeTimed?: boolean;
  fieldTypeLocalDate?: boolean;
  fieldTypeZonedDateTime?: boolean;
  fieldTypeInstant?: boolean;
  fieldTypeBoolean?: boolean;
  fieldTypeNumeric?: boolean;
  fieldIsEnum?: boolean;
  enumValues?: Array<{ name: string }>;
  fieldValidateRules?: string[];
  fieldValidateRulesMin?: number;
  fieldValidateRulesMax?: number;
  fieldValidateRulesMinlength?: number;
  fieldValidateRulesMaxlength?: number;
  fieldValidateRulesPattern?: string;
}

interface EntityDefinition {
  fields: Field[];
  relationships?: Relationship[];
  searchEngine?: boolean;
  readOnly?: boolean;
  pagination?: string;
  service?: string;
  dto?: string;
}

interface Relationship {
  otherEntityName: string;
  relationshipName: string;
  relationshipType: string;
  otherEntityField?: string;
  relationshipRequired?: boolean;
  relationshipWithBuiltInEntity?: boolean;
}

interface ProcessedRelationship extends Relationship {
  relationshipFieldName: string;
  relationshipFieldNamePlural: string;
  relationshipNameHumanized: string;
  collection: boolean;
  otherEntity: {
    entityName: string;
    entityClass: string;
    entityClassPlural: string;
    entityInstance: string;
    entityInstancePlural: string;
    entityFileName: string;
    entityNamePlural: string;
    primaryKey: { name: string };
    builtInUser: boolean;
  };
}

/**
 * Generator for Next.js components based on JHipster entity definitions
 */
export class NextJsGenerator {
  constructor(
    private readonly projectRoot: string,
    private readonly jhipsterDir: string,
    private readonly templateDir: string,
    private readonly outputDir: string
  ) {}

  /**
   * Generate CRUD components for all entities
   */
  public async generateAll(): Promise<void> {
    const entityFiles = fs.readdirSync(this.jhipsterDir).filter(file => file.endsWith('.json'));
    
    console.log(`Found ${entityFiles.length} entity definitions in ${this.jhipsterDir}`);
    
    for (const entityFile of entityFiles) {
      const entityName = entityFile.replace('.json', '');
      await this.generateEntity(entityName);
    }
  }

  /**
   * Generate CRUD components for a specific entity
   */
  public async generateEntity(entityName: string): Promise<void> {
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
    
    // Generate main table component
    await this.generateFile('entity/components/entity-table.tsx.ejs', 
      path.join(entityDir, 'components', `${vars.entityFileName}-table.tsx`), vars);
    
    // Generate split table components
    await this.generateFile('entity/components/table/entity-search-filters.tsx.ejs', 
      path.join(entityDir, 'components', `${vars.entityFileName}-search-filters.tsx`), vars);
    await this.generateFile('entity/components/table/entity-table-header.tsx.ejs', 
      path.join(entityDir, 'components', `${vars.entityFileName}-table-header.tsx`), vars);
    await this.generateFile('entity/components/table/entity-table-row.tsx.ejs', 
      path.join(entityDir, 'components', `${vars.entityFileName}-table-row.tsx`), vars);
    
    // Generate other components
    await this.generateFile('entity/components/entity-form.tsx.ejs', 
      path.join(entityDir, 'components', `${vars.entityFileName}-form.tsx`), vars);
    await this.generateFile('entity/components/entity-details.tsx.ejs', 
      path.join(entityDir, 'components', `${vars.entityFileName}-details.tsx`), vars);
    
    console.log(`Successfully generated components for ${entityName}`);
  }

  /**
   * Prepare variables for EJS templates
   */
  private prepareTemplateVariables(entityName: string, entityDefinition: EntityDefinition): TemplateVariables {
    const entityFileName = this.camelToKebab(entityName);
    const entityClass = entityName;
    const entityClassPlural = plural(entityName);
    const entityInstance = this.lowerFirstCamelCase(entityName);
    const pluralizedRoute = plural(entityFileName);

    // Process relationships to add computed properties
    const processedRelationships = this.processRelationships(entityDefinition.relationships || []);
    const persistableRelationships = processedRelationships.filter((r) => r.relationshipType !== 'one-to-many');
    
    // Get unique other entities for API imports
    const otherEntitiesWithPersistableRelationship = this.getUniqueOtherEntities(persistableRelationships);

    return {
      entityName,
      entityFileName,
      entityClass,
      entityClassPlural,
      entityClassHumanized: this.humanize(entityClass),
      entityClassPluralHumanized: this.humanize(entityClassPlural),
      entityInstance: this.lowerFirstCamelCase(entityInstance),
      entityRoute: pluralizedRoute,
      routePath: pluralizedRoute,
      primaryKey: { name: 'id', type: 'number' },
      fields: entityDefinition.fields,
      relationships: processedRelationships,
      persistableRelationships,
      otherEntitiesWithPersistableRelationship,
      searchEngineAny: entityDefinition.searchEngine,
      anyFieldIsDateDerived: entityDefinition.fields.some((f) => 
        f.fieldTypeTimed || f.fieldTypeLocalDate || f.fieldTypeZonedDateTime || f.fieldTypeInstant),
      anyFieldIsBlobDerived: entityDefinition.fields.some((f) => f.fieldTypeBinary),
      readOnly: entityDefinition.readOnly || false,
      pagination: entityDefinition.pagination || 'no',
      service: entityDefinition.service || 'no',
      dto: entityDefinition.dto || 'no',
    };
  }

  /**
   * Generate a file from a template
   */
  private async generateFile(templatePath: string, outputPath: string, variables: TemplateVariables): Promise<void> {
    const fullTemplatePath = path.join(this.templateDir, templatePath);
    
    if (!fs.existsSync(fullTemplatePath)) {
      console.error(`Template file not found: ${fullTemplatePath}`);
      return;
    }
    
    const template = fs.readFileSync(fullTemplatePath, 'utf8');
    
    try {
      const output = ejs.render(template, variables, {
        escape: (str: string) => str, // Don't escape output
      });
      
      fs.writeFileSync(outputPath, output);
      console.log(`Generated: ${outputPath}`);
    } catch (error) {
      console.error(`Error generating file ${outputPath}:`, error);
    }
  }

  /**
   * Create directory if it doesn't exist
   */
  private ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Process relationships to add computed properties
   */
  private processRelationships(relationships: Relationship[]): ProcessedRelationship[] {
    return relationships.map(rel => {
      const otherEntityName = rel.otherEntityName;
      const otherEntityClass = this.upperFirstCamelCase(otherEntityName);
      const otherEntityClassPlural = plural(otherEntityClass);
      const otherEntityInstance = this.lowerFirstCamelCase(otherEntityName);
      const otherEntityInstancePlural = plural(otherEntityInstance);
      const otherEntityFileName = this.camelToKebab(otherEntityName);
      
      // Determine relationship field names
      const relationshipName = rel.relationshipName;
      const relationshipFieldName = relationshipName;
      const relationshipFieldNamePlural = plural(relationshipName);
      
      // Determine if this is a collection relationship
      const isCollection = rel.relationshipType === 'one-to-many' || rel.relationshipType === 'many-to-many';
      
      // Determine display field - use 'login' for built-in user entity, otherwise default to 'name'
      const otherEntityField = rel.otherEntityField || (rel.relationshipWithBuiltInEntity ? 'login' : 'name');
      
      // Determine if relationship is required
      const relationshipRequired = rel.relationshipRequired || false;
      
      // Determine if this is a built-in user entity
      const isBuiltInUser = rel.relationshipWithBuiltInEntity && otherEntityName === 'user';
      
      return {
        ...rel,
        // Original relationship properties
        otherEntityName,
        relationshipName,
        relationshipFieldName,
        relationshipFieldNamePlural,
        relationshipNameHumanized: this.humanize(relationshipName),
        relationshipRequired,
        collection: isCollection,
        otherEntityField,
        
        // Computed other entity properties
        otherEntity: {
          entityName: otherEntityName,
          entityClass: otherEntityClass,
          entityClassPlural: otherEntityClassPlural,
          entityInstance: otherEntityInstance,
          entityInstancePlural: otherEntityInstancePlural,
          entityFileName: otherEntityFileName,
          entityNamePlural: otherEntityInstancePlural,
          primaryKey: { name: 'id' }, // Default primary key
          builtInUser: Boolean(isBuiltInUser),
        }
      };
    });
  }

  /**
   * Get unique other entities for API imports
   */
  private getUniqueOtherEntities(relationships: ProcessedRelationship[]): ProcessedRelationship['otherEntity'][] {
    const entityMap = new Map();
    
    relationships.forEach(rel => {
      const otherEntity = rel.otherEntity;
      if (!entityMap.has(otherEntity.entityName)) {
        entityMap.set(otherEntity.entityName, otherEntity);
      }
    });
    
    return Array.from(entityMap.values());
  }

  /**
   * Convert camelCase to kebab-case
   */
  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * Convert first letter to uppercase
   */
  private upperFirstCamelCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Convert first letter to lowercase
   */
  private lowerFirstCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  /**
   * Convert camelCase or PascalCase to Human Case
   */
  private humanize(str: string): string {
    return str
      // Split camelCase
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      // uppercase first letter
      .replace(/^./, s => s.toUpperCase());
  }
}

// CLI script to generate components
if (require.main === module) {
  (async () => {
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
  })();
}
