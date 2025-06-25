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
    const entityDir = path.join(this.outputDir, 'app', '(protected)/(features)', vars.routePath);
    console.log(`Creating directories at: ${entityDir}`);
    this.createEntityDirectories(entityDir);

    // Generate all entity files
    const templates = this.buildTemplateList(entityDir, vars);
    console.log(`Generating component files...`);
    console.log(`Total templates: ${templates.length}`);
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
      path.join(entityDir, 'components', 'form'),
      path.join(entityDir, 'components', 'form', 'steps'),
      path.join(entityDir, 'components', 'table'),
      path.join(entityDir, 'actions'),
    ];

    directories.forEach((dir) => this.fileGenerator.ensureDir(dir));
  }

  private buildTemplateList(entityDir: string, vars: TemplateVariables) {
    return [
      // Main pages
      {
        templatePath: 'entity/page.tsx.ejs',
        outputPath: path.join(entityDir, 'page.tsx'),
        variables: vars,
      },
      {
        templatePath: 'entity/layout.tsx.ejs',
        outputPath: path.join(entityDir, 'layout.tsx'),
        variables: vars,
      },
      {
        templatePath: 'entity/new/page.tsx.ejs',
        outputPath: path.join(entityDir, 'new', 'page.tsx'),
        variables: vars,
      },
      {
        templatePath: 'entity/[id]/page.tsx.ejs',
        outputPath: path.join(entityDir, '[id]', 'page.tsx'),
        variables: vars,
      },
      {
        templatePath: 'entity/[id]/edit/page.tsx.ejs',
        outputPath: path.join(entityDir, '[id]', 'edit', 'page.tsx'),
        variables: vars,
      },

      // Components
      {
        templatePath: 'entity/components/entity-toast.ts.ejs',
        outputPath: path.join(entityDir, 'components', `${vars.entityFileName}-toast.ts`),
        variables: vars,
      },
      {
        templatePath: 'entity/components/entity-table.tsx.ejs',
        outputPath: path.join(entityDir, 'components', `${vars.entityFileName}-table.tsx`),
        variables: vars,
      },
      {
        templatePath: 'entity/components/entity-form.tsx.ejs',
        outputPath: path.join(entityDir, 'components', `${vars.entityFileName}-form.tsx`),
        variables: vars,
      },
      {
        templatePath: 'entity/components/entity-details.tsx.ejs',
        outputPath: path.join(entityDir, 'components', `${vars.entityFileName}-details.tsx`),
        variables: vars,
      },
      {
        templatePath: 'entity/components/form/paginated-relationship-combobox.tsx.ejs',
        outputPath: path.join(entityDir, 'components', 'form', 'paginated-relationship-combobox.tsx'),
        variables: vars,
      },

      // Modular Form Components - Configuration and Types
      {
        templatePath: 'entity/components/form/form-config.ts.ejs',
        outputPath: path.join(
          entityDir,
          'components',
          'form',
          `${vars.entityFileName}-form-config.ts`
        ),
        variables: vars,
      },
      {
        templatePath: 'entity/components/form/form-types.ts.ejs',
        outputPath: path.join(entityDir, 'components', 'form', 'form-types.ts'),
        variables: vars,
      },
      {
        templatePath: 'entity/components/form/entity-form-schema.ts.ejs',
        outputPath: path.join(
          entityDir,
          'components',
          'form',
          `${vars.entityFileName}-form-schema.ts`
        ),
        variables: vars,
      },

      // Modular Form Components - Core Infrastructure
      {
        templatePath: 'entity/components/form/entity-form-provider.tsx.ejs',
        outputPath: path.join(
          entityDir,
          'components',
          'form',
          `${vars.entityFileName}-form-provider.tsx`
        ),
        variables: vars,
      },
      {
        templatePath: 'entity/components/form/entity-form-wizard.tsx.ejs',
        outputPath: path.join(
          entityDir,
          'components',
          'form',
          `${vars.entityFileName}-form-wizard.tsx`
        ),
        variables: vars,
      },
      {
        templatePath: 'entity/components/form/form-progress-indicator.tsx.ejs',
        outputPath: path.join(entityDir, 'components', 'form', 'form-progress-indicator.tsx'),
        variables: vars,
      },
      {
        templatePath: 'entity/components/form/form-step-renderer.tsx.ejs',
        outputPath: path.join(entityDir, 'components', 'form', 'form-step-renderer.tsx'),
        variables: vars,
      },
      {
        templatePath: 'entity/components/form/relationship-renderer.tsx.ejs',
        outputPath: path.join(entityDir, 'components', 'form', 'relationship-renderer.tsx'),
        variables: vars,
      },
      {
        templatePath: 'entity/components/form/form-navigation.tsx.ejs',
        outputPath: path.join(entityDir, 'components', 'form', 'form-navigation.tsx'),
        variables: vars,
      },
      {
        templatePath: 'entity/components/form/form-state-manager.tsx.ejs',
        outputPath: path.join(entityDir, 'components', 'form', 'form-state-manager.tsx'),
        variables: vars,
      },

      // Modular Form Components - Step Components
      {
        templatePath: 'entity/components/form/steps/basic-info-step.tsx.ejs',
        outputPath: path.join(entityDir, 'components', 'form', 'steps', 'basic-info-step.tsx'),
        variables: vars,
      },
      {
        templatePath: 'entity/components/form/steps/date-time-step.tsx.ejs',
        outputPath: path.join(entityDir, 'components', 'form', 'steps', 'date-time-step.tsx'),
        variables: vars,
      },
      {
        templatePath: 'entity/components/form/steps/settings-step.tsx.ejs',
        outputPath: path.join(entityDir, 'components', 'form', 'steps', 'settings-step.tsx'),
        variables: vars,
      },
      {
        templatePath: 'entity/components/form/steps/geographic-step.tsx.ejs',
        outputPath: path.join(entityDir, 'components', 'form', 'steps', 'geographic-step.tsx'),
        variables: vars,
      },
      {
        templatePath: 'entity/components/form/steps/user-assignment-step.tsx.ejs',
        outputPath: path.join(entityDir, 'components', 'form', 'steps', 'user-assignment-step.tsx'),
        variables: vars,
      },
      {
        templatePath: 'entity/components/form/steps/classification-step.tsx.ejs',
        outputPath: path.join(entityDir, 'components', 'form', 'steps', 'classification-step.tsx'),
        variables: vars,
      },
      {
        templatePath: 'entity/components/form/steps/business-relations-step.tsx.ejs',
        outputPath: path.join(
          entityDir,
          'components',
          'form',
          'steps',
          'business-relations-step.tsx'
        ),
        variables: vars,
      },
      {
        templatePath: 'entity/components/form/steps/other-relations-step.tsx.ejs',
        outputPath: path.join(entityDir, 'components', 'form', 'steps', 'other-relations-step.tsx'),
        variables: vars,
      },
      {
        templatePath: 'entity/components/form/steps/review-step.tsx.ejs',
        outputPath: path.join(entityDir, 'components', 'form', 'steps', 'review-step.tsx'),
        variables: vars,
      },

      // Table sub-components
      {
        templatePath: 'entity/components/table/entity-search-filters.tsx.ejs',
        outputPath: path.join(entityDir, 'components', 'table', `${vars.entityFileName}-search-filters.tsx`),
        variables: vars,
      },
      {
        templatePath: 'entity/components/table/entity-table-header.tsx.ejs',
        outputPath: path.join(entityDir, 'components', 'table', `${vars.entityFileName}-table-header.tsx`),
        variables: vars,
      },
      {
        templatePath: 'entity/components/table/entity-table-row.tsx.ejs',
        outputPath: path.join(entityDir, 'components', 'table', `${vars.entityFileName}-table-row.tsx`),
        variables: vars,
      },
      {
        templatePath: 'entity/components/table/bulk-relationship-assignment.tsx.ejs',
        outputPath: path.join(entityDir, 'components', 'table', 'bulk-relationship-assignment.tsx'),
        variables: vars,
      },
      {
        templatePath: 'entity/components/table/relationship-cell.tsx.ejs',
        outputPath: path.join(entityDir, 'components', 'table', 'relationship-cell.tsx'),
        variables: vars,
      },

      // Actions
      {
        templatePath: 'entity/actions/entity-actions.ts.ejs',
        outputPath: path.join(entityDir, 'actions', `${vars.entityFileName}-actions.ts`),
        variables: vars,
      },
    ];
  }
}
