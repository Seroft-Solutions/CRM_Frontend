import * as path from 'path';
import { FileGenerator } from './file-generator';
import { TemplateVariables } from './template-variable-preparer';

/**
 * Generates CRUD components for individual entities
 */
export class EntityComponentGenerator {
  constructor(
    private readonly fileGenerator: FileGenerator,
    private readonly outputDir: string
  ) {}

  /**
   * Generate CRUD components for a specific entity
   */
  async generateEntityComponents(entityName: string, vars: TemplateVariables): Promise<void> {
    console.log(`Generating components for entity: ${entityName}`);
    
    // Create directory structure
    const entityDir = path.join(this.outputDir, 'app', '(protected)', vars.routePath);
    this.createEntityDirectories(entityDir);
    
    // Generate all entity files
    const templates = this.buildTemplateList(entityDir, vars);
    await this.fileGenerator.generateFiles(templates);
    
    console.log(`Successfully generated components for ${entityName}`);
  }

  private createEntityDirectories(entityDir: string): void {
    const directories = [
      entityDir,
      path.join(entityDir, 'new'),
      path.join(entityDir, '[id]'),
      path.join(entityDir, '[id]', 'edit'),
      path.join(entityDir, 'components'),
      path.join(entityDir, 'actions')
    ];

    directories.forEach(dir => this.fileGenerator.ensureDir(dir));
  }

  private buildTemplateList(entityDir: string, vars: TemplateVariables) {
    return [
      // Main pages
      {
        templatePath: 'entity/page.tsx.ejs',
        outputPath: path.join(entityDir, 'page.tsx'),
        variables: vars
      },
      {
        templatePath: 'entity/layout.tsx.ejs',
        outputPath: path.join(entityDir, 'layout.tsx'),
        variables: vars
      },
      {
        templatePath: 'entity/new/page.tsx.ejs',
        outputPath: path.join(entityDir, 'new', 'page.tsx'),
        variables: vars
      },
      {
        templatePath: 'entity/[id]/page.tsx.ejs',
        outputPath: path.join(entityDir, '[id]', 'page.tsx'),
        variables: vars
      },
      {
        templatePath: 'entity/[id]/edit/page.tsx.ejs',
        outputPath: path.join(entityDir, '[id]', 'edit', 'page.tsx'),
        variables: vars
      },

      // Components
      {
        templatePath: 'entity/components/entity-toast.ts.ejs',
        outputPath: path.join(entityDir, 'components', `${vars.entityFileName}-toast.ts`),
        variables: vars
      },
      {
        templatePath: 'entity/components/entity-table.tsx.ejs',
        outputPath: path.join(entityDir, 'components', `${vars.entityFileName}-table.tsx`),
        variables: vars
      },
      {
        templatePath: 'entity/components/entity-form.tsx.ejs',
        outputPath: path.join(entityDir, 'components', `${vars.entityFileName}-form.tsx`),
        variables: vars
      },
      {
        templatePath: 'entity/components/entity-details.tsx.ejs',
        outputPath: path.join(entityDir, 'components', `${vars.entityFileName}-details.tsx`),
        variables: vars
      },

      // Table sub-components
      {
        templatePath: 'entity/components/table/entity-search-filters.tsx.ejs',
        outputPath: path.join(entityDir, 'components', `${vars.entityFileName}-search-filters.tsx`),
        variables: vars
      },
      {
        templatePath: 'entity/components/table/entity-table-header.tsx.ejs',
        outputPath: path.join(entityDir, 'components', `${vars.entityFileName}-table-header.tsx`),
        variables: vars
      },
      {
        templatePath: 'entity/components/table/entity-table-row.tsx.ejs',
        outputPath: path.join(entityDir, 'components', `${vars.entityFileName}-table-row.tsx`),
        variables: vars
      },

      // Relationship components
      {
        templatePath: 'entity/components/bulk-relationship-assignment.tsx.ejs',
        outputPath: path.join(entityDir, 'components', 'bulk-relationship-assignment.tsx'),
        variables: vars
      },
      {
        templatePath: 'entity/components/relationship-cell.tsx.ejs',
        outputPath: path.join(entityDir, 'components', 'relationship-cell.tsx'),
        variables: vars
      },

      // Actions
      {
        templatePath: 'entity/actions/entity-actions.ts.ejs',
        outputPath: path.join(entityDir, 'actions', `${vars.entityFileName}-actions.ts`),
        variables: vars
      }
    ];
  }
}
