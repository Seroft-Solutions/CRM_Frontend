import * as fs from 'fs';
import * as path from 'path';
import * as ejs from 'ejs';
import { TemplateVariables } from './template-variable-preparer';

/**
 * Handles EJS template rendering and file generation
 */
export class FileGenerator {
  constructor(private readonly templateDir: string, private readonly outputDir: string) {}

  /**
   * Generate a file from a template
   */
  async generateFile(templatePath: string, outputPath: string, variables: TemplateVariables): Promise<void> {
    const fullTemplatePath = path.join(this.templateDir, templatePath);
    
    if (!fs.existsSync(fullTemplatePath)) {
      console.error(`Template file not found: ${fullTemplatePath}`);
      return;
    }
    
    const template = fs.readFileSync(fullTemplatePath, 'utf8');
    
    try {
      const output = ejs.render(template, variables, {
        escape: (str: string) => str, // Don't escape output
        filename: fullTemplatePath, // Enable includes
      });
      
      // Ensure output directory exists
      const outputDirPath = path.dirname(outputPath);
      this.ensureDir(outputDirPath);
      
      fs.writeFileSync(outputPath, output);
      console.log(`Generated: ${outputPath}`);
    } catch (error) {
      console.error(`Error generating file ${outputPath}:`, error);
    }
  }

  /**
   * Generate multiple files from templates
   */
  async generateFiles(templates: Array<{ templatePath: string; outputPath: string; variables: TemplateVariables }>): Promise<void> {
    for (const template of templates) {
      await this.generateFile(template.templatePath, template.outputPath, template.variables);
    }
  }

  /**
   * Create directory if it doesn't exist
   */
  ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
}
