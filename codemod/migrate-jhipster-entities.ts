/* ------------------------------------------------------------------
 * migrate-jhipster-entities.ts   v8   (2025-05-20)  
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
  })
  .parseSync();

/* ---------- paths ---------------------------------------------- */
const JH_DIR = path.resolve(argv.jhipsterDir);
const TPL_DIR = path.resolve(argv.tplDir);
const OUT_ROOT = path.resolve(argv.out);

const templates: Record<string, string> = Object.fromEntries(
  fg.sync('**/*.tpl', { cwd: TPL_DIR }).map(rel => [
    rel,
    fs.readFileSync(path.join(TPL_DIR, rel), 'utf8'),
  ])
);

/* ---------- main ---------------------------------------------- */
(async function main() {
  const wanted = argv.entities?.split(',').map(s => s.trim()).filter(Boolean);
  const entities = wanted?.length ? wanted : fg.sync('*.json', { cwd: JH_DIR })
    .map(f => pascalCase(path.basename(f, '.json')));
  
  if (!entities.length) {
    console.error('❌ No entities found'); 
    process.exit(1);
  }

  mustache.tags = ['[[', ']]'];

  for (const entity of entities) {
    const ctx = await buildMeta(entity);
    await scaffold(ctx);
  }
})();

/* ---------- metadata builder ----------------------------------- */
interface JHipsterField {
  fieldName: string;
  fieldType: string;
  fieldValues?: string;
  fieldValidateRules?: string[];
}

interface JHipsterEntity {
  name: string;
  fields: JHipsterField[];
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
}

interface EntityContext {
  entity: string;
  kebab: string;
  plural: string;
  dto: string;
  fields: Field[];
  endpointImport: string;
  hooks: {
    getAll: string;
    search: string;
    create: string;
    update: string;
    del: string;
    find: string;
  };
  [key: string]: unknown;
}

async function buildMeta(entity: string): Promise<EntityContext> {
  const jhContent = await fs.readFile(path.join(JH_DIR, `${entity}.json`), 'utf8');
  const jh = JSON.parse(jhContent) as JHipsterEntity;
  
  const fields: Field[] = jh.fields.map(f => ({
    name: camelCase(f.fieldName),
    label: pascalCase(f.fieldName),
    type: mapType(f.fieldType, f.fieldValues),
    enumValues: f.fieldValues?.split(',').map(v => v.trim()) ?? [],
    isEnum: !!f.fieldValues,
    isString: /^String/.test(f.fieldType),
    isNumber: /^(Integer|Long|Float|Double|BigDecimal)/.test(f.fieldType),
    isBoolean: /^Boolean/.test(f.fieldType),
    isDate: /Date|Instant|ZonedDateTime/.test(f.fieldType),
    isRequired: (f.fieldValidateRules || []).includes('required'),
  }));

  const kebab = paramCase(entity);
  const plural = pascalCase(pluralize(entity));
  const dto = `${entity}DTO`;

  return {
    entity,
    kebab,
    plural,
    dto,
    fields,
    endpointImport: '@/core/api/generated/endpoints/' + kebab + '-resource/' + kebab + '-resource.gen',
    hooks: {
      getAll: `useGetAll${plural}`,
      search: `useSearch${plural}`,
      create: `useCreate${entity}`,
      update: `useUpdate${entity}`,
      del: `useDelete${entity}`,
      find: `useGet${entity}`,
    },
  };
}

/* ---------- type mapper --------------------------------------- */
function mapType(jhType: string, vals?: string): string {
  if (vals) return 'enum';
  if (/^String/.test(jhType)) return 'string';
  if (/^(Integer|Long|Float|Double|BigDecimal)/.test(jhType)) return 'number';
  if (/^Boolean/.test(jhType)) return 'boolean';
  if (/Date|Instant|ZonedDateTime/.test(jhType)) return 'date';
  return 'string';
}

/* ---------- code formatting ---------------------------------- */
function formatImports(code: string): string {
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
}

function formatObjectExpressions(code: string): string {
  // Format schema objects
  return code.replace(/z\.object\(\{([^}]+)\}\)/g, (_, props) => {
    const formattedProps = props
      .split(',')
      .map((prop: string) => {
        const [key, ...rest] = prop.trim().split(':');
        return `  ${key.trim()}: ${rest.join(':').trim()}`;
      })
      .filter(Boolean)
      .join(',\n');
    return `z.object({\n${formattedProps}\n})`;
  });
}

function formatJSX(code: string): string {
  return code
    // Standardize JSX attribute spacing
    .replace(/{\s*([^}]+)\s*}/g, (_, content) => {
      if (content.includes('return') || content.includes('function')) return `{${content}}`;
      return `{${content.trim()}}`;
    })
    // Fix JSX attribute spreading
    .replace(/\{\s*\.\.\.\s*(\w+)\s*\}/g, '{...$1}');
}

function formatSpacing(code: string): string {
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
}

function formatTypeScript(code: string): string {
  return formatSpacing(
    formatJSX(
      formatObjectExpressions(
        formatImports(code)
      )
    )
  );
}

async function scaffold(ctx: EntityContext): Promise<void> {
  const dest = path.join(OUT_ROOT, ctx.kebab);
  if (await fs.pathExists(dest) && !argv.force) {
    console.warn(`⚠️ ${ctx.entity} exists – use --force to overwrite`);
    return;
  }

  if (!argv.dry) {
    await fs.remove(dest);
    await fs.ensureDir(dest);
  }

  for (const [rel, tpl] of Object.entries(templates)) {
    if (rel.includes('entity-components/')) continue;

    const outRel = rel
      .replace(/^entity-([^\/]+)\.tsx\.tpl$/, '$1.tsx')
      .replace(/^entity-(\[id\].*)/, '$1')
      .replace(/^entity-new/, 'new')
      .replace(/\.tpl$/, '');

    const target = path.join(dest, outRel);
    const text = formatTypeScript(mustache.render(tpl, ctx));

    if (!argv.dry) {
      await fs.ensureDir(path.dirname(target));
      await fs.writeFile(target, text);
    }
    
    console.log(argv.dry ? 'would write' : 'write     ', path.relative(process.cwd(), target));
  }
}
