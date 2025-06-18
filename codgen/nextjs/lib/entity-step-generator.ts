import * as path from 'path';
import { FileGenerator } from './file-generator';
import { TemplateVariables } from './template-variable-preparer';

/**
 * Generates entity-specific form step templates
 */
export class EntityStepGenerator {
  constructor(private readonly fileGenerator: FileGenerator) {}

  /**
   * Generate entity-specific form step templates
   */
  async generateEntitySteps(entityName: string, vars: TemplateVariables, outputDir: string): Promise<void> {
    const stepsDir = path.join(outputDir, 'components', 'steps');
    this.fileGenerator.ensureDir(stepsDir);

    // Generate ALL step templates
    const stepTemplates = [
      {
        templatePath: 'entity/components/form/steps/entity-step-basic.tsx.ejs',
        outputPath: path.join(stepsDir, `${vars.entityFileName}-step-basic.tsx`),
        variables: vars
      },
      {
        templatePath: 'entity/components/form/steps/entity-step-dates.tsx.ejs',
        outputPath: path.join(stepsDir, `${vars.entityFileName}-step-dates.tsx`),
        variables: vars
      },
      {
        templatePath: 'entity/components/form/steps/entity-step-settings.tsx.ejs',
        outputPath: path.join(stepsDir, `${vars.entityFileName}-step-settings.tsx`),
        variables: vars
      },
      {
        templatePath: 'entity/components/form/steps/entity-step-geographic.tsx.ejs',
        outputPath: path.join(stepsDir, `${vars.entityFileName}-step-geographic.tsx`),
        variables: vars
      },
      {
        templatePath: 'entity/components/form/steps/entity-step-users.tsx.ejs',
        outputPath: path.join(stepsDir, `${vars.entityFileName}-step-users.tsx`),
        variables: vars
      },
      {
        templatePath: 'entity/components/form/steps/entity-step-classification.tsx.ejs',
        outputPath: path.join(stepsDir, `${vars.entityFileName}-step-classification.tsx`),
        variables: vars
      },
      {
        templatePath: 'entity/components/form/steps/entity-step-relationships.tsx.ejs',
        outputPath: path.join(stepsDir, `${vars.entityFileName}-step-relationships.tsx`),
        variables: vars
      },
      {
        templatePath: 'entity/components/form/steps/entity-step-review.tsx.ejs',
        outputPath: path.join(stepsDir, `${vars.entityFileName}-step-review.tsx`),
        variables: vars
      }
    ];

    await this.fileGenerator.generateFiles(stepTemplates);
    console.log(`Generated all form steps for ${entityName}`);
  }
}
