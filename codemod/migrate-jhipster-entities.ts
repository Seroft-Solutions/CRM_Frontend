/* ------------------------------------------------------------------
 * migrate-jhipster-entities.ts   v9   (2025-05-20)  
 * ----------------------------------------------------------------- */

import fs from 'fs-extra';
import path from 'path';
import mustache from 'mustache';
import fg from 'fast-glob';
import pluralize from 'pluralize';
import { camelCase } from 'camel-case';
import { pascalCase } from 'pascal-case';
import { paramCase } from 'param-case';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

/* ---------- CLI options ------------------------------------------ */
const argv = yargs(hideBin(process.argv))
  .options({
    out: { type: 'string', default: './src/app/(protected)' },
    tplDir: { type: 'string', default: './codemod/templates' },
    jhipsterDir: { type: 'string', default: './.jhipster' },
    entities: { type: 'string', describe: 'Comma-separated list of entity names' },
    force: { type: 'boolean', default: false },
    dry: { type: 'boolean', default: false },
    client: { 
      type: 'string', 
      choices: ['axios', 'fetch'],
      default: 'axios',
      describe: 'HTTP client to use for API calls'
    },
    withEnumHelpers: {
      type: 'boolean',
      default: false,
      describe: 'Generate enum helper functions'
    },
    withPermissions: {
      type: 'boolean',
      default: false,
      describe: 'Add role-based access control'
    }
  })
  .example('$0', 'Generate all entities')
  .example('$0 --entities=User,Role', 'Generate specific entities')
  .example('$0 --client=fetch --withPermissions', 'Use fetch client with RBAC')
  .parseSync();

/* ---------- paths ---------------------------------------------- */
const JH_DIR = path.resolve(argv.jhipsterDir);
const TPL_DIR = path.resolve(argv.tplDir);
const OUT_ROOT = path.resolve(argv.out);

/* ---------- template loading ----------------------------------- */
/**
 * Loads and validates all templates
 * @throws {CodemodError} if templates cannot be loaded
 */
function loadTemplates(): Record<string, string> {
  try {
    const templateFiles = fg.sync('**/*.tpl', { cwd: TPL_DIR });
    if (!templateFiles.length) {
      throw new CodemodError(
        'No template files found',
        ErrorCode.TEMPLATE_NOT_FOUND
      );
    }

    const templates: Record<string, string> = {};
    for (const rel of templateFiles) {
      try {
        templates[rel] = fs.readFileSync(path.join(TPL_DIR, rel), 'utf8');
      } catch (e) {
        throw new CodemodError(
          `Failed to read template ${rel}: ${(e as Error).message}`,
          ErrorCode.TEMPLATE_INVALID
        );
      }
    }
    return templates;
  } catch (e) {
    if (e instanceof CodemodError) throw e;
    throw new CodemodError(
      `Failed to load templates: ${(e as Error).message}`,
      ErrorCode.TEMPLATE_NOT_FOUND
    );
  }
}

const templates = loadTemplates();

/* ---------- types ---------------------------------------------- */
type ExtendedMustache = typeof mustache & { escape: (text: string) => string };

interface EntityMetadata {
  entities: EntityContext[];
  enums: Record<string, string[]>;
}

import { validateEntity, validateTemplates, validateOutputDir } from './utils/validation';
import { CodemodError, ErrorCode, formatError } from './utils/errors';

/**
 * Collects and merges all enum definitions across entities
 * @param entityFiles List of entity JSON file paths
 */
async function collectMetadata(entityFiles: string[]): Promise<EntityMetadata> {
  const entities: EntityContext[] = [];
  const enumMap: Record<string, string[]> = {};

  for (const file of entityFiles) {
    const entity = pascalCase(path.basename(file, '.json'));
    const ctx = await buildMeta(entity);
    
    // Collect enum fields
    for (const field of ctx.fields) {
      if (field.isEnum && field.enumValues.length > 0) {
        const enumName = pascalCase(field.name);
        // Only store unique enum values
        enumMap[enumName] = Array.from(new Set([
          ...(enumMap[enumName] || []),
          ...field.enumValues
        ]));
      }
    }
    
    entities.push(ctx);
  }

  return { entities, enums: enumMap };
}

