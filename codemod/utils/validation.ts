import fs from 'fs-extra';
import path from 'path';
import { JHipsterEntity, JHipsterField, JHipsterRelationship, ValidationResult } from './types';
import { CodemodError, ErrorCode } from './errors';

/**
 * Validates a JHipster entity schema
 */
export function validateEntity(entityPath: string): ValidationResult {
  const entityName = path.basename(entityPath, '.json');

  // Check if file exists
  if (!fs.existsSync(entityPath)) {
    throw new CodemodError(
      `Entity file not found: ${entityPath}`,
      ErrorCode.ENTITY_NOT_FOUND,
      entityName
    );
  }

  // Try parsing the JSON
  let entity: JHipsterEntity;
  try {
    const content = fs.readFileSync(entityPath, 'utf8');
    entity = JSON.parse(content) as JHipsterEntity;
  } catch (e) {
    throw new CodemodError(
      `Invalid JSON: ${(e as Error).message}`,
      ErrorCode.ENTITY_INVALID,
      entityName
    );
  }

  // Required fields
  if (!entity.name) {
    throw new CodemodError(
      'Entity name is required',
      ErrorCode.ENTITY_INVALID,
      entityName
    );
  }
  if (!Array.isArray(entity.fields)) {
    throw new CodemodError(
      'Entity fields must be an array',
      ErrorCode.ENTITY_INVALID,
      entityName
    );
  }

  let needsUpdate = false;

  // Field validation
  entity.fields?.forEach((field: JHipsterField, index: number) => {
    if (!field.fieldName) {
      throw new CodemodError(
        `Field #${index + 1} is missing fieldName`,
        ErrorCode.ENTITY_FIELD_INVALID,
        entityName
      );
    }
    if (!field.fieldType) {
      throw new CodemodError(
        `Field "${field.fieldName}" is missing fieldType`,
        ErrorCode.ENTITY_FIELD_INVALID,
        entityName
      );
    }
    // Auto-mark fields with values as enums
    if (field.fieldValues?.trim() && !field.fieldIsEnum) {
      field.fieldIsEnum = true;
      needsUpdate = true;
    }
  });

  // Save changes if needed
  if (needsUpdate) {
    fs.writeFileSync(entityPath, JSON.stringify(entity, null, 2));
  }

  // Relationship validation
  entity.relationships?.forEach((rel: JHipsterRelationship, index: number) => {
    if (!rel.relationshipName) {
      throw new CodemodError(
        `Relationship #${index + 1} is missing name`,
        ErrorCode.ENTITY_RELATIONSHIP_INVALID,
        entityName
      );
    }
    if (!rel.otherEntityName) {
      throw new CodemodError(
        `Relationship "${rel.relationshipName}" is missing target entity`,
        ErrorCode.ENTITY_RELATIONSHIP_INVALID,
        entityName
      );
    }
    if (!rel.relationshipType) {
      throw new CodemodError(
        `Relationship "${rel.relationshipName}" is missing type`,
        ErrorCode.ENTITY_RELATIONSHIP_INVALID,
        entityName
      );
    }
    if (!['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many'].includes(rel.relationshipType)) {
      throw new CodemodError(
        `Relationship "${rel.relationshipName}" has invalid type: ${rel.relationshipType}`,
        ErrorCode.ENTITY_RELATIONSHIP_INVALID,
        entityName
      );
    }
  });

  return {
    isValid: true,
    errors: []
  };
}

/**
 * Validates template files exist and have valid syntax
 */
export function validateTemplates(tplDir: string): ValidationResult {
  const requiredTemplates = [
    'entity-form.tsx.tpl',
    'entity-table.tsx.tpl',
    'entity-metadata.ts.tpl'
  ];

  // Check if template directory exists
  if (!fs.existsSync(tplDir)) {
    throw new CodemodError(
      `Template directory not found: ${tplDir}`,
      ErrorCode.TEMPLATE_NOT_FOUND
    );
  }

  // Check required templates exist and validate syntax
  for (const tpl of requiredTemplates) {
    const tplPath = path.join(tplDir, tpl);
    if (!fs.existsSync(tplPath)) {
      throw new CodemodError(
        `Required template missing: ${tpl}`,
        ErrorCode.TEMPLATE_NOT_FOUND
      );
    }

    // Basic mustache syntax validation
    try {
      const content = fs.readFileSync(tplPath, 'utf8');
      const openCount = (content.match(/\[\[/g) || []).length;
      const closeCount = (content.match(/\]\]/g) || []).length;
      if (openCount !== closeCount) {
        throw new CodemodError(
          `Template "${tpl}" has mismatched mustache tags: ${openCount} open vs ${closeCount} close`,
          ErrorCode.TEMPLATE_INVALID
        );
      }
    } catch (e) {
      throw new CodemodError(
        `Error reading template "${tpl}": ${(e as Error).message}`,
        ErrorCode.TEMPLATE_INVALID
      );
    }
  }

  return {
    isValid: true,
    errors: []
  };
}

/**
 * Validates output directory is writable
 */
export function validateOutputDir(outDir: string, force: boolean): ValidationResult {
  try {
    // Check if directory exists
    if (fs.existsSync(outDir)) {
      if (!force) {
        throw new CodemodError(
          `Output directory exists and --force not specified: ${outDir}`,
          ErrorCode.OUTPUT_DIR_ERROR
        );
      }
    } else {
      // Try to create directory
      fs.ensureDirSync(outDir);
      fs.rmdirSync(outDir); // Clean up test directory
    }
  } catch (e) {
    if (e instanceof CodemodError) {
      throw e;
    }
    throw new CodemodError(
      `Cannot write to output directory: ${(e as Error).message}`,
      ErrorCode.OUTPUT_DIR_ERROR
    );
  }

  return {
    isValid: true,
    errors: []
  };
}
