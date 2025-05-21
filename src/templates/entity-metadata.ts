import { z } from 'zod';

// Convert to PascalCase
const toPascalCase = (str: string): string => {
  return str
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, c => c.toUpperCase());
};

// Define types for JHipster entity schema
interface JHipsterField {
  fieldName: string;
  fieldType: string;
  fieldValues?: string;
  fieldValidateRules?: string[];
}

interface JHipsterRelationship {
  relationshipName: string;
  relationshipType: 'one-to-many' | 'many-to-one' | 'many-to-many' | 'one-to-one';
  otherEntityName: string;
  otherEntityField?: string;
  relationshipValidateRules?: string[];
  otherEntityRelationshipName?: string;
  relationshipSide?: string;
  relationshipWithBuiltInEntity?: boolean;
}

interface JHipsterEntity {
  name: string;
  fields: JHipsterField[];
  relationships: JHipsterRelationship[];
  documentation?: string;
  dto?: string;
  service?: string;
  jpaMetamodelFiltering?: boolean;
  pagination?: string;
  applications?: string;
  changelogDate?: string;
}

// Field metadata
export interface FieldMetadata {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum';
  label: string;
  isRequired: boolean;
  isEnum?: boolean;
  enumValues?: string[];
  defaultValue?: any;
  validations?: Record<string, any>;
}

// Relationship metadata
export interface RelationshipMetadata {
  name: string;
  type: 'one-to-many' | 'many-to-one' | 'many-to-many' | 'one-to-one';
  label: string;
  required: boolean;
  entityName: string;
  displayField: string;
  searchHookName: string;
}

// Entity metadata
export interface EntityMetadata {
  name: string;
  plural: string;
  kebabCase: string;
  description?: string;
  fields: FieldMetadata[];
  relationships: RelationshipMetadata[];
  apiPath: string;
  dtoType: string;
  hasPagination: boolean;
  hooks: {
    get: string;
    getAll: string;
    search?: string;
    create: string;
    update: string;
    del: string;
  };
}

// Convert field type from JHipster to internal type
const mapFieldType = (jhipsterType: string): 'string' | 'number' | 'boolean' | 'date' | 'enum' => {
  const typeMap: Record<string, 'string' | 'number' | 'boolean' | 'date' | 'enum'> = {
    String: 'string',
    Integer: 'number',
    Long: 'number',
    BigDecimal: 'number',
    Float: 'number',
    Double: 'number',
    Boolean: 'boolean',
    Date: 'date',
    ZonedDateTime: 'date',
    Instant: 'date',
    LocalDate: 'date',
    Status: 'enum' // Assuming "Status" is an enum type
  };
  
  return typeMap[jhipsterType] || 'string';
};

// Generate plural form of entity name
const pluralize = (name: string): string => {
  // Handle specific irregular plurals
  const irregularPlurals: Record<string, string> = {
    'city': 'cities',
    'party': 'parties',
    'country': 'countries',
    'category': 'categories'
  };
  
  if (irregularPlurals[name.toLowerCase()]) {
    return irregularPlurals[name.toLowerCase()];
  }
  
  // Standard English pluralization rules
  if (name.endsWith('y') && !['ay', 'ey', 'iy', 'oy', 'uy'].some(ending => name.endsWith(ending))) {
    return name.slice(0, -1) + 'ies';
  }
  if (name.endsWith('s') || name.endsWith('x') || name.endsWith('z') || name.endsWith('ch') || name.endsWith('sh')) {
    return name + 'es';
  }
  return name + 's';
};

// Convert to kebab case
const toKebabCase = (str: string): string => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
};

// Generate field label
const generateFieldLabel = (fieldName: string): string => {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
};

// Generate entity metadata from JHipster entity schema
export function generateEntityMetadata(entity: JHipsterEntity): EntityMetadata {
  const fields: FieldMetadata[] = entity.fields.map(field => {
    const isEnum = field.fieldType === 'Status' || (field.fieldValues && field.fieldValues.length > 0);
    const enumValues = isEnum && field.fieldValues 
      ? field.fieldValues.split(',').map(v => v.trim()) 
      : undefined;
    
    return {
      name: field.fieldName,
      type: mapFieldType(field.fieldType),
      label: generateFieldLabel(field.fieldName),
      isRequired: field.fieldValidateRules?.includes('required') || false,
      isEnum,
      enumValues,
      validations: {}
    };
  });
  
  const relationships: RelationshipMetadata[] = entity.relationships.map(rel => {
    const displayField = rel.otherEntityField || 'id';
  const searchHookName = `useSearch${toPascalCase(pluralize(rel.otherEntityName).replace(/s$/, ''))}s`;
    
    return {
      name: rel.relationshipName,
      type: rel.relationshipType,
      label: generateFieldLabel(rel.relationshipName),
      required: rel.relationshipValidateRules?.includes('required') || false,
      entityName: rel.otherEntityName,
      displayField,
      searchHookName
    };
  });
  
  const entityName = entity.name;
  const kebabCase = toKebabCase(entityName);
  
  return {
    name: entityName,
    plural: pluralize(entityName),
    kebabCase,
    description: entity.documentation,
    fields,
    relationships,
    apiPath: `/api/${kebabCase}s`,
    dtoType: `${entityName}DTO`,
    hasPagination: entity.pagination === 'pagination' || entity.pagination === 'infinite-scroll',
    hooks: {
      get: `useGet${entityName}`,
      getAll: `useGetAll${entityName}s`,
      search: entity.jpaMetamodelFiltering ? `useSearch${entityName}s` : undefined,
      create: `useCreate${entityName}`,
      update: `useUpdate${entityName}`,
      del: `useDelete${entityName}`
    }
  };
}

// Generate Zod schema from entity metadata
export function generateZodSchema(metadata: EntityMetadata): z.ZodTypeAny {
  const shape: Record<string, z.ZodTypeAny> = {};
  
  // Add fields
  metadata.fields.forEach(field => {
    let fieldSchema: z.ZodTypeAny;
    
    if (field.isEnum && field.enumValues) {
      fieldSchema = z.enum(field.enumValues as any);
    } else {
      switch (field.type) {
        case 'string':
          fieldSchema = z.string();
          break;
        case 'number':
          fieldSchema = z.number();
          break;
        case 'boolean':
          fieldSchema = z.boolean();
          break;
        case 'date':
          fieldSchema = z.date();
          break;
        default:
          fieldSchema = z.string();
      }
    }
    
    // Add validations
    if (field.isRequired) {
      if (field.type === 'string') {
        fieldSchema = fieldSchema.nonempty({ message: `${field.label} is required` });
      } else if (field.type === 'number') {
        fieldSchema = fieldSchema.min(0, { message: `${field.label} is required` });
      } else if (field.type === 'date') {
        fieldSchema = fieldSchema.refine(val => !!val, { message: `${field.label} is required` });
      }
    } else {
      fieldSchema = fieldSchema.optional();
    }
    
    shape[field.name] = fieldSchema;
  });
  
  // Add relationships
  metadata.relationships.forEach(rel => {
    const relObject = z.object({
      id: z.number(),
      [rel.displayField]: z.string()
    });
    
    if (rel.type === 'one-to-many' || rel.type === 'many-to-many') {
      shape[rel.name] = z.array(relObject);
    } else {
      shape[rel.name] = relObject;
    }
    
    if (!rel.required) {
      shape[rel.name] = shape[rel.name].optional();
    }
  });
  
  return z.object(shape);
}

export default {
  generateEntityMetadata,
  generateZodSchema
};
