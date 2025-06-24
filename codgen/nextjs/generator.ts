import * as fs from 'fs';
import * as path from 'path';
import {
  TemplateVariablePreparer,
  EntityDefinition,
  TemplateVariables,
} from './lib/template-variable-preparer';
import { FileGenerator } from './lib/file-generator';
import { SharedComponentGenerator } from './lib/shared-component-generator';
import { EntityComponentGenerator } from './lib/entity-component-generator';

/**
 * Generator for Next.js components based on JHipster entity definitions
 */
export class NextJsGenerator {
  private readonly fileGenerator: FileGenerator;
  private readonly sharedGenerator: SharedComponentGenerator;
  private readonly entityGenerator: EntityComponentGenerator;
  constructor(
    private readonly projectRoot: string,
    private readonly jhipsterDir: string,
    private readonly templateDir: string,
    private readonly outputDir: string
  ) {
    this.fileGenerator = new FileGenerator(templateDir, outputDir);
    this.sharedGenerator = new SharedComponentGenerator(templateDir, outputDir);
    this.entityGenerator = new EntityComponentGenerator(this.fileGenerator, outputDir);
  }

  /**
   * Generate shared components that are used across all entities
   */
  public async generateSharedComponents(): Promise<void> {
    await this.sharedGenerator.generateSharedComponents();
  }

  /**
   * Generate CRUD components for all entities
   */
  public async generateAll(): Promise<void> {
    // Generate shared components first
    await this.generateSharedComponents();

    const entityFiles = fs.readdirSync(this.jhipsterDir).filter((file) => file.endsWith('.json'));

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

    const entityDefinition: EntityDefinition = JSON.parse(
      fs.readFileSync(entityDefinitionPath, 'utf8')
    );

    // Prepare variables for templates
    const vars = TemplateVariablePreparer.prepareTemplateVariables(entityName, entityDefinition);

    // Generate entity components
    await this.entityGenerator.generateEntityComponents(entityName, vars);

    console.log(`Successfully generated components for ${entityName}`);
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

      const generator = new NextJsGenerator(projectRoot, jhipsterDir, templateDir, outputDir);

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