/* ---------- main ---------------------------------------------- */
/**
 * Main entry point for the entity generator.
 * 
 * Workflow:
 * 1. Validate templates and output directory
 * 2. Find and validate entity definitions
 * 3. Generate code for each entity
 * 4. Report success/failure summary
 * 
 * Exit codes:
 * - 0: Success (all entities processed)
 * - 1: Error (validation failed or some entities failed)
 */
(async function main() {
  try {
    // Validate template directory
    validateTemplates(TPL_DIR);
    console.log('✓ Templates validated successfully');

    // Validate output directory
    validateOutputDir(OUT_ROOT, argv.force);
    console.log('✓ Output directory validated successfully');

    // Get and validate entities
    const wanted = argv.entities?.split(',').map(s => s.trim()).filter(Boolean);
    const entityFiles = wanted?.length 
      ? wanted.map(name => path.join(JH_DIR, `${name}.json`))
      : fg.sync('*.json', { cwd: JH_DIR }).map(f => path.join(JH_DIR, f));

    if (!entityFiles.length) {
      throw new CodemodError('No entities found', ErrorCode.ENTITY_NOT_FOUND);
    }

    // Validate each entity
    for (const entityPath of entityFiles) {
      validateEntity(entityPath);
    }
    console.log(`✓ ${entityFiles.length} entities validated successfully`);

    // Process entities and collect metadata
    mustache.tags = ['[[', ']]'];
    (mustache as ExtendedMustache).escape = (text: string): string => text;

    console.log('Collecting metadata...');
    const { entities, enums } = await collectMetadata(entityFiles);
    
    let successCount = 0;
    const errors: Error[] = [];

    // First, ensure all output directories exist
    for (const ctx of entities) {
      const dest = path.join(OUT_ROOT, ctx.kebab);
      if (!argv.dry) {
        await fs.ensureDir(dest);
      }
    }

    // Write shared enums file if any exist
    if (Object.keys(enums).length > 0) {
      const enumsPath = path.join(OUT_ROOT, 'shared/enums.ts');
      if (!argv.dry) {
        await fs.ensureDir(path.dirname(enumsPath));
        const enumsContent = Object.entries(enums)
          .map(([name, values]) => 
            `export enum ${name} {\n${
              values.map(v => `  ${v} = '${v}'`).join(',\n')
            }\n}`
          )
          .join('\n\n');
        await fs.writeFile(enumsPath, enumsContent);
      }
      console.log(`✓ Generated shared enums file`);
    }

    // Process each entity
    for (const ctx of entities) {
      try {
        // Add shared enums to context and scaffold
        ctx.sharedEnums = enums;
        await scaffold({ 
          ctx,
          enums,
          skipEnumGeneration: Object.keys(enums).length > 0 
        });
        successCount++;
        console.log(`✓ Generated ${ctx.entity}`);
      } catch (e) {
        errors.push(e as Error);
        console.error(`❌ Failed to process ${ctx.entity}: ${formatError(e)}`);
      }
    }

    // Summary
    console.log('\nGeneration complete:');
    console.log(`✓ Successfully processed ${successCount} of ${entities.length} entities`);
    
    if (errors.length > 0) {
      console.error('\nErrors encountered:');
      errors.forEach((e, i) => console.error(`${i + 1}. ${formatError(e)}`));
      process.exit(1);
    }
  } catch (e) {
    console.error(`\n❌ ${formatError(e)}`);
    process.exit(1);
  }
})();

/* ---------- metadata builder ----------------------------------- */
interface JHipsterField {
  fieldName: string;
  fieldType: string;
  fieldValues?: string;
  fieldValidateRules?: string[];
  fieldIsEnum?: boolean;
  fieldTypeBoolean?: boolean;
  fieldTypeBinary?: boolean;
  fieldTypeString?: boolean;
  fieldTypeLocalDate?: boolean;
  fieldTypeZonedDateTime?: boolean;
  fieldTypeInstant?: boolean;
}

interface JHipsterRelationship {
  relationshipName: string;
  otherEntityName: string;
  relationshipType: string;
  relationshipSide?: 'left' | 'right';
  otherEntityRelationshipName?: string;
  otherEntityField?: string;
  otherEntityFieldMapping?: string;
}

