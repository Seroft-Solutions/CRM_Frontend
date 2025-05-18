#!/usr/bin/env tsx
/**
 * migrate-jhipster-entities.ts — v4.2
 * ================================================================
 * Hybrid codemod for migrating JHipster entity UIs to Next.js 15
 * app-router pages under src/app/(protected)/<entity>, using:
 *   • shadcn/ui, TanStack Table
 *   • Orval React-Query hooks
 *   • preserved Redux slices (synced)
 *
 * v4.2 fix:
 *  • Adds `import { PascalDTO } from '.../schemas/...DTO'` wherever
 *    the DTO type is referenced (List, Actions, Forms).
 *
 * Usage:
 *   pnpm add -D tsx fs-extra fast-glob change-case yargs
 *   npx tsx ./codemod/migrate-jhipster-entities.ts --force --force-table
 * ================================================================
 */

import path from 'path';
import fs from 'fs-extra';
import fg from 'fast-glob';
import { pascalCase, capitalCase } from 'change-case';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';

// ----- CLI --------------------------------------------------------
const argv = yargs(hideBin(process.argv))
  .option('force',       { type: 'boolean', default: false, describe: 'Overwrite existing files' })
  .option('force-table', { type: 'boolean', default: false, describe: 'Overwrite EntityDataTable' })
  .help(false)
  .parseSync();

// ----- Paths & Constants -----------------------------------------
const repoRoot       = process.cwd();
const entitiesRoot   = path.join(repoRoot, 'src', 'features', 'entities');
const outputRoot     = path.join(repoRoot, 'src', 'app', '(protected)');
const schemasRoot    = path.join(repoRoot, 'src', 'core', 'api', 'generated', 'schemas');
const componentsRoot = path.join(repoRoot, 'src', 'components', 'data-table');

const ENDPOINT_BASE = '@/core/api/generated/endpoints';
const SCHEMA_BASE   = '@/core/api/generated/schemas';
const SLICE_BASE    = '@/features/entities';
const HOOKS_IMPORT  = '@/app/hooks'; // must export useAppDispatch

fs.ensureDirSync(componentsRoot);

// ----- Helpers ---------------------------------------------------
function readDtoFields(entity: string): string[] {
  const dtoFile = path.join(schemasRoot, `${pascalCase(entity)}DTO.ts`);
  if (!fs.existsSync(dtoFile)) return [];
  const src = fs.readFileSync(dtoFile, 'utf8');
  return Array.from(src.matchAll(/^\s*([A-Za-z0-9_]+)\??:/gm))
    .map(m => m[1])
    .filter(f => f !== 'id');
}

function writePretty(target: string, code: string, overwrite = false) {
  if (!overwrite && fs.existsSync(target)) return;
  try {
    const prettier = require('prettier');
    const cfg = prettier.resolveConfig.sync(repoRoot) || {};
    code = prettier.format(code, { ...cfg, filepath: target });
  } catch {
    // skip formatting
  }
  fs.outputFileSync(target, code, 'utf8');
}

// ----- Shared EntityDataTable -----------------------------------
// Inside migrate-jhipster-entities.ts, replace scaffoldSharedTable() with:

function scaffoldSharedTable() {
  const file = path.join(componentsRoot, 'EntityDataTable.tsx');
  const code = `"use client";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export interface Action<T> {
  id: string;
  icon: React.ReactNode;
  tooltip: string;
  onClick: (row: T) => void;
  variant?: "default" | "destructive";
  showConfirm?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
}

interface Props<T> {
  title: string;
  columns: ColumnDef<T, any>[];
  data: T[];
  isLoading?: boolean;
  actions?: Action<T>[];
  onAdd?: () => void;
}

export function EntityDataTable<T extends object>({
  title,
  columns,
  data,
  isLoading = false,
  actions = [],
  onAdd,
}: Props<T>) {
  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        {onAdd && <Button onClick={onAdd}>Add New</Button>}
      </div>
      {isLoading ? (
        <div>Loading…</div>
      ) : (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
                {actions.length > 0 && <TableHead>Actions</TableHead>}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell ?? (cell.column.columnDef.accessorKey as string),
                      cell.getContext()
                    )}
                  </TableCell>
                ))}
                {actions.length > 0 && (
                  <TableCell className="flex gap-2">
                    {actions.map(action =>
                      action.showConfirm ? (
                        // wrapping in AlertDialog if confirmation is requested
                        <AlertDialog key={action.id}>
                          <AlertDialogTrigger asChild>
                            <Button variant={action.variant}>{action.icon}</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{action.confirmTitle}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {action.confirmDescription}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => action.onClick(row.original)}>
                                Confirm
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      ) : (
                        <Button
                          key={action.id}
                          variant={action.variant}
                          onClick={() => action.onClick(row.original)}
                          title={action.tooltip}
                        >
                          {action.icon}
                        </Button>
                      )
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
`;
  writePretty(file, code, argv['force-table']);
}


