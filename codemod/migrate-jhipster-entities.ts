/* ------------------------------------------------------------------
 *  migrate-jhipster-entities.ts   v7   (2025-05-20)
 *  – same features + robust tsconfig detection
 * ----------------------------------------------------------------- */

import fs from 'fs-extra';
import path from 'path';
import mustache from 'mustache';
import { Project } from 'ts-morph';
import fg from 'fast-glob';
import pluralize from 'pluralize';
import { camelCase }  from 'camel-case';
import { pascalCase } from 'pascal-case';
import { paramCase }  from 'param-case';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

/* ---------- CLI -------------------------------------------------- */
const argv = yargs(hideBin(process.argv))
  .options({
    schemasDir: { type: 'string', default: './src/core/api/generated' },
    jhipsterDir:{ type: 'string', default: './.jhipster' },
    tplDir:     { type: 'string', default: './codemod/templates' },
    out:        { type: 'string', default: './src/app/(protected)' },
    tsConfig:   { type: 'string', describe: 'Optional path to tsconfig.json' },
    entities:   { type: 'string', describe: 'Comma-list of entity names' },
    dry:        { type: 'boolean', default: false },
    force:      { type: 'boolean', default: false },
  })
  .parseSync();

/* ---------- paths ------------------------------------------------ */
const SCHEMAS_DIR = path.resolve(argv.schemasDir);
const JH_DIR      = path.resolve(argv.jhipsterDir);
const TPL_DIR     = path.resolve(argv.tplDir);
const OUT_ROOT    = path.resolve(argv.out);

/* ---------- locate tsconfig.json -------------------------------- */
function findTsConfig(): string | undefined {
  if (argv.tsConfig) {
    const abs = path.resolve(argv.tsConfig);
    if (fs.existsSync(abs)) return abs;
    console.warn('⚠️  --tsConfig not found:', abs);
  }
  // 1) nearest up from schemasDir
  let dir = SCHEMAS_DIR;
  while (dir !== path.dirname(dir)) {
    const p = path.join(dir, 'tsconfig.json');
    if (fs.existsSync(p)) return p;
    dir = path.dirname(dir);
  }
  // 2) repo-root
  const rootTs = path.join(process.cwd(), 'tsconfig.json');
  if (fs.existsSync(rootTs)) return rootTs;
  // 3) give up → undefined (ts-morph will use defaults)
}

const TSCONFIG_PATH = findTsConfig();
if (!TSCONFIG_PATH) console.warn('⚠️  No tsconfig.json found – proceeding with defaults');

/* ---------- load templates (recursive) --------------------------- */
const templates: Record<string,string> = Object.fromEntries(
  fg.sync('**/*.tpl', { cwd: TPL_DIR }).map(rel => [
    rel,
    fs.readFileSync(path.join(TPL_DIR, rel), 'utf8'),
  ]),
);

/* ---------- main ------------------------------------------------- */
(async function main () {
  const wanted   = argv.entities?.split(',').map(s=>s.trim()).filter(Boolean);
  const entities = wanted?.length ? wanted : fg.sync('*.json', { cwd: JH_DIR })
    .map(f=>pascalCase(path.basename(f,'.json')));
  if (!entities.length) { console.error('❌  No entities found'); process.exit(1); }

  const project = new Project(TSCONFIG_PATH ? { tsConfigFilePath: TSCONFIG_PATH } : {});

  // Set custom delimiters
  mustache.tags = ['[[', ']]'];

  for (const ent of entities) {
    const ctx = await buildMeta(ent, project);
    await scaffold(ctx);
  }
})();

/* ---------- helper functions ------------------------------------ */
async function buildMeta(entity: string, project: Project) {
  const jh = JSON.parse(await fs.readFile(path.join(JH_DIR, `${entity}.json`),'utf8'));
  const fields = (jh.fields as any[]).map(f=>({
    name: camelCase(f.fieldName),
    label: pascalCase(f.fieldName),
    type:  mapType(f.fieldType, f.fieldValues),
    enumValues: f.fieldValues?.split(',') ?? [],
    isEnum: !!f.fieldValues,
    isString: /^String/.test(f.fieldType),
    isNumber: /^(Integer|Long|Float|Double|BigDecimal)/.test(f.fieldType),
    isBoolean: /^Boolean/.test(f.fieldType),
    isDate: /Date|Instant|ZonedDateTime/.test(f.fieldType),
    isRequired: (f.fieldValidateRules || []).includes('required'),
  }));
  const kebab  = paramCase(entity);
  const plural = pascalCase(pluralize(entity));
  const dto    = `${entity}DTO`;

  return {
    entity, kebab, plural, dto, fields,
    endpointImport: '@/core/api/generated/endpoints/' + kebab + '-resource/' + kebab + '-resource.gen',
    hooks:{
      getAll:`useGetAll${plural}`,
      search:`useSearch${plural}`,
      create:`useCreate${entity}`,
      update:`useUpdate${entity}`,
      del:`useDelete${entity}`,
      find:`useGet${entity}`,
    },
  };
}

function mapType(jhType:string, vals?:string){
  if(vals) return 'enum';
  if(/^String/.test(jhType)) return 'string';
  if(/^(Integer|Long|Float|Double|BigDecimal)/.test(jhType)) return 'number';
  if(/^Boolean/.test(jhType)) return 'boolean';
  if(/Date|Instant|ZonedDateTime/.test(jhType)) return 'date';
  return 'string';
}

async function scaffold(ctx:any){
  const dest = path.join(OUT_ROOT, ctx.kebab);
  if (await fs.pathExists(dest) && !argv.force) {
    console.warn(`⚠️  ${ctx.entity} exists – use --force to overwrite`); return;
  }
  if (!argv.dry) { await fs.remove(dest); await fs.ensureDir(dest); }

  for (const [rel,tpl] of Object.entries(templates)) {
    // Skip the entity-components templates as we're flattening the structure
    if (rel.includes('entity-components/')) continue;

    // Generate cleaner file paths
    const outRel = rel
      // Convert entity-context.tsx.tpl -> context.tsx
      .replace(/^entity-([^\/]+)\.tsx\.tpl$/, '$1.tsx')
      // Convert entity-[id]/page.tsx.tpl -> [id]/page.tsx
      .replace(/^entity-(\[id\].*)/, '$1')
      // Convert entity-new/page.tsx.tpl -> new/page.tsx
      .replace(/^entity-new/, 'new')
      // Remove .tpl extension
      .replace(/\.tpl$/, '');

    const target = path.join(dest, outRel);
    const text = mustache.render(tpl, ctx, templates);

    if (!argv.dry) {
      await fs.ensureDir(path.dirname(target));
      await fs.writeFile(target, text, 'utf8');
    }
    console.log(argv.dry ? 'would write' : 'write     ', path.relative(process.cwd(), target));
  }
}
