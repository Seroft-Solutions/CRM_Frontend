// migrate-jhipster-entities.ts — v2.1
// ================================================================
// Codemod to migrate **JHipster‑generated React entity UIs** to modern
// **Next.js 15 app‑router** pages that live under the `(protected)`
// route group, use **shadcn/ui**, Orval‑generated React‑Query hooks,
// and keep Redux slices intact.
//
// ⚠️  v2.1 fixes
//   • Removed a stray `= path.join(...)` → compilation error line 61.
//   • `entitiesRoot` now points to `src/features/entities`.
//   • Glob pattern upgraded to `*/*.(index|update).tsx` so nested
//     folders like `customer/customer-update.tsx` are detected.
//   • Added `process.exitCode = 1` instead of exit to avoid tsx crash.
//
// ────────────────────────────────────────────────────────────────────
// How to run
//   pnpm ts-node-esm ./codemod/migrate-jhipster-entities.ts [--force]
//   # or
//   npx tsx ./codemod/migrate-jhipster-entities.ts [--force]
// ================================================================

import path from 'path';
import fs from 'fs-extra';
import fg from 'fast-glob';
import { pascalCase, capitalCase } from 'change-case';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

// ----- CLI --------------------------------------------------------
const argv = yargs(hideBin(process.argv))
  .option('force', {
    type: 'boolean',
    description: 'Overwrite existing files',
    default: false,
  })
  .help(false)
  .parseSync();

// ----- Paths ------------------------------------------------------
const repoRoot = process.cwd();
// JHipster entity folders → src/features/entities/<entity>
const entitiesRoot = path.join(repoRoot, 'src', 'features', 'entities');
// Generated Next.js pages → src/app/(protected)/<entity>
const outputRoot = path.join(repoRoot, 'src', 'app', '(protected)');
// Orval DTOs → src/core/api/generated/schemas
const schemasRoot = path.join(
  repoRoot,
  'src',
  'core',
  'api',
  'generated',
  'schemas',
);

// resolve import bases once
const ENDPOINT_IMPORT_BASE = '@/core/api/generated/endpoints';
const SCHEMA_IMPORT_BASE = '@/core/api/generated/schemas';

// ----- Helpers ----------------------------------------------------
function readDtoInterface(entityKebab: string): string[] {
  const dtoPath = path.join(schemasRoot, `${pascalCase(entityKebab)}DTO.ts`);
  if (!fs.existsSync(dtoPath)) return [];
  const src = fs.readFileSync(dtoPath, 'utf8');
  return [...src.matchAll(/^[\s]*([a-zA-Z0-9_]+)\??:/gm)]
    .map((m) => m[1])
    .filter((key) => key !== 'id');
}

function writePretty(file: string, content: string) {
  if (!argv.force && fs.existsSync(file)) {
    console.log(`↷  keeping existing ${path.relative(repoRoot, file)}`);
    return;
  }
  try {
    const prettier = require('prettier');
    const conf = prettier.resolveConfig.sync(repoRoot) || {};
    content = prettier.format(content, { ...conf, filepath: file });
  } catch {
    /* prettier not installed – skip */
  }
  fs.outputFileSync(file, content);
}

