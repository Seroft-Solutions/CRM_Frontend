#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get the properly capitalized plural form for the entity name
const getPluralizedEntityName = (entityName) => {
  const singularized = entityName.endsWith('s') 
    ? entityName.slice(0, -1) 
    : entityName;
  const pluralized = pluralize(singularized);
  return toPascalCase(pluralized);
};

// Parse command line arguments
const args = process.argv.slice(2);
const CONFIG = {
  jhipsterDir: path.resolve(process.cwd(), '.jhipster'),
  outputDir: path.resolve(process.cwd(), 'src/app/(protected)'),
  templatesDir: path.resolve(process.cwd(), 'src/templates'),
  createDirectories: true,
  overwriteExisting: false,
  entities: []
};

// Process arguments
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--jhipster-dir' && i + 1 < args.length) {
    CONFIG.jhipsterDir = path.resolve(process.cwd(), args[++i]);
  } else if (arg === '--output-dir' && i + 1 < args.length) {
    CONFIG.outputDir = path.resolve(process.cwd(), args[++i]);
  } else if (arg === '--templates-dir' && i + 1 < args.length) {
    CONFIG.templatesDir = path.resolve(process.cwd(), args[++i]);
  } else if (arg === '--overwrite') {
    CONFIG.overwriteExisting = true;
  } else if (arg === '--no-create-dirs') {
    CONFIG.createDirectories = false;
  } else if (arg === '--entity' && i + 1 < args.length) {
    CONFIG.entities.push(args[++i]);
  } else if (arg === '--help') {
    console.log(`
Entity Generator Script - Help

Usage: node generate-entities.js [options]

Options:
  --jhipster-dir <dir>    Path to JHipster entity directory (default: .jhipster)
  --output-dir <dir>      Path to output directory (default: src/app/(dashboard))
  --templates-dir <dir>   Path to templates directory (default: src/templates)
  --overwrite             Overwrite existing files (default: false)
  --no-create-dirs        Do not create directories (default: create)
  --entity <name>         Generate only specific entity (can be used multiple times)
  --help                  Show this help message
`);
    process.exit(0);
  }
}

// Utility functions
const toPascalCase = (str) => {
  return str
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, c => c.toUpperCase());
};

const toKebabCase = (str) => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
};

const toCamelCase = (str) => {
  return str
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, c => c.toLowerCase());
};

const pluralize = (str) => {
  // Handle specific irregular plurals
  const irregularPlurals = {
    'city': 'cities',
    'party': 'parties',
    'country': 'countries',
    'category': 'categories'
  };
  
  if (irregularPlurals[str.toLowerCase()]) {
    return irregularPlurals[str.toLowerCase()];
  }
  
  // Standard English pluralization rules
  if (str.endsWith('y') && !['ay', 'ey', 'iy', 'oy', 'uy'].some(ending => str.endsWith(ending))) {
    return str.slice(0, -1) + 'ies';
  }
  if (str.endsWith('s') || str.endsWith('x') || str.endsWith('z') || str.endsWith('ch') || str.endsWith('sh')) {
    return str + 'es';
  }
  return str + 's';
};

// Generate entity metadata file
function generateMetadataFile(entity, entityName, outputDir) {
  const pascalName = toPascalCase(entityName);
  const kebabName = toKebabCase(entityName);
  const fileName = `${kebabName}-metadata.ts`;
  const filePath = path.join(outputDir, fileName);

  // Skip if file exists and overwrite is disabled
  if (fs.existsSync(filePath) && !CONFIG.overwriteExisting) {
    console.log(`Skipping ${fileName} - already exists`);
    return;
  }

  const content = `import { generateEntityMetadata, generateZodSchema } from '@/templates/entity-metadata';

// PascalCase conversion helper function
const toPascalCase = (str) => {
  return str
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, c => c.toUpperCase());
};

// Import JHipster entity definition
const ${toCamelCase(entityName)}Entity = ${JSON.stringify(entity, null, 2)};

// Generate metadata
export const ${toCamelCase(entityName)}Metadata = generateEntityMetadata(${toCamelCase(entityName)}Entity);

// Generate Zod schema
export const ${toCamelCase(entityName)}Schema = generateZodSchema(${toCamelCase(entityName)}Metadata);

// Export everything
export default {
  metadata: ${toCamelCase(entityName)}Metadata,
  schema: ${toCamelCase(entityName)}Schema,
  entity: ${toCamelCase(entityName)}Entity
};
`;

  fs.writeFileSync(filePath, content);
  console.log(`Created ${fileName}`);
}

