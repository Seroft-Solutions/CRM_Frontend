'use client';

import { ImportHistoryDTO } from '@/core/api/generated/spring/schemas';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FailedCallRow } from './failed-call-row';
import { SearchableOption } from '../types';

interface FailedCallsTableBodyProps {
  headers: string[];
  headerMapping: Record<string, keyof ImportHistoryDTO>;
  rows: ImportHistoryDTO[];
  rowErrors: Record<number, string>;
  pendingRowIds: Set<number>;
  computeInvalidFields: (row: ImportHistoryDTO) => Set<keyof ImportHistoryDTO>;
  getComputedIssues: (row: ImportHistoryDTO, invalid: Set<keyof ImportHistoryDTO>) => string[];
  getColumnOptions: (header: string, row: ImportHistoryDTO) => SearchableOption[] | null;
  onFieldChange: (rowIndex: number, field: keyof ImportHistoryDTO, value: string) => void;
  customerMap: Map<string, unknown>;
  productMap: Map<string, unknown>;
}

export function FailedCallsTableBody({
  headers,
  headerMapping,
  rows,
  rowErrors,
  pendingRowIds,
  computeInvalidFields,
  getComputedIssues,
  getColumnOptions,
  onFieldChange,
  customerMap,
  productMap,
}: FailedCallsTableBodyProps) {
  return (
    <div className="table-container overflow-hidden rounded-md border bg-white shadow-sm">
      <div className="table-scroll overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="border-b border-gray-200 bg-gray-50">
              {headers.map((header) => (
                <TableHead
                  key={header}
                  className="px-2 sm:px-3 py-2 whitespace-nowrap font-medium text-gray-700 text-sm"
                >
                  {header}
                </TableHead>
              ))}
              <TableHead className="px-2 sm:px-3 py-2 whitespace-nowrap font-medium text-gray-700 text-sm">
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, rowIndex) => {
              const invalidFields = computeInvalidFields(row);
              const computedIssues = getComputedIssues(row, invalidFields);
              const rowError = row.id ? rowErrors[row.id] : undefined;
              const allIssues = [...computedIssues];

              if (rowError && !allIssues.includes(rowError)) {
                allIssues.push(rowError);
              }

              const rowSaving = row.id ? pendingRowIds.has(row.id) : false;
              const rowHasInvalid = invalidFields.size > 0;
              const rowNeedsAttention = allIssues.length > 0;
              const isValidated = !rowHasInvalid && !rowNeedsAttention;

              return (
                <FailedCallRow
                  key={row.id}
                  headers={headers}
                  headerMapping={headerMapping}
                  row={row}
                  rowIndex={rowIndex}
                  invalidFields={invalidFields}
                  issues={allIssues}
                  rowSaving={rowSaving}
                  rowHasInvalid={rowHasInvalid}
                  rowNeedsAttention={rowNeedsAttention}
                  isValidated={isValidated}
                  getColumnOptions={getColumnOptions}
                  onFieldChange={onFieldChange}
                  customerMap={customerMap}
                  productMap={productMap}
                />
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
