'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import type { ImportHistoryDTO } from '@/core/api/generated/spring/schemas';
import { CustomerDTOStatus } from '@/core/api/generated/spring/schemas/CustomerDTOStatus';
import {
  useGetAllImportHistories,
  useDeleteAllImportHistoryEntries,
  useDeleteImportHistory,
} from '@/core/api/generated/spring/endpoints/import-history-resource/import-history-resource.gen';
import { useCreateCustomer } from '@/core/api/generated/spring/endpoints/customer-resource/customer-resource.gen';

const ZIP_REGEX = /^[0-9]{6}$/;
const MOBILE_REGEX = /^[+]?[0-9]{10,15}$/;

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isCustomerImportHistoryRow(row: ImportHistoryDTO): boolean {
  const hasIssue = hasText(row.issue);
  if (!hasIssue) return false;

  const entityName = row.entityName;
  if (entityName) {
    return entityName.toUpperCase() === 'CUSTOMER';
  }

  // Heuristic: customer import rows only use customer fields (no call/product fields).
  const hasCallOrProductSignals =
    hasText(row.callType) ||
    hasText(row.subCallType) ||
    hasText(row.priority) ||
    hasText(row.callStatus) ||
    hasText(row.externalId) ||
    hasText(row.productName) ||
    hasText(row.productCode);

  return !hasCallOrProductSignals;
}

async function resolveAreaIdByZip(zipCode: string): Promise<number | null> {
  const { searchGeography } = await import('@/core/api/generated/spring/endpoints/area-resource/area-resource.gen');
  const areas = await searchGeography({ term: zipCode, size: 5 });
  const match = areas?.find((a) => a?.pincode === zipCode && a?.status === 'ACTIVE');

  return typeof match?.id === 'number' ? match.id : null;
}

type RowErrorMap = Record<number, string>;

function parseRemarkForCustomerExtras(remark: unknown): { email?: string; contactPerson?: string } {
  if (!hasText(remark)) return {};
  const parts = remark
    .split(';')
    .map((p) => p.trim())
    .filter(Boolean);

  const out: { email?: string; contactPerson?: string } = {};

  for (const part of parts) {
    const [rawKey, ...rest] = part.split('=');
    const key = (rawKey ?? '').trim();
    const value = rest.join('=').trim();
    if (!key || !value) continue;

    if (key === 'email') out.email = value;
    if (key === 'contactPerson') out.contactPerson = value;
  }

  return out;
}