// Generate entity enums file
function generateEnumsFile(entity, entityName, outputDir) {
  const pascalName = toPascalCase(entityName);
  const kebabName = toKebabCase(entityName);
  const fileName = `${kebabName}-enums.ts`;
  const filePath = path.join(outputDir, fileName);

  // Skip if file exists and overwrite is disabled
  if (fs.existsSync(filePath) && !CONFIG.overwriteExisting) {
    console.log(`Skipping ${fileName} - already exists`);
    return;
  }

  // Check if entity has enum fields
  const hasEnums = entity.fields.some(field => field.fieldValues);
  
  if (!hasEnums) {
    const content = `// No enums for ${pascalName} entity
export default {
  values: {}
};
`;
    fs.writeFileSync(filePath, content);
    console.log(`Created ${fileName} (no enums)`);
    return;
  }

  // Process enum fields
  const enumFields = entity.fields.filter(field => field.fieldValues);
  
  const enums = enumFields.map(field => {
    const enumName = toPascalCase(field.fieldName);
    const values = field.fieldValues.split(',').map(v => v.trim());
    
    return {
      name: enumName,
      fieldName: field.fieldName,
      values
    };
  });

  // Generate enum declarations
  const enumDeclarations = enums.map(enumInfo => {
    const enumValues = enumInfo.values.map(value => `  ${value} = '${value}'`).join(',\n');
    return `export enum ${enumInfo.name} {\n${enumValues}\n}`;
  }).join('\n\n');

  // Generate values arrays
  const valueArrays = enums.map(enumInfo => {
    const valuesList = enumInfo.values.map(value => `  '${value}'`).join(',\n');
    return `export const ${enumInfo.name}Values = [\n${valuesList}\n] as const;`;
  }).join('\n\n');

  // Generate types
  const types = enums.map(enumInfo => {
    const valuesList = enumInfo.values.map(value => `  | '${value}'`).join('\n');
    return `export type ${enumInfo.name}Type =\n${valuesList};`;
  }).join('\n\n');

  // Generate values export
  const valuesExport = enums.map(enumInfo => {
    return `    ${enumInfo.fieldName}: ${enumInfo.name}Values`;
  }).join(',\n');

  const content = `/**
 * Generated enums for ${pascalName} entity
 * These enums are derived from the JHipster entity definition
 */

${enumDeclarations}

${types}

${valueArrays}

export default {
  // Export enum values for use in forms and validation
  values: {
${valuesExport}
  }
};
`;

  fs.writeFileSync(filePath, content);
  console.log(`Created ${fileName}`);
}

// Generate entity context file
function generateContextFile(entity, entityName, outputDir) {
  const pascalName = toPascalCase(entityName);
  const kebabName = toKebabCase(entityName);
  const fileName = `${kebabName}-context.tsx`;
  const filePath = path.join(outputDir, fileName);

  // Skip if file exists and overwrite is disabled
  if (fs.existsSync(filePath) && !CONFIG.overwriteExisting) {
    console.log(`Skipping ${fileName} - already exists`);
    return;
  }

  const content = `'use client';

import { createEntityContext } from '@/templates/entity-context';
import { ${pascalName}DTO } from '@/core/api/generated/schemas';

// Create a typed context for the ${pascalName} entity
const { EntityProvider, useEntityContext } = createEntityContext<${pascalName}DTO>();

// Re-export with entity-specific names
export const ${pascalName}Provider = EntityProvider;
export const use${pascalName}Context = useEntityContext;

// Export default
export default {
  ${pascalName}Provider,
  use${pascalName}Context
};
`;

  fs.writeFileSync(filePath, content);
  console.log(`Created ${fileName}`);
}