// ----- Main -------------------------------------------------------
function generate() {
  const patterns = ['*/index.tsx', '*/**/*-update.tsx'];
  const entityFolders = fg
    .sync(patterns, { cwd: entitiesRoot })
    .map((p) => p.split('/')[0])
    .filter((v, i, a) => a.indexOf(v) === i);

  if (entityFolders.length === 0) {
    console.error('No entities found under', path.relative(repoRoot, entitiesRoot));
    process.exitCode = 1;
    return;
  }

  entityFolders.forEach((entity) => {
    const kebab = entity; // e.g., 'customer'
    const pascal = pascalCase(kebab); // → 'Customer'
    const dtoFields = readDtoInterface(kebab);

    // ─ columns.tsx ────────────────────────────────────────────────
    const columns = `import { ColumnDef } from '@tanstack/react-table';
import { ${pascal}DTO } from '${SCHEMA_IMPORT_BASE}';

export const columns: ColumnDef<${pascal}DTO>[] = [
  { accessorKey: 'id', header: 'ID' },
${dtoFields.map((f) => `  { accessorKey: '${f}', header: '${capitalCase(f)}' },`).join('\n')}
];
`;

    // ─ list page ─────────────────────────────────────────────────
    const listPage = `"use client";
import { EntityDataTable } from '@/components/data-table/EntityDataTable';
import { columns } from './columns';
import { useGetAll${pascal}s } from '${ENDPOINT_IMPORT_BASE}/${kebab}-resource/${kebab}-resource.gen';

export default function ${pascal}List() {
  const query = useGetAll${pascal}s({});
  return (
    <EntityDataTable title="${capitalCase(kebab)}" columns={columns} data={query.data ?? []} isLoading={query.isLoading} />
  );
}
`;

    // ─ detail page ────────────────────────────────────────────────
    const detailPage = `"use client";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useGet${pascal} } from '${ENDPOINT_IMPORT_BASE}/${kebab}-resource/${kebab}-resource.gen';
import { notFound } from 'next/navigation';

interface Props { params: { id: string } }
export default function ${pascal}Detail({ params }: Props) {
  const { data, isLoading } = useGet${pascal}(Number(params.id));
  if (!isLoading && !data) notFound();
  return (
    <Card>
      <CardHeader><CardTitle>${capitalCase(kebab)} Details</CardTitle></CardHeader>
      <CardContent>{isLoading ? 'Loading…' : <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>}</CardContent>
    </Card>
  );
}
`;

    // ─ form page generator ───────────────────────────────────────
    const formPage = (isNew: boolean) => `"use client";
import { ${isNew ? 'useCreate' : 'useUpdate'}${pascal}${isNew ? '' : `, useGet${pascal}`} } from '${ENDPOINT_IMPORT_BASE}/${kebab}-resource/${kebab}-resource.gen';
import { ${pascal}DTO } from '${SCHEMA_IMPORT_BASE}';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Props { params: { id?: string } }
export default function ${pascal}${isNew ? 'Create' : 'Edit'}({ params }: Props) {
  const router = useRouter();
  const mutation = ${isNew ? `useCreate${pascal}` : `useUpdate${pascal}`}();
  ${isNew ? '' : `const { data } = useGet${pascal}(Number(params.id));`}
  const [form, setForm] = useState<Partial<${pascal}DTO>>(${isNew ? '{}' : 'data ?? {}'});

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate(
      ${isNew ? '{ data: form as any }' : '{ id: Number(params.id), data: form as any }'},
      { onSuccess: () => router.push('/${kebab}') },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
${dtoFields.map((f) => `      <div>
        <label className="block text-sm mb-1">${capitalCase(f)}</label>
        <Input value={form.${f} as any ?? ''} onChange={(e) => setForm({ ...form, ${f}: e.target.value })} />
      </div>`).join('\n')}
      <Button type="submit" disabled={mutation.isLoading}>Save</Button>
    </form>
  );
}
`;

    // ----- write files -------------------------------------------
    writePretty(path.join(outputRoot, kebab, 'columns.tsx'), columns);
    writePretty(path.join(outputRoot, kebab, 'page.tsx'), listPage);
    writePretty(path.join(outputRoot, kebab, '[id]', 'page.tsx'), detailPage);
    writePretty(path.join(outputRoot, kebab, 'new', 'page.tsx'), formPage(true));
    writePretty(path.join(outputRoot, kebab, '[id]', 'edit', 'page.tsx'), formPage(false));

    console.log(`✔︎ scaffolded ${kebab}`);
  });

  console.log('\n✨  Migration scaffold complete!');
  console.log(`Pages live under ${path.relative(repoRoot, outputRoot)}`);
  if (!argv.force) console.log('Run with --force to overwrite existing files.');
}

generate();