// ----- Main -------------------------------------------------------
async function generate() {
  scaffoldSharedTable();

  const patterns = ['*/index.tsx', '*/**/*-update.tsx'];
  const dirs = fg.sync(patterns, { cwd: entitiesRoot }).map(p => p.split('/')[0]);
  const entities = Array.from(new Set(dirs));

  if (entities.length === 0) {
    console.error('No entities found under', entitiesRoot);
    process.exitCode = 1;
    return;
  }

  for (const kebab of entities) {
    const Pascal = pascalCase(kebab);
    const fields = readDtoFields(kebab);

    // ── columns.tsx ─────────────────────────────────────────
    const columnsCode = `import { ColumnDef } from "@tanstack/react-table";
import { ${Pascal}DTO } from "${SCHEMA_BASE}";

export const columns: ColumnDef<${Pascal}DTO>[] = [
  { accessorKey: "id", header: "ID" },
${fields.map(f => `  { accessorKey: "${f}", header: "${capitalCase(f)}" },`).join('\n')}
];`;
    writePretty(path.join(outputRoot, kebab, 'columns.tsx'), columnsCode, argv.force);

    // ── list page ──────────────────────────────────────────
    const listCode = `"use client";
import { useRouter } from "next/navigation";
import { EntityDataTable, Action } from "@/components/data-table/EntityDataTable";
import { columns } from "./columns";
import { ${Pascal}DTO } from "${SCHEMA_BASE}";
import {
  useGetAll${Pascal}s,
  useDelete${Pascal},
} from "${ENDPOINT_BASE}/${kebab}-resource/${kebab}-resource.gen";
import { Eye, Edit, Trash2 } from "lucide-react";

export default function ${Pascal}List() {
  const router = useRouter();
  const q = useGetAll${Pascal}s();
  const del = useDelete${Pascal}();
  const data: ${Pascal}DTO[] = q.data ?? [];

  const actions: Action<${Pascal}DTO>[] = [
    {
      id: "view",
      icon: <Eye />,
      tooltip: "View",
      onClick: (row) => router.push(\`/${kebab}/\${row.id}\`),
    },
    {
      id: "edit",
      icon: <Edit />,
      tooltip: "Edit",
      onClick: (row) => router.push(\`/${kebab}/\${row.id}/edit\`),
    },
    {
      id: "delete",
      icon: <Trash2 />,
      tooltip: "Delete",
      variant: "destructive",
      showConfirm: true,
      confirmTitle: "Delete ${Pascal}",
      confirmDescription: "This action cannot be undone.",
      onClick: (row) => del.mutate({ id: row.id }, { onSuccess: () => q.refetch() }),
    },
  ];

  return (
    <EntityDataTable
      title="${capitalCase(kebab)}"
      columns={columns}
      data={data}
      isLoading={q.isLoading}
      actions={actions}
      onAdd={() => router.push("/${kebab}/new")}
    />
  );
}
`;
    writePretty(path.join(outputRoot, kebab, 'page.tsx'), listCode, argv.force);

    // ── detail page ─────────────────────────────────────────
    const detailCode = `"use client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useGet${Pascal} } from "${ENDPOINT_BASE}/${kebab}-resource/${kebab}-resource.gen";
import { ${Pascal}DTO } from "${SCHEMA_BASE}";
import { notFound } from "next/navigation";

interface Props { params: { id: string } }

export default function ${Pascal}Detail({ params }: Props) {
  const { data, isLoading } = useGet${Pascal}(Number(params.id));
  if (!isLoading && !data) notFound();
  return (
    <Card>
      <CardHeader><CardTitle>${capitalCase(kebab)} Detail</CardTitle></CardHeader>
      <CardContent>
        {isLoading
          ? "Loading…"
          : <pre className="text-sm">{JSON.stringify(data as ${Pascal}DTO, null, 2)}</pre>}
      </CardContent>
    </Card>
  );
}
`;
    writePretty(path.join(outputRoot, kebab, '[id]', 'page.tsx'), detailCode, argv.force);

    // ── form pages ──────────────────────────────────────────
    const makeForm = (isNew: boolean) => {
      const hook = isNew ? `useCreate${Pascal}` : `useUpdate${Pascal}, useGet${Pascal}`;
      const loadData = isNew
        ? ''
        : `const { data } = useGet${Pascal}(Number(params.id));`;
      const init = isNew ? '{}' : 'data ?? {}';
      const arg  = isNew ? '{ data: form as any }' : '{ id: Number(params.id), data: form as any }';
      const after = `onSuccess: () => router.push('/${kebab}')`;

      return `"use client";
import { ${hook} } from "${ENDPOINT_BASE}/${kebab}-resource/${kebab}-resource.gen";
import { ${Pascal}DTO } from "${SCHEMA_BASE}";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props { params: { id?: string } }
export default function ${Pascal}${isNew ? 'Create' : 'Edit'}({ params }: Props) {
  const router = useRouter();
  const mutation = ${isNew ? `useCreate${Pascal}` : `useUpdate${Pascal}`}();
  ${loadData}
  const [form, setForm] = useState<Partial<${Pascal}DTO>>(${init});

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate(${arg}, { ${after} });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
${fields.map(f => `      <div>
        <label className="block text-sm mb-1">${capitalCase(f)}</label>
        <Input
          value={(form as any).${f} ?? ""}
          onChange={e => setForm({ ...form, ${f}: e.target.value })}
        />
      </div>`).join('\n')}
      <Button type="submit" disabled={mutation.isLoading}>Save</Button>
    </form>
  );
}
`;
    };

    writePretty(path.join(outputRoot, kebab, 'new', 'page.tsx'), makeForm(true), argv.force);
    writePretty(path.join(outputRoot, kebab, '[id]', 'edit', 'page.tsx'), makeForm(false), argv.force);

    console.log(`✔︎ scaffolded ${kebab}`);
  }

  console.log('\n✨ Migration complete! Pages are under src/app/(protected)');
}
generate().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
