import * as fs from 'fs';
import * as path from 'path';

/**
 * Generates shared components used across all entities
 */
export class SharedComponentGenerator {
  constructor(
    private readonly templateDir: string,
    private readonly outputDir: string
  ) {}

  /**
   * Generate shared components that are used across all entities
   */
  async generateSharedComponents(): Promise<void> {
    console.log('Generating shared components...');
    
    // Create components directory structure
    const componentsDir = path.join(this.outputDir, 'components');
    const authDir = path.join(componentsDir, 'auth');
    
    this.ensureDir(componentsDir);
    this.ensureDir(authDir);
    
    const components = [
      {
        template: path.join(this.templateDir, 'components', 'toaster-provider.tsx.ejs'),
        output: path.join(componentsDir, 'toaster-provider.tsx'),
        name: 'ToasterProvider'
      },
      {
        template: path.join(this.templateDir, 'components', 'auth', 'permission-guard.tsx'),
        output: path.join(authDir, 'permission-guard.tsx'),
        name: 'PermissionGuard'
      },
      {
        template: path.join(this.templateDir, 'components', 'auth', 'unauthorized-page.tsx'),
        output: path.join(authDir, 'unauthorized-page.tsx'),
        name: 'UnauthorizedPage'
      },
      {
        template: path.join(this.templateDir, 'components', 'context-aware-back-button.tsx'),
        output: path.join(componentsDir, 'context-aware-back-button.tsx'),
        name: 'ContextAwareBackButton'
      }
    ];

    for (const component of components) {
      await this.generateComponent(component.template, component.output, component.name);
    }
    
    console.log('Shared components generated successfully');
  }

  private async generateComponent(templatePath: string, outputPath: string, componentName: string): Promise<void> {
    if (fs.existsSync(templatePath)) {
      const template = fs.readFileSync(templatePath, 'utf8');
      fs.writeFileSync(outputPath, template);
      console.log(`Generated shared component: ${outputPath}`);
    } else {
      console.warn(`${componentName} template not found: ${templatePath}`);
    }
  }

  private ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}
