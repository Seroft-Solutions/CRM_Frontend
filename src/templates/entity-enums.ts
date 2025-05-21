// Utility for generating TypeScript enums from JHipster entity JSON files

// Helper functions for enum generation
/**
 * Extracts enum values from a JHipster field definition
 * @param fieldValues String containing comma-separated enum values
 * @returns Array of enum values
 */
export function parseEnumValues(fieldValues: string): string[] {
  if (!fieldValues) return [];
  
  return fieldValues.split(',').map(value => value.trim());
}

/**
 * Generates a TypeScript enum declaration from a list of values
 * @param enumName The name for the enum
 * @param values Array of enum values
 * @returns TypeScript enum declaration as a string
 */
export function generateEnumDeclaration(enumName: string, values: string[]): string {
  if (!values.length) return '';
  
  const enumValues = values.map(value => `  ${value} = '${value}'`).join(',\n');
  
  return `export enum ${enumName} {\n${enumValues}\n}`;
}

/**
 * Generates a TypeScript const array of enum values
 * @param enumName The name for the const array
 * @param values Array of enum values
 * @returns TypeScript const array declaration as a string
 */
export function generateEnumValuesArray(enumName: string, values: string[]): string {
  if (!values.length) return '';
  
  const valuesList = values.map(value => `  '${value}'`).join(',\n');
  
  return `export const ${enumName}Values = [\n${valuesList}\n] as const;`;
}

/**
 * Generates a TypeScript type from enum values
 * @param typeName The name for the type
 * @param values Array of enum values
 * @returns TypeScript type declaration as a string
 */
export function generateEnumType(typeName: string, values: string[]): string {
  if (!values.length) return '';
  
  const valuesList = values.map(value => `  | '${value}'`).join('\n');
  
  return `export type ${typeName} =\n${valuesList};`;
}

/**
 * Extracts all enum fields from a JHipster entity
 * @param entity JHipster entity object
 * @returns Array of enum field definitions
 */
export function extractEnumFields(entity: any): Array<{ name: string, values: string[] }> {
  if (!entity || !entity.fields) return [];
  
  return entity.fields
    .filter((field: any) => field.fieldValues)
    .map((field: any) => ({
      name: field.fieldName,
      values: parseEnumValues(field.fieldValues)
    }));
}

/**
 * Generates TypeScript enum definitions for all enum fields in a JHipster entity
 * @param entity JHipster entity object
 * @returns Object containing generated TypeScript code
 */
export function generateEntityEnums(entity: any): { 
  enums: string,
  types: string,
  valueArrays: string 
} {
  const enumFields = extractEnumFields(entity);
  
  if (!enumFields.length) {
    return { enums: '', types: '', valueArrays: '' };
  }
  
  const enums = enumFields.map(field => {
    const enumName = field.name.charAt(0).toUpperCase() + field.name.slice(1);
    return generateEnumDeclaration(enumName, field.values);
  }).join('\n\n');
  
  const types = enumFields.map(field => {
    const typeName = field.name.charAt(0).toUpperCase() + field.name.slice(1) + 'Type';
    return generateEnumType(typeName, field.values);
  }).join('\n\n');
  
  const valueArrays = enumFields.map(field => {
    const enumName = field.name.charAt(0).toUpperCase() + field.name.slice(1);
    return generateEnumValuesArray(enumName, field.values);
  }).join('\n\n');
  
  return { enums, types, valueArrays };
}

/**
 * Generates a complete TypeScript file with enum definitions
 * @param entity JHipster entity object
 * @returns Complete TypeScript file content
 */
export function generateEnumsFile(entity: any): string {
  const { enums, types, valueArrays } = generateEntityEnums(entity);
  
  if (!enums && !types && !valueArrays) {
    return '// No enums defined for this entity';
  }
  
  return `/**
 * Generated enums for ${entity.name} entity
 * These enums are derived from the JHipster entity definition
 */

${enums}

${types}

${valueArrays}

export default {
  // Export enum values for use in forms and validation
  values: {
${extractEnumFields(entity).map(field => {
  const enumName = field.name.charAt(0).toUpperCase() + field.name.slice(1);
  return `    ${field.name}: ${enumName}Values`;
}).join(',\n')}
  }
};
`;
}

export default {
  parseEnumValues,
  generateEnumDeclaration,
  generateEnumValuesArray,
  generateEnumType,
  extractEnumFields,
  generateEntityEnums,
  generateEnumsFile
};