export function FailedCustomersTable() {
  const [editableRows, setEditableRows] = useState<ImportHistoryDTO[]>([]);
  const [pendingRowIds, setPendingRowIds] = useState<Set<number>>(new Set());
  const [rowErrors, setRowErrors] = useState<RowErrorMap>({});

  const {
    data: importHistoryData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllImportHistories(
    {
      page: 0,
      size: 1000,
      sort: ['id,desc'],
    },
    {
      query: {
        staleTime: 0,
        cacheTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: 'always',
        refetchOnReconnect: 'always',
        keepPreviousData: false,
      },
    }
  );

  useEffect(() => {
    const rows = (importHistoryData ?? []).filter(
      (row) => typeof row.id === 'number' && isCustomerImportHistoryRow(row)
    );
    setEditableRows(rows);
    setPendingRowIds(new Set());
    setRowErrors({});
  }, [importHistoryData]);

  const { mutateAsync: createCustomerAsync } = useCreateCustomer();
  const { mutateAsync: deleteImportHistoryAsync } = useDeleteImportHistory();
  const { mutateAsync: deleteAllImportHistoryEntriesAsync } = useDeleteAllImportHistoryEntries();

  const computeRowIssues = useCallback((row: ImportHistoryDTO): string[] => {
    const issues: string[] = [];

    const name = (row.customerBusinessName ?? '').trim();
    const mobile = (row.phoneNumber ?? '').trim();
    const zip = (row.zipCode ?? '').trim();

    if (name.length < 2 || name.length > 100) issues.push('Customer Business Name must be 2-100 characters.');
    if (!MOBILE_REGEX.test(mobile)) issues.push('Mobile must be 10-15 digits (optional leading +).');
    if (!ZIP_REGEX.test(zip)) issues.push('Zip Code must be exactly 6 digits.');

    return issues;
  }, []);

  const validatedRows = useMemo(() => {
    return editableRows.filter((row) => {
      if (typeof row.id !== 'number') return false;
      if (pendingRowIds.has(row.id)) return false;
      return computeRowIssues(row).length === 0;
    });
  }, [editableRows, pendingRowIds, computeRowIssues]);

  const handleFieldChange = useCallback(
    (rowId: number, field: keyof ImportHistoryDTO, value: string) => {
      setEditableRows((prev) =>
        prev.map((row) => (row.id === rowId ? { ...row, [field]: value as any } : row))
      );
      setRowErrors((prev) => {
        if (!prev[rowId]) return prev;
        const next = { ...prev };
        delete next[rowId];
        return next;
      });
    },
    []
  );

  const handleSaveRow = useCallback(
    async (row: ImportHistoryDTO): Promise<boolean> => {
      if (typeof row.id !== 'number') return false;

      const issues = computeRowIssues(row);
      if (issues.length) {
        toast.error('Please fix validation errors before saving.');
        setRowErrors((prev) => ({ ...prev, [row.id!]: issues.join(' ') }));
        return false;
      }

      const zip = (row.zipCode ?? '').trim();
      const mobile = (row.phoneNumber ?? '').trim();
      const name = (row.customerBusinessName ?? '').trim();

      setPendingRowIds((prev) => new Set(prev).add(row.id!));

      try {
        const areaId = await resolveAreaIdByZip(zip);
        if (!areaId) {
          toast.error(`Zip Code ${zip} not found in Areas.`);
          setRowErrors((prev) => ({ ...prev, [row.id!]: `Zip Code ${zip} not found in Areas.` }));
          return false;
        }

        const extras = parseRemarkForCustomerExtras(row.remark);

        await createCustomerAsync({
          data: {
            customerBusinessName: name,
            mobile,
            status: CustomerDTOStatus.ACTIVE,
            area: { id: areaId } as any,
            ...(extras.email ? { email: extras.email } : {}),
            ...(extras.contactPerson ? { contactPerson: extras.contactPerson } : {}),
          },
        });

        await deleteImportHistoryAsync({ id: row.id! });

        toast.success(`Created customer for row ${row.id}.`);
        setEditableRows((prev) => prev.filter((r) => r.id !== row.id));
        refetch();
        return true;
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Unknown error';
        toast.error(`Failed to save row ${row.id}: ${message}`);
        setRowErrors((prev) => ({ ...prev, [row.id!]: message }));
        return false;
      } finally {
        setPendingRowIds((prev) => {
          const next = new Set(prev);
          next.delete(row.id!);
          return next;
        });
      }
    },
    [computeRowIssues, createCustomerAsync, deleteImportHistoryAsync, refetch]
  );

  const handleSaveValidated = useCallback(async () => {
    if (!validatedRows.length) {
      toast.info('No validated rows available to save.');
      return;
    }

    let successCount = 0;

    for (const row of validatedRows) {
      const ok = await handleSaveRow(row);
      if (ok) successCount += 1;
    }

    if (successCount > 0) toast.success(`Saved ${successCount} row${successCount === 1 ? '' : 's'}.`);
  }, [validatedRows, handleSaveRow]);

  const handleClearAllCustomerFailed = useCallback(async () => {
    if (!editableRows.length) return;
    const confirmed = window.confirm(
      `Delete ${editableRows.length} failed customer import entr${editableRows.length === 1 ? 'y' : 'ies'}?`
    );
    if (!confirmed) return;

    try {
      const resp = await deleteAllImportHistoryEntriesAsync({ params: { entityName: 'CUSTOMER' } });

      const deleted = Number((resp as any)?.deletedCount ?? 0);
      const message = typeof (resp as any)?.message === 'string' ? ((resp as any).message as string) : undefined;

      if (deleted > 0) {
        toast.success(message ?? `Deleted ${deleted} entr${deleted === 1 ? 'y' : 'ies'}.`);
      } else {
        toast.info(message ?? 'No import history entries found to delete.');
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      toast.error(`Failed to clear failed customer import rows: ${message}`);
    } finally {
      refetch();
    }
  }, [editableRows, deleteAllImportHistoryEntriesAsync, refetch]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Failed Customer Import Rows</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading failed import rows…</p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    const msg = error instanceof Error ? error.message : 'Unable to load import history.';
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Failed to load failed customer rows</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-red-700">{msg}</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!editableRows.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Failed Customer Import Rows</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No failed customer import rows found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Failed Customer Import Rows</CardTitle>
          <p className="text-sm text-muted-foreground">
            Fix fields (especially Zip Code) and save to create customers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleClearAllCustomerFailed}>
            Clear All
          </Button>
          <Button onClick={handleSaveValidated}>
            Save Validated ({validatedRows.length})
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Zip Code</TableHead>
              <TableHead>Extra</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {editableRows.map((row) => {
              const rowId = row.id as number;
              const issues = computeRowIssues(row);
              const canSave = issues.length === 0 && !pendingRowIds.has(rowId);
              const errorText = rowErrors[rowId];

              return (
                <TableRow key={rowId}>
                  <TableCell>{rowId}</TableCell>
                  <TableCell className="min-w-[240px]">
                    <Input
                      value={(row.customerBusinessName ?? '') as string}
                      onChange={(e) => handleFieldChange(rowId, 'customerBusinessName', e.target.value)}
                      placeholder="Customer Business Name"
                    />
                  </TableCell>
                  <TableCell className="min-w-[180px]">
                    <Input
                      value={(row.phoneNumber ?? '') as string}
                      onChange={(e) => handleFieldChange(rowId, 'phoneNumber', e.target.value)}
                      placeholder="+1234567890"
                    />
                  </TableCell>
                  <TableCell className="min-w-[140px]">
                    <Input
                      value={(row.zipCode ?? '') as string}
                      onChange={(e) => handleFieldChange(rowId, 'zipCode', e.target.value)}
                      placeholder="6 digits"
                    />
                  </TableCell>
                  <TableCell className="min-w-[220px]">
                    <Input
                      value={(row.remark ?? '') as string}
                      onChange={(e) => handleFieldChange(rowId, 'remark', e.target.value)}
                      placeholder="email=...; contactPerson=..."
                    />
                  </TableCell>
                  <TableCell className="min-w-[260px]">
                    <div className="space-y-1">
                      {errorText ? (
                        <Badge variant="destructive">Needs Fix</Badge>
                      ) : canSave ? (
                        <Badge variant="default">Validated</Badge>
                      ) : (
                        <Badge variant="secondary">Pending Fix</Badge>
                      )}
                      {issues.length > 0 && (
                        <p className="text-xs text-muted-foreground whitespace-normal">
                          {issues.join(' ')}
                        </p>
                      )}
                      {errorText && (
                        <p className="text-xs text-red-700 whitespace-normal">{errorText}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      disabled={!canSave}
                      onClick={() => handleSaveRow(row)}
                    >
                      Save
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