interface JHipsterEntity {
  name: string;
  fields: JHipsterField[];
  relationships?: JHipsterRelationship[];
  pagination?: 'pagination' | 'infinite-scroll' | 'no';
  applicationType?: string;
  dto?: string;
  service?: string;
}

interface Field {
  name: string;
  label: string;
  type: string;
  enumValues: string[];
  isEnum: boolean;
  isString: boolean;
  isNumber: boolean;
  isBoolean: boolean;
  isDate: boolean;
  isRequired: boolean;
  isBinary?: boolean;
  isImage?: boolean;
}

interface Relationship {
  name: string;
  label: string;
  type: 'one-to-one' | 'many-to-one' | 'one-to-many' | 'many-to-many';
  targetEntity: string;
  displayField: string;
  required: boolean;
  useSearch: string;
  kebab: string;
  targetKebab: string;
  targetPlural: string;
  isCollection: boolean;
  helperText?: string;
}

interface EntityContext {
  entity: string;
  kebab: string;
  plural: string;
  pluralHumanized: string;
  dto: string;
  fields: Field[];
  relationships: Relationship[];
  endpointImport: string;
  hooks: {
    getAll: string;
    search: string;
    create: string;
    update: string;
    del: string;
    find: string;
    count: string;
  };
  hasPagination: boolean;
  
  // Enum handling
  sharedEnums?: Record<string, string[]>;
  hasLocalEnums?: boolean;
  
  // CLI flags
  client: 'axios' | 'fetch';
  withEnumHelpers: boolean;
  withPermissions: boolean;
  [key: string]: unknown;
}

interface ScaffoldOptions {
  ctx: EntityContext;
  enums?: Record<string, string[]>;
  skipEnumGeneration?: boolean;
}

/**
 * Builds metadata context for an entity.
 * 
 * @param entity The entity name
 * @throws {CodemodError}
 *    - ENTITY_NOT_FOUND if entity file is missing
 *    - ENTITY_INVALID if JSON parsing fails
 *    - ENTITY_FIELD_INVALID if field validation fails
 *    - ENTITY_RELATIONSHIP_INVALID if relationship validation fails
 *    - VALIDATION_ERROR if required fields are missing
 */