// Generate entity list page
function generateListPage(entity, entityName, outputDir) {
  const pascalName = toPascalCase(entityName);
  const camelName = toCamelCase(entityName);
  const kebabName = toKebabCase(entityName);
  const pluralName = pluralize(entityName);
  const fileName = `page.tsx`;
  const filePath = path.join(outputDir, fileName);

  // Skip if file exists and overwrite is disabled
  if (fs.existsSync(filePath) && !CONFIG.overwriteExisting) {
    console.log(`Skipping ${fileName} - already exists`);
    return;
  }

  // Prepare columns based on entity fields
  const fieldColumns = entity.fields.map(field => {
    const isEnum = field.fieldValues !== undefined;
    
    return `    {
      accessorKey: '${field.fieldName}',
      header: '${toPascalCase(field.fieldName).replace(/([A-Z])/g, ' $1').trim()}',
      type: '${isEnum ? 'enum' : field.fieldType.toLowerCase()}'
    }`;
  }).join(',\n');

  // Prepare relationship columns
  const relationshipColumns = entity.relationships
    .filter(rel => rel.relationshipType === 'many-to-one')
    .map(rel => {
      const displayField = rel.otherEntityField || 'name';
      
      return `    {
      accessorKey: '${rel.relationshipName}',
      header: '${toPascalCase(rel.relationshipName).replace(/([A-Z])/g, ' $1').trim()}',
      type: 'relationship',
      relationshipDisplayField: '${displayField}'
    }`;
    }).join(',\n');

  // Combine all columns
  const columns = [fieldColumns, relationshipColumns].filter(Boolean).join(',\n');

  const content = `'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

import EntityPage from '@/templates/entity-page';
import { ${pascalName}Provider } from './${kebabName}-context';
import { ${camelName}Metadata } from './${kebabName}-metadata';
import { 
  useGetAll${pluralName}, 
  useDelete${pascalName} 
} from '@/core/api/generated/endpoints/${kebabName}-resource/${kebabName}-resource.gen';

export default function ${pluralName}Page() {
  // Get params from URL for initialization
  const searchParams = useSearchParams();
  const initialSort = searchParams.get('sort') || 'id';
  const initialOrder = searchParams.get('order') || 'DESC';

  // Define columns based on metadata
  const columns = [
${columns}
  ];

  return (
    <${pascalName}Provider baseQueryKey={['/api/${kebabName}s']}>
      <EntityPage
        entityName={${camelName}Metadata.name}
        entityNamePlural={${camelName}Metadata.plural}
        basePath="/${kebabName}s"
        useGetAllEntities={useGetAll${pluralName}}
        useDeleteEntity={useDelete${pascalName}}
        columns={columns}
      />
    </${pascalName}Provider>
  );
}
`;

  fs.writeFileSync(filePath, content);
  console.log(`Created ${fileName}`);
}

// Generate entity detail page
function generateDetailPage(entity, entityName, outputDir) {
  const pascalName = toPascalCase(entityName);
  const camelName = toCamelCase(entityName);
  const kebabName = toKebabCase(entityName);
  const fileName = `page.tsx`;
  const filePath = path.join(outputDir, fileName);

  // Skip if file exists and overwrite is disabled
  if (fs.existsSync(filePath) && !CONFIG.overwriteExisting) {
    console.log(`Skipping ${fileName} - already exists`);
    return;
  }

  // Prepare fields based on entity fields and relationships
  const fields = [
    // ID field
    `    {
      name: 'id',
      label: 'ID',
      type: 'number',
    }`,
    // Entity fields
    ...entity.fields.map(field => {
      const isEnum = field.fieldValues !== undefined;
      
      return `    {
      name: '${field.fieldName}',
      label: '${toPascalCase(field.fieldName).replace(/([A-Z])/g, ' $1').trim()}',
      type: '${isEnum ? 'enum' : field.fieldType.toLowerCase()}'
    }`;
    }),
    // Relationships
    ...entity.relationships
      .filter(rel => rel.relationshipType === 'many-to-one')
      .map(rel => {
        const displayField = rel.otherEntityField || 'name';
        
        return `    {
      name: '${rel.relationshipName}',
      label: '${toPascalCase(rel.relationshipName).replace(/([A-Z])/g, ' $1').trim()}',
      type: 'relationship',
      relationshipDisplayField: '${displayField}'
    }`;
      })
  ].join(',\n');

  const content = `'use client';

import EntityDetailPage from '@/templates/entity-detail-page';
import { ${camelName}Metadata } from '../${kebabName}-metadata';

// Import API hooks
import { 
  useGet${pascalName},
  useDelete${pascalName}
} from '@/core/api/generated/endpoints/${kebabName}-resource/${kebabName}-resource.gen';

// Define props for the page
interface ${pascalName}DetailPageProps {
  params: {
    id: string;
  };
}

export default function ${pascalName}DetailPage({ params }: ${pascalName}DetailPageProps) {
  const id = Number(params.id);
  
  // Define fields to display
  const fields = [
${fields}
  ];

  return (
    <EntityDetailPage
      entityName={${camelName}Metadata.name}
      entityNamePlural={${camelName}Metadata.plural}
      basePath="/${kebabName}s"
      id={id}
      useGetEntity={useGet${pascalName}}
      useDeleteEntity={useDelete${pascalName}}
      fields={fields}
    />
  );
}
`;

  fs.writeFileSync(filePath, content);
  console.log(`Created ${fileName}`);
}

