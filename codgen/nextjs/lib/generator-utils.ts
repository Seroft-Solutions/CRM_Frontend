/**
 * Utility functions for the Next.js generator
 */
export class GeneratorUtils {
  /**
   * Convert camelCase to kebab-case
   */
  static camelToKebab(str: string): string {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  }

  /**
   * Convert first letter to uppercase
   */
  static upperFirstCamelCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Convert first letter to lowercase
   */
  static lowerFirstCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  /**
   * Convert camelCase or PascalCase to Human Case
   */
  static humanize(str: string): string {
    return str
      // Split camelCase
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      // uppercase first letter
      .replace(/^./, s => s.toUpperCase());
  }
}