async function buildMeta(entity: string): Promise<EntityContext> {
  try {
    // Read and validate entity file
    const entityPath = path.join(JH_DIR, `${entity}.json`);
    if (!await fs.pathExists(entityPath)) {
      throw new CodemodError(
        `Entity file not found: ${entityPath}`,
        ErrorCode.ENTITY_NOT_FOUND,
        entity
      );
    }

    let jhContent: string;
    try {
      jhContent = await fs.readFile(entityPath, 'utf8');
    } catch (e) {
      throw new CodemodError(
        `Failed to read entity file: ${(e as Error).message}`,
        ErrorCode.ENTITY_NOT_FOUND,
        entity
      );
    }

    // Parse and validate JSON
    let jh: JHipsterEntity;
    try {
      jh = JSON.parse(jhContent) as JHipsterEntity;
    } catch (e) {
      throw new CodemodError(
        `Invalid JSON in entity file: ${(e as Error).message}`,
        ErrorCode.ENTITY_INVALID,
        entity
      );
    }

    // Validate required fields
    if (!jh.name || !jh.fields) {
      throw new CodemodError(
        'Entity must have name and fields defined',
        ErrorCode.VALIDATION_ERROR,
        entity
      );
    }

    try {
      // Process fields
      const fields: Field[] = jh.fields.map((f, index) => {
        if (!f.fieldName || !f.fieldType) {
          throw new CodemodError(
            `Field #${index + 1} must have name and type defined`,
            ErrorCode.ENTITY_FIELD_INVALID,
            entity
          );
        }

        return {
          name: camelCase(f.fieldName),
          label: pascalCase(f.fieldName),
          type: mapType(f.fieldType, f.fieldValues),
          enumValues: f.fieldValues?.split(',').map(v => v.trim()) ?? [],
          isEnum: !!f.fieldValues || !!f.fieldIsEnum,
          isString: /^String/.test(f.fieldType) || !!f.fieldTypeString,
          isNumber: /^(Integer|Long|Float|Double|BigDecimal)/.test(f.fieldType),
          isBoolean: /^Boolean/.test(f.fieldType) || !!f.fieldTypeBoolean,
          isDate: /Date|Instant|ZonedDateTime/.test(f.fieldType) || 
            !!f.fieldTypeLocalDate || !!f.fieldTypeZonedDateTime || !!f.fieldTypeInstant,
          isRequired: (f.fieldValidateRules || []).includes('required'),
          isBinary: !!f.fieldTypeBinary,
          isImage: !!f.fieldTypeBinary && /^image\//.test(f.fieldType),
        };
      });

      // Process relationships
      const relationships: Relationship[] = (jh.relationships || []).map(r => {
        if (!r.relationshipName || !r.otherEntityName || !r.relationshipType) {
          throw new CodemodError(
            'Relationship must have name, target entity, and type defined',
            ErrorCode.ENTITY_RELATIONSHIP_INVALID,
            entity
          );
        }

        const targetKebab = paramCase(r.otherEntityName);
        const targetEntity = pascalCase(r.otherEntityName);
        const targetPluralName = pluralize(r.otherEntityName);
        const targetPlural = pascalCase(targetPluralName);
        const isCollection = r.relationshipType === 'one-to-many' || r.relationshipType === 'many-to-many';
        
        const displayField = r.otherEntityField ? camelCase(r.otherEntityField) : 'name';
        const required = r.relationshipType === 'many-to-one' && !r.otherEntityRelationshipName;
        const helperText = isCollection 
          ? `Select multiple ${targetPluralName.toLowerCase()}`
          : `Select a ${r.otherEntityName.toLowerCase()}`;
        
        return {
          name: camelCase(r.relationshipName),
          label: pascalCase(r.relationshipName),
          type: r.relationshipType as 'one-to-one' | 'many-to-one' | 'one-to-many' | 'many-to-many',
          targetEntity,
          displayField,
          required,
          useSearch: `useSearch${targetPlural}`,
          kebab: `${targetKebab}-resource`,
          targetKebab,
          targetPlural,
          isCollection,
          helperText
        };
      });

      // Build context
      const kebab = paramCase(entity);
      const pluralName = pluralize(entity);
      const plural = pascalCase(pluralName);

      return {
        entity,
        kebab,
        plural,
        pluralHumanized: pluralName,
        dto: `${entity}DTO`,
        fields,
        relationships,
        endpointImport: `@/core/api/generated/endpoints/${kebab}-resource/${kebab}-resource.gen`,
        hooks: {
          getAll: `useGetAll${plural}`,
          search: `useSearch${plural}`,
          create: `useCreate${entity}`,
          update: `useUpdate${entity}`,
          del: `useDelete${entity}`,
          find: `useGet${entity}`,
          count: `useCount${plural}`,
        },
        hasPagination: jh.pagination !== 'no',
        client: argv.client as 'axios' | 'fetch',
        withEnumHelpers: argv.withEnumHelpers,
        withPermissions: argv.withPermissions
      };
    } catch (e) {
      if (e instanceof CodemodError) throw e;
      throw new CodemodError(
        `Failed to process entity metadata: ${(e as Error).message}`,
        ErrorCode.ENTITY_INVALID,
        entity
      );
    }
  } catch (e) {
    if (e instanceof CodemodError) throw e;
    throw new CodemodError(
      `Unexpected error building metadata: ${(e as Error).message}`,
      ErrorCode.RUNTIME_ERROR,
      entity
    );
  }
}

/* ---------- type mapper --------------------------------------- */
/**
 * Maps JHipster types to TypeScript types
 * 
 * @param jhType The JHipster field type
 * @param vals Optional enum values
 * @throws {CodemodError} if type is invalid
 */
