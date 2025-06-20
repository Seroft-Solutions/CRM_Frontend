import pluralize from 'pluralize';
import { GeneratorUtils } from './generator-utils';

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

interface Relationship {
  otherEntityName: string;
  relationshipName: string;
  relationshipType: string;
  otherEntityField?: string;
  relationshipRequired?: boolean;
  relationshipWithBuiltInEntity?: boolean;
  relationshipValidateRules?: string[];
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

interface EntityDefinition {
  fields: Field[];
  relationships?: Relationship[];
  searchEngine?: boolean;
  readOnly?: boolean;
  pagination?: string;
  service?: string;
  dto?: string;
}

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

/**
 * Handles preparation of template variables from entity definitions
 */
export class TemplateVariablePreparer {
  /**
   * Prepare variables for EJS templates
   */
  static prepareTemplateVariables(entityName: string, entityDefinition: EntityDefinition): TemplateVariables {
    const entityFileName = GeneratorUtils.camelToKebab(entityName);
    const entityClass = entityName;
    const entityClassPlural = pluralize(entityName);
    const entityInstance = GeneratorUtils.lowerFirstCamelCase(entityName);
    const pluralizedRoute = pluralize(entityFileName);

    // Filter out tenantId fields from code generation
    const filteredFields = this.filterFields(entityDefinition.fields);

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
      entityClassHumanized: GeneratorUtils.humanize(entityClass),
      entityClassPluralHumanized: GeneratorUtils.humanize(entityClassPlural),
      entityInstance: GeneratorUtils.lowerFirstCamelCase(entityInstance),
      entityRoute: pluralizedRoute,
      routePath: pluralizedRoute,
      primaryKey: { name: 'id', type: 'number' },
      fields: filteredFields,
      relationships: processedRelationships,
      persistableRelationships,
      otherEntitiesWithPersistableRelationship,
      searchEngineAny: entityDefinition.searchEngine,
      anyFieldIsDateDerived: filteredFields.some((f) => 
        f.fieldTypeTimed || f.fieldTypeLocalDate || f.fieldTypeZonedDateTime || f.fieldTypeInstant),
      anyFieldIsBlobDerived: filteredFields.some((f) => f.fieldTypeBinary),
      readOnly: entityDefinition.readOnly || false,
      pagination: entityDefinition.pagination || 'no',
      service: entityDefinition.service || 'no',
      dto: entityDefinition.dto || 'no',
    };
  }

  /**
   * Process relationships to add computed properties
   */
  private static processRelationships(relationships: Relationship[]): ProcessedRelationship[] {
    return relationships.map(rel => {
      const otherEntityName = rel.otherEntityName;
      const otherEntityClass = GeneratorUtils.upperFirstCamelCase(otherEntityName);
      const otherEntityClassPlural = pluralize(otherEntityClass);
      const otherEntityInstance = GeneratorUtils.lowerFirstCamelCase(otherEntityName);
      const otherEntityInstancePlural = pluralize(otherEntityInstance);
      const otherEntityFileName = GeneratorUtils.camelToKebab(otherEntityName);
      
      // Determine relationship field names
      const relationshipName = rel.relationshipName;
      const relationshipFieldName = relationshipName;
      const relationshipFieldNamePlural = pluralize(relationshipName);
      
      // Determine if this is a collection relationship
      const isCollection = rel.relationshipType === 'one-to-many' || rel.relationshipType === 'many-to-many';
      
      // Determine display field - use 'login' for built-in user entity, otherwise default to 'name'
      const otherEntityField = rel.otherEntityField || (rel.relationshipWithBuiltInEntity ? 'login' : 'name');
      
      // Determine if relationship is required
      const relationshipRequired = rel.relationshipRequired || 
        (rel.relationshipValidateRules && rel.relationshipValidateRules.includes('required')) || 
        false;
      
      // Determine if this is a built-in user entity
      const isBuiltInUser = rel.relationshipWithBuiltInEntity && otherEntityName === 'user';
      
      return {
        ...rel,
        // Original relationship properties
        otherEntityName,
        relationshipName,
        relationshipFieldName,
        relationshipFieldNamePlural,
        relationshipNameHumanized: GeneratorUtils.humanize(relationshipName),
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
          routePath: pluralize(otherEntityFileName), // Add pluralized route path
          primaryKey: { name: 'id' }, // Default primary key
          builtInUser: Boolean(isBuiltInUser),
        }
      };
    });
  }

  /**
   * Get unique other entities for API imports
   */
  private static getUniqueOtherEntities(relationships: ProcessedRelationship[]): ProcessedRelationship['otherEntity'][] {
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
   * Filter out system fields and process field types
   */
  private static filterFields(fields: Field[]): Field[] {
    const excludedFields = ['tenantId'];
    
    return fields.filter(field => {
      const shouldExclude = excludedFields.includes(field.fieldName);
      if (shouldExclude) {
        console.log(`Excluding system field from code generation: ${field.fieldName}`);
      }
      return !shouldExclude;
    }).map(field => this.processFieldType(field));
  }

  /**
   * Process field type to set boolean flags for template usage
   */
  private static processFieldType(field: Field): Field {
    const processedField = { ...field };
    
    // Set type-specific boolean flags based on fieldType
    switch (field.fieldType) {
      case 'Integer':
      case 'Long':
      case 'Float':
      case 'Double':
      case 'BigDecimal':
        processedField.fieldTypeNumeric = true;
        break;
      
      case 'Boolean':
        processedField.fieldTypeBoolean = true;
        break;
      
      case 'LocalDate':
        processedField.fieldTypeLocalDate = true;
        processedField.fieldTypeTimed = true;
        break;
      
      case 'ZonedDateTime':
        processedField.fieldTypeZonedDateTime = true;
        processedField.fieldTypeTimed = true;
        break;
      
      case 'Instant':
        processedField.fieldTypeInstant = true;
        processedField.fieldTypeTimed = true;
        break;
      
      case 'TextBlob':
      case 'ImageBlob':
      case 'AnyBlob':
        processedField.fieldTypeBinary = true;
        break;
    }
    
    // Check if field is an enum (has enumValues)
    if (field.enumValues && field.enumValues.length > 0) {
      processedField.fieldIsEnum = true;
    }
    
    return processedField;
  }
}

export type { TemplateVariables, EntityDefinition, Field, Relationship, ProcessedRelationship };
