'use client';

import { ImportHistoryDTO } from '@/core/api/generated/spring/schemas';
import { TableCell, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchableSelect } from './searchable-select';
import { ReactNode } from 'react';
import { SearchableOption } from '../types';
import { normalizeKey } from '../constants/failed-calls';

interface FailedCallRowProps {
  headers: string[];
  headerMapping: Record<string, keyof ImportHistoryDTO>;
  row: ImportHistoryDTO;
  rowIndex: number;
  invalidFields: Set<keyof ImportHistoryDTO>;
  issues: string[];
  rowSaving: boolean;
  rowHasInvalid: boolean;
  rowNeedsAttention: boolean;
  isValidated: boolean;
  getColumnOptions: (header: string, row: ImportHistoryDTO) => SearchableOption[] | null;
  onFieldChange: (rowIndex: number, field: keyof ImportHistoryDTO, value: string) => void;
  customerMap: Map<string, unknown>;
  productMap: Map<string, unknown>;
}

export function FailedCallRow({
  headers,
  headerMapping,
  row,
  rowIndex,
  invalidFields,
  issues,
  rowSaving,
  rowHasInvalid,
  rowNeedsAttention,
  isValidated,
  getColumnOptions,
  onFieldChange,
  customerMap,
  productMap,
}: FailedCallRowProps) {
  const renderReasonCell = (content: ReactNode) => (
    <TableCell className="px-2 sm:px-3 py-2 text-sm align-top min-w-[280px]">{content}</TableCell>
  );

  return (
    <TableRow
      key={row.id}
      className={cn(
        'transition-colors',
        rowHasInvalid && 'bg-red-50/40 hover:bg-red-50/50',
        !rowHasInvalid && rowNeedsAttention && 'bg-amber-50/80 hover:bg-amber-50/90',
        isValidated && 'bg-green-100/60 hover:bg-green-100/70'
      )}
    >
      {headers.map((header, cellIndex) => {
        const fieldName = headerMapping[header];
        const options = getColumnOptions(header, row);
        const isReasonColumn = header === 'Reason';
        const isRemarkColumn = header === 'Remark';
        const baseCellClasses =
          cellIndex === headers.length - 1 ? 'min-w-[280px]' : 'min-w-[200px]';

        if (isReasonColumn) {
          return renderReasonCell(
            issues.length > 0 ? (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm cursor-help text-red-600 font-medium truncate block max-w-[260px]">
                      {issues.join(', ')}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-md p-3 bg-white border shadow-lg">
                    <div className="space-y-1">
                      <p className="font-semibold text-sm text-red-700 mb-2">Validation Errors:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        {issues.map((issue, idx) => (
                          <li key={idx} className="text-sm text-gray-700">
                            {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <span className="text-sm text-green-600 font-medium">No Failures</span>
            )
          );
        }

        return (
          <TableCell
            key={header}
            className={`px-2 sm:px-3 py-2 text-sm align-top ${baseCellClasses}`}
          >
            {options ? (
              <div className="flex items-center gap-2">
                <SearchableSelect
                  value={(row[fieldName] as string) || ''}
                  options={options}
                  placeholder={
                    header === 'Sub Call Type' && options.length === 1 && !options[0].value
                      ? 'N/A'
                      : `Select ${header}`
                  }
                  onSelect={(value) => onFieldChange(rowIndex, fieldName, value)}
                  disabled={rowSaving}
                  invalid={invalidFields.has(fieldName)}
                />
                {header === 'Customer name' &&
                  row.customerBusinessName &&
                  !customerMap.has(normalizeKey(row.customerBusinessName)) && (
                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                      New
                    </Badge>
                  )}
                {header === 'Product Name' &&
                  row.productName &&
                  !productMap.has(normalizeKey(row.productName)) && (
                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                      New
                    </Badge>
                  )}
              </div>
            ) : isRemarkColumn ? (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Input
                        value={row.remark || ''}
                        onChange={(e) => onFieldChange(rowIndex, fieldName, e.target.value)}
                        className={cn(
                          'h-8 text-xs',
                          row.remark && row.remark.trim().length > 0 && 'cursor-help truncate pr-8',
                          invalidFields.has(fieldName) &&
                            'border-destructive text-destructive placeholder:text-destructive bg-red-50'
                        )}
                        disabled={rowSaving}
                        placeholder="Add remark..."
                      />
                      {row.remark && row.remark.trim().length > 0 && (
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                          ...
                        </span>
                      )}
                    </div>
                  </TooltipTrigger>
                  {row.remark && row.remark.trim().length > 0 && (
                    <TooltipContent side="left" className="max-w-md p-3 bg-white border shadow-lg">
                      <div className="space-y-1">
                        <p className="font-semibold text-sm text-gray-800 mb-2">Full Remark:</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                          {row.remark}
                        </p>
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  value={(row[fieldName] as string) || ''}
                  onChange={(e) => onFieldChange(rowIndex, fieldName, e.target.value)}
                  className={cn(
                    'h-8 text-xs',
                    invalidFields.has(fieldName) &&
                      'border-destructive text-destructive placeholder:text-destructive bg-red-50'
                  )}
                  disabled={rowSaving}
                />
                {header === 'Customer name' &&
                  row.customerBusinessName &&
                  !customerMap.has(normalizeKey(row.customerBusinessName)) && (
                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                      New
                    </Badge>
                  )}
                {header === 'Product Name' &&
                  row.productName &&
                  !productMap.has(normalizeKey(row.productName)) && (
                    <Badge variant="secondary" className="text-xs whitespace-nowrap">
                      New
                    </Badge>
                  )}
              </div>
            )}
          </TableCell>
        );
      })}
      <TableCell className="px-2 sm:px-3 py-2 text-sm min-w-[140px]">
        {rowSaving ? (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Saving...
          </span>
        ) : isValidated ? (
          <Badge variant="default">Ready</Badge>
        ) : rowHasInvalid ? (
          <Badge variant="destructive">Fix required</Badge>
        ) : rowNeedsAttention ? (
          <Badge variant="secondary">Needs review</Badge>
        ) : (
          <Badge variant="outline">Pending</Badge>
        )}
      </TableCell>
    </TableRow>
  );
}