// Generate entity create page
function generateCreatePage(entity, entityName, outputDir) {
  const pascalName = toPascalCase(entityName);
  const camelName = toCamelCase(entityName);
  const kebabName = toKebabCase(entityName);
  const fileName = `page.tsx`;
  const filePath = path.join(outputDir, fileName);

  // Skip if file exists and overwrite is disabled
  if (fs.existsSync(filePath) && !CONFIG.overwriteExisting) {
    console.log(`Skipping ${fileName} - already exists`);
    return;
  }

  // Prepare fields based on entity fields
  const fields = entity.fields.map(field => {
    const isEnum = field.fieldValues !== undefined;
    const isRequired = field.fieldValidateRules?.includes('required') || false;
    
    if (isEnum) {
      const enumName = toPascalCase(field.fieldName);
      
      return `    {
      name: '${field.fieldName}',
      label: '${toPascalCase(field.fieldName).replace(/([A-Z])/g, ' $1').trim()}',
      type: 'enum',
      isRequired: ${isRequired},
      isEnum: true,
      enumValues: ${enumName}Values,
      component: SelectField,
      props: {
        options: ${enumName}Values.map(value => ({ value, label: value }))
      }
    }`;
    }
    
    const fieldType = field.fieldType.toLowerCase();
    let component;
    
    if (fieldType === 'string') {
      component = 'TextField';
    } else if (fieldType === 'integer' || fieldType === 'long' || fieldType === 'float' || fieldType === 'double' || fieldType === 'bigdecimal') {
      component = 'NumberField';
    } else if (fieldType === 'boolean') {
      component = 'CheckboxField';
    } else if (fieldType === 'date' || fieldType === 'zoneddatetime' || fieldType === 'instant' || fieldType === 'localdate') {
      component = 'DateField';
    } else {
      component = 'TextField';
    }
    
    return `    {
      name: '${field.fieldName}',
      label: '${toPascalCase(field.fieldName).replace(/([A-Z])/g, ' $1').trim()}',
      type: '${fieldType}',
      isRequired: ${isRequired}, 
      component: ${component}
    }`;
  }).join(',\n');

  // Prepare imports for relationships search hooks
  const relationshipImports = entity.relationships
    .filter(rel => rel.relationshipType === 'many-to-one')
    .map(rel => {
      const otherEntityPlural = pluralize(rel.otherEntityName);
      const otherEntityPascal = toPascalCase(rel.otherEntityName);
      const otherEntityKebab = toKebabCase(rel.otherEntityName);
      
      return `import {
  useSearch${getPluralizedEntityName(rel.otherEntityName)}
} from '@/core/api/generated/endpoints/${otherEntityKebab}-resource/${otherEntityKebab}-resource.gen';`;
    }).join('\n');

  // Prepare relationships
  const relationships = entity.relationships
    .filter(rel => rel.relationshipType === 'many-to-one')
    .map(rel => {
      const otherEntityPlural = pluralize(rel.otherEntityName);
      const otherEntityPascal = toPascalCase(rel.otherEntityName);
      const displayField = rel.otherEntityField || 'name';
      const isRequired = rel.relationshipValidateRules?.includes('required') || false;
      
      return `    {
      name: '${rel.relationshipName}',
      label: '${toPascalCase(rel.relationshipName).replace(/([A-Z])/g, ' $1').trim()}',
      type: 'many-to-one' as const,
      required: ${isRequired},
      useSearch: useSearch${getPluralizedEntityName(rel.otherEntityName)},
      displayField: '${displayField}'
    }`;
    }).join(',\n');

  // Import enum values if needed
  const enumImports = entity.fields.some(field => field.fieldValues) 
    ? `import { ${entity.fields
        .filter(field => field.fieldValues)
        .map(field => `${toPascalCase(field.fieldName)}Values`)
        .join(', ')} } from '../${kebabName}-enums';` 
    : '';

  const content = `'use client';

import { useRouter } from 'next/navigation';

import EntityLayout from '@/templates/entity-layout';
import EntityForm from '@/templates/entity-form';
import { TextField, SelectField, DateField, NumberField, CheckboxField } from '@/templates/form-fields';
import { ${camelName}Metadata, ${camelName}Schema } from '../${kebabName}-metadata';
${enumImports}

// Import API hooks
import { 
  useCreate${pascalName} 
} from '@/core/api/generated/endpoints/${kebabName}-resource/${kebabName}-resource.gen';
${relationshipImports}

export default function Create${pascalName}Page() {
  const router = useRouter();

  // Define fields and their components
  const fields = [
${fields}
  ];

  // Define relationships
  const relationships = [
${relationships}
  ];

  return (
    <EntityLayout
      title="Create ${pascalName}"
      entityName={${camelName}Metadata.name}
      entityNamePlural={${camelName}Metadata.plural}
      basePath="/${kebabName}s"
    >
      <EntityForm
        schema={${camelName}Schema}
        useCreateEntity={useCreate${pascalName}}
        useUpdateEntity={() => ({})} // Not used in create mode
        dtoType="${pascalName}DTO"
        title="Create ${pascalName}"
        basePath="/${kebabName}s"
        fields={fields}
        relationships={relationships}
      />
    </EntityLayout>
  );
}
`;

  fs.writeFileSync(filePath, content);
  console.log(`Created ${fileName}`);
}