function mapType(jhType: string, vals?: string): string {
  if (!jhType) {
    throw new CodemodError(
      'Field type is required',
      ErrorCode.ENTITY_FIELD_INVALID
    );
  }

  // Handle enums first
  if (vals) return 'enum';

  // Standard types
  const typeMap: Record<string, string> = {
    String: 'string',
    Integer: 'number',
    Long: 'number',
    Float: 'number',
    Double: 'number',
    BigDecimal: 'number',
    Boolean: 'boolean',
    LocalDate: 'date',
    ZonedDateTime: 'date',
    Instant: 'date',
    'byte[]': 'binary'
  };

  // Check for exact matches first
  for (const [key, value] of Object.entries(typeMap)) {
    if (jhType === key || jhType.startsWith(key)) {
      return value;
    }
  }

  // If no match found, throw error for unknown type
  throw new CodemodError(
    `Unknown field type: ${jhType}`,
    ErrorCode.ENTITY_FIELD_INVALID
  );
}

/* ---------- code formatting ---------------------------------- */
/**
 * Formats import statements in TypeScript code
 * @throws {CodemodError} if import formatting fails
 */
function formatImports(code: string): string {
  if (!code) {
    throw new CodemodError(
      'Cannot format empty code',
      ErrorCode.TEMPLATE_INVALID
    );
  }

  try {
    // Convert multi-line imports to single line
    const formattedImports = code
      .replace(/import\s*{[\s\n]*([\s\S]*?)[\s\n]*}\s*from\s*(['"].*?['"])/g, (_, imports, from) => {
        const items = imports
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean)
          .join(', ');
        return `import { ${items} } from ${from}`;
      });

    // Fix enum imports last to ensure proper order
    return formattedImports.replace(/Values\s+from\s+['"]\.\/(enums|types)['"]/g, 'StatusValues from ./enums');
  } catch (e) {
    throw new CodemodError(
      `Failed to format imports: ${(e as Error).message}`,
      ErrorCode.TEMPLATE_INVALID
    );
  }
}

/**
 * Formats object expressions in TypeScript code
 * @throws {CodemodError} if object formatting fails
 */
function formatObjectExpressions(code: string): string {
  if (!code) {
    throw new CodemodError(
      'Cannot format empty code',
      ErrorCode.TEMPLATE_INVALID
    );
  }

  try {
    return code.replace(/z\.object\(\{([^}]+)\}\)/g, (_, props) => {
      const formattedProps = props
        .split(',')
        .map((prop: string) => {
          const [key, ...rest] = prop.trim().split(':');
          if (!key || !rest.length) {
            throw new CodemodError(
              'Invalid object property format',
              ErrorCode.TEMPLATE_INVALID
            );
          }
          return `  ${key.trim()}: ${rest.join(':').trim()}`;
        })
        .filter(Boolean)
        .join(',\n');
      return `z.object({\n${formattedProps}\n})`;
    });
  } catch (e) {
    throw new CodemodError(
      `Failed to format object expressions: ${(e as Error).message}`,
      ErrorCode.TEMPLATE_INVALID
    );
  }
}

/**
 * Formats JSX code
 * @throws {CodemodError} if JSX formatting fails
 */
function formatJSX(code: string): string {
  if (!code) {
    throw new CodemodError(
      'Cannot format empty code',
      ErrorCode.TEMPLATE_INVALID
    );
  }

  try {
    return code
      // Standardize JSX attribute spacing
      .replace(/{\s*([^}]+)\s*}/g, (_, content) => {
        if (content.includes('return') || content.includes('function')) return `{${content}}`;
        return `{${content.trim()}}`;
      })
      // Fix JSX attribute spreading
      .replace(/\{\s*\.\.\.\s*(\w+)\s*\}/g, '{...$1}');
  } catch (e) {
    throw new CodemodError(
      `Failed to format JSX: ${(e as Error).message}`,
      ErrorCode.TEMPLATE_INVALID
    );
  }
}

/**
 * Formats code spacing and layout
 * @throws {CodemodError} if spacing formatting fails
 */