// Generate entity edit page
function generateEditPage(entity, entityName, outputDir) {
  const pascalName = toPascalCase(entityName);
  const camelName = toCamelCase(entityName);
  const kebabName = toKebabCase(entityName);
  const fileName = `page.tsx`;
  const filePath = path.join(outputDir, fileName);

  // Skip if file exists and overwrite is disabled
  if (fs.existsSync(filePath) && !CONFIG.overwriteExisting) {
    console.log(`Skipping ${fileName} - already exists`);
    return;
  }

  // Prepare fields based on entity fields
  const fields = entity.fields.map(field => {
    const isEnum = field.fieldValues !== undefined;
    const isRequired = field.fieldValidateRules?.includes('required') || false;
    
    if (isEnum) {
      const enumName = toPascalCase(field.fieldName);
      
      return `    {
      name: '${field.fieldName}',
      label: '${toPascalCase(field.fieldName).replace(/([A-Z])/g, ' $1').trim()}',
      type: 'enum',
      isRequired: ${isRequired},
      isEnum: true,
      enumValues: ${enumName}Values,
      component: SelectField,
      props: {
        options: ${enumName}Values.map(value => ({ value, label: value }))
      }
    }`;
    }
    
    const fieldType = field.fieldType.toLowerCase();
    let component;
    
    if (fieldType === 'string') {
      component = 'TextField';
    } else if (fieldType === 'integer' || fieldType === 'long' || fieldType === 'float' || fieldType === 'double' || fieldType === 'bigdecimal') {
      component = 'NumberField';
    } else if (fieldType === 'boolean') {
      component = 'CheckboxField';
    } else if (fieldType === 'date' || fieldType === 'zoneddatetime' || fieldType === 'instant' || fieldType === 'localdate') {
      component = 'DateField';
    } else {
      component = 'TextField';
    }
    
    return `    {
      name: '${field.fieldName}',
      label: '${toPascalCase(field.fieldName).replace(/([A-Z])/g, ' $1').trim()}',
      type: '${fieldType}',
      isRequired: ${isRequired}, 
      component: ${component}
    }`;
  }).join(',\n');

  // Prepare imports for relationships search hooks
  const relationshipImports = entity.relationships
    .filter(rel => rel.relationshipType === 'many-to-one')
    .map(rel => {
      const otherEntityPlural = pluralize(rel.otherEntityName);
      const otherEntityPascal = toPascalCase(rel.otherEntityName);
      const otherEntityKebab = toKebabCase(rel.otherEntityName);
      
      return `import {
  useSearch${getPluralizedEntityName(rel.otherEntityName)}
} from '@/core/api/generated/endpoints/${otherEntityKebab}-resource/${otherEntityKebab}-resource.gen';`;
    }).join('\n');

  // Prepare relationships
  const relationships = entity.relationships
    .filter(rel => rel.relationshipType === 'many-to-one')
    .map(rel => {
      const otherEntityPlural = pluralize(rel.otherEntityName);
      const otherEntityPascal = toPascalCase(rel.otherEntityName);
      const displayField = rel.otherEntityField || 'name';
      const isRequired = rel.relationshipValidateRules?.includes('required') || false;
      
      return `    {
      name: '${rel.relationshipName}',
      label: '${toPascalCase(rel.relationshipName).replace(/([A-Z])/g, ' $1').trim()}',
      type: 'many-to-one' as const,
      required: ${isRequired},
      useSearch: useSearch${getPluralizedEntityName(rel.otherEntityName)},
      displayField: '${displayField}'
    }`;
    }).join(',\n');

  // Import enum values if needed
  const enumImports = entity.fields.some(field => field.fieldValues) 
    ? `import { ${entity.fields
        .filter(field => field.fieldValues)
        .map(field => `${toPascalCase(field.fieldName)}Values`)
        .join(', ')} } from '../../${kebabName}-enums';` 
    : '';

  const content = `'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import EntityLayout from '@/templates/entity-layout';
import EntityForm from '@/templates/entity-form';
import { TextField, SelectField, DateField, NumberField, CheckboxField } from '@/templates/form-fields';
import { ${camelName}Metadata, ${camelName}Schema } from '../../${kebabName}-metadata';
${enumImports}

// Import API hooks
import { 
  useGet${pascalName},
  useUpdate${pascalName} 
} from '@/core/api/generated/endpoints/${kebabName}-resource/${kebabName}-resource.gen';
${relationshipImports}
import { ${pascalName}DTO } from '@/core/api/generated/schemas';

// Define props for the page
interface Edit${pascalName}PageProps {
  params: {
    id: string;
  };
}

export default function Edit${pascalName}Page({ params }: Edit${pascalName}PageProps) {
  const id = Number(params.id);
  const router = useRouter();
  const [${camelName}Data, set${pascalName}Data] = useState<${pascalName}DTO | null>(null);
  
  // Fetch entity data
  const { data: ${camelName}, isLoading } = useGet${pascalName}(id);
  
  // Update local state when data is fetched
  useEffect(() => {
    if (${camelName}) {
      set${pascalName}Data(${camelName});
    }
  }, [${camelName}]);

  // Define fields and their components
  const fields = [
${fields}
  ];

  // Define relationships
  const relationships = [
${relationships}
  ];

  // Show loading state while fetching data
  if (isLoading || !${camelName}Data) {
    return (
      <EntityLayout
        title="Edit ${pascalName}"
        entityName={${camelName}Metadata.name}
        entityNamePlural={${camelName}Metadata.plural}
        basePath="/${kebabName}s"
      >
        <div className="flex items-center justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="ml-2">Loading...</span>
        </div>
      </EntityLayout>
    );
  }

  return (
    <EntityLayout
      title={\`Edit ${pascalName}: \${${camelName}Data.id}\`}
      entityName={${camelName}Metadata.name}
      entityNamePlural={${camelName}Metadata.plural}
      basePath="/${kebabName}s"
    >
      <EntityForm
        schema={${camelName}Schema}
        useCreateEntity={() => ({})} // Not used in edit mode
        useUpdateEntity={useUpdate${pascalName}}
        defaultValues={${camelName}Data}
        dtoType="${pascalName}DTO"
        title={\`Edit ${pascalName}: \${${camelName}Data.id}\`}
        basePath="/${kebabName}s"
        fields={fields}
        relationships={relationships}
      />
    </EntityLayout>
  );
}
`;

  fs.writeFileSync(filePath, content);
  console.log(`Created ${fileName}`);
}

// Main function to generate all entity files
function generateEntityFiles(entityPath, entityName) {
  console.log(`\nGenerating files for entity: ${entityName}`);
  
  try {
    // Read entity definition
    const entityJson = fs.readFileSync(entityPath, 'utf8');
    const entity = JSON.parse(entityJson);
    
    // Create output directory for entity
    const kebabName = toKebabCase(entityName);
    const pluralKebabName = pluralize(kebabName);
    const outputDir = path.join(CONFIG.outputDir, pluralKebabName);
    
    if (CONFIG.createDirectories && !fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created directory: ${outputDir}`);
    }
    
    // Generate entity files
    generateMetadataFile(entity, entityName, outputDir);
    generateEnumsFile(entity, entityName, outputDir);
    generateContextFile(entity, entityName, outputDir);
    generateListPage(entity, entityName, outputDir);
    
    // Create detail directory
    const detailDir = path.join(outputDir, '[id]');
    if (CONFIG.createDirectories && !fs.existsSync(detailDir)) {
      fs.mkdirSync(detailDir, { recursive: true });
      console.log(`Created directory: ${detailDir}`);
    }
    
    generateDetailPage(entity, entityName, detailDir);
    
    // Create create directory
    const createDir = path.join(outputDir, 'new');
    if (CONFIG.createDirectories && !fs.existsSync(createDir)) {
      fs.mkdirSync(createDir, { recursive: true });
      console.log(`Created directory: ${createDir}`);
    }
    
    generateCreatePage(entity, entityName, createDir);
    
    // Create edit directory
    const editDir = path.join(detailDir, 'edit');
    if (CONFIG.createDirectories && !fs.existsSync(editDir)) {
      fs.mkdirSync(editDir, { recursive: true });
      console.log(`Created directory: ${editDir}`);
    }
    
    generateEditPage(entity, entityName, editDir);
    
    console.log(`Successfully generated all files for ${entityName}`);
  } catch (error) {
    console.error(`Error generating files for ${entityName}:`, error);
  }
}

// Main execution
function main() {
  console.log('Entity Generation Script');
  console.log('=======================');
  console.log(`JHipster directory: ${CONFIG.jhipsterDir}`);
  console.log(`Output directory: ${CONFIG.outputDir}`);
  console.log(`Templates directory: ${CONFIG.templatesDir}`);
  console.log('=======================\n');
  
  try {
    // Check if directories exist
    if (!fs.existsSync(CONFIG.jhipsterDir)) {
      throw new Error(`JHipster directory not found: ${CONFIG.jhipsterDir}`);
    }
    
    if (!fs.existsSync(CONFIG.templatesDir)) {
      throw new Error(`Templates directory not found: ${CONFIG.templatesDir}`);
    }
    
    // Create output directory if it doesn't exist
    if (CONFIG.createDirectories && !fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
      console.log(`Created output directory: ${CONFIG.outputDir}`);
    }
    
    // Read JHipster entity files
    const files = fs.readdirSync(CONFIG.jhipsterDir);
    const entityFiles = files.filter(file => file.endsWith('.json'));
    
    console.log(`Found ${entityFiles.length} entities`);
    
    // Filter entity files if specific entities are specified
    let filesToProcess = entityFiles;
    if (CONFIG.entities.length > 0) {
      filesToProcess = entityFiles.filter(file => {
        const entityName = file.replace('.json', '');
        return CONFIG.entities.includes(entityName);
      });
      console.log(`Filtered to ${filesToProcess.length} specified entities`);
    }
    
    // Generate files for each entity
    for (const file of filesToProcess) {
      const entityName = file.replace('.json', '');
      const entityPath = path.join(CONFIG.jhipsterDir, file);
      
      generateEntityFiles(entityPath, entityName);
    }
    
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