function formatSpacing(code: string): string {
  if (!code) {
    throw new CodemodError(
      'Cannot format empty code',
      ErrorCode.TEMPLATE_INVALID
    );
  }

  try {
    return code
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize blank lines
      .replace(/\s+$/gm, '') // Trim trailing whitespace
      .replace(/^\s+$/gm, '') // Remove blank lines with only whitespace
      .replace(/{\s*}/g, '{}') // Collapse empty objects
      .replace(/\[\s*\]/g, '[]') // Collapse empty arrays
      .replace(/\(\s*\)/g, '()') // Collapse empty parens
      .replace(/}\s*,\s*(\w)/g, '},\n  $1') // Add newlines after object properties
      .replace(/(\w)\s*,\s*(\w)/g, '$1, $2') // Format comma-separated lists
      .replace(/,\s*([}\]])/g, '$1'); // Remove trailing commas
  } catch (e) {
    throw new CodemodError(
      `Failed to format spacing: ${(e as Error).message}`,
      ErrorCode.TEMPLATE_INVALID
    );
  }
}

/**
 * Formats TypeScript code by applying all formatting functions
 * @throws {CodemodError} if any formatting step fails
 */
function formatTypeScript(code: string): string {
  if (!code) {
    throw new CodemodError(
      'Cannot format empty code',
      ErrorCode.TEMPLATE_INVALID
    );
  }

  try {
    return formatSpacing(
      formatJSX(
        formatObjectExpressions(
          formatImports(code)
        )
      )
    );
  } catch (e) {
    if (e instanceof CodemodError) throw e;
    throw new CodemodError(
      `Failed to format TypeScript: ${(e as Error).message}`,
      ErrorCode.TEMPLATE_INVALID
    );
  }
}

/**
 * Scaffolds entity files from templates.
 * 
 * @param options Scaffold options
 * @param options.ctx The entity context containing metadata
 * @param options.enums Optional shared enum definitions
 * @param options.skipEnumGeneration Whether to skip generating enum files
 * @throws {CodemodError} 
 *    - OUTPUT_DIR_ERROR if directory operations fail
 *    - TEMPLATE_INVALID if template processing fails
 *    - WRITE_ERROR for other file system errors
 */
async function scaffold({ ctx }: ScaffoldOptions): Promise<void> {
  const dest = path.join(OUT_ROOT, ctx.kebab);
  
  try {
    ctx.hasLocalEnums = ctx.fields.some(field => field.isEnum);

    // Check if directory exists
    if (await fs.pathExists(dest)) {
      if (!argv.force) {
        throw new CodemodError(
          `Entity directory already exists: ${dest}`,
          ErrorCode.OUTPUT_DIR_ERROR,
          ctx.entity
        );
      }
      // Clean up existing directory if --force
      if (!argv.dry) {
        await fs.remove(dest);
      }
    }

    // Create output directory
    if (!argv.dry) {
      await fs.ensureDir(dest);
    }

    // Check if we need to generate an enums file
    const hasEnums = ctx.fields.some(field => field.isEnum);

    // Process each template
    for (const [rel, tpl] of Object.entries(templates)) {
      if (rel.includes('entity-components/')) continue;

      // Skip enum template if there are no enums
      if (rel === 'entity-enums.ts.tpl' && !hasEnums) continue;

      const outRel = rel
        .replace(/^entity-([^\/]+)\.tsx\.tpl$/, '$1.tsx')
        .replace(/^entity-([^\/]+)\.ts\.tpl$/, '$1.ts')
        .replace(/^entity-(\[id\].*)/, '$1')
        .replace(/^entity-new/, 'new')
        .replace(/^entity-metadata/, 'metadata')
        .replace(/\.tpl$/, '');

      try {
        const target = path.join(dest, outRel);
        const text = formatTypeScript(mustache.render(tpl, ctx));

        if (!argv.dry) {
          await fs.ensureDir(path.dirname(target));
          await fs.writeFile(target, text);
        }
        
        console.log(argv.dry ? 'would write' : 'write     ', path.relative(process.cwd(), target));
      } catch (e) {
        throw new CodemodError(
          `Failed to process template ${rel}: ${(e as Error).message}`,
          ErrorCode.TEMPLATE_INVALID,
          ctx.entity
        );
      }
    }
  } catch (e) {
    if (e instanceof CodemodError) {
      throw e;
    }
    throw new CodemodError(
      `Failed to scaffold entity: ${(e as Error).message}`,
      ErrorCode.WRITE_ERROR,
      ctx.entity
    );
  }
}
