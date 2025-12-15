import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { SystemConfigAttributeDTO } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTO';
import { CombinedVariantRow, DraftVariantRow, ExistingVariantRow } from './types';
import { VariantsTableHeader } from './VariantsTableHeader';
import { VariantTableRow } from './VariantTableRow';

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Loader2 } from 'lucide-react';

/**
 * @interface VariantsTableProps
 * @description Props for the VariantsTable component.
 */
interface VariantsTableProps {
  rows: CombinedVariantRow[];
  existingVariantRows: ExistingVariantRow[];
  draftVariants: DraftVariantRow[];
  visibleEnumAttributes: SystemConfigAttributeDTO[];
  existingSkus: Set<string>;
  onUpdateDraft: (key: string, updatedValues: Partial<DraftVariantRow>) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  editingRowData: ExistingVariantRow | null;
  onEditRow: (row: ExistingVariantRow) => void;
  onUpdateEditingRow: (updatedValues: Partial<ExistingVariantRow>) => void;
  onSaveExisting: () => void;
  onCancelEdit: () => void;
  onArchiveRow: (row: ExistingVariantRow) => void;
  isLoading?: boolean;
}

/**
 * @component VariantsTable
 * @description A component that displays a table of product variants, including both saved and draft variants.
 * It includes a header with summary badges and a scrollable body containing the variant rows.
 * @param {VariantsTableProps} props - The props for the component.
 * @returns {JSX.Element | null} The rendered table, or null if there are no rows to display.
 */
export function VariantsTable({
  rows,
  existingVariantRows,
  draftVariants,
  visibleEnumAttributes,
  existingSkus,
  onUpdateDraft,
  currentPage,
  totalPages,
  onPageChange,
  editingRowData,
  onEditRow,
  onUpdateEditingRow,
  onSaveExisting,
  onCancelEdit,
  onArchiveRow,
  isLoading,
}: VariantsTableProps) {
  const totalExistingRows = existingVariantRows.length;
  const totalRowsToDisplay = rows.length;
  const hasDrafts = draftVariants.length > 0;

  const showTable = hasDrafts || totalExistingRows > 0;
  if (!showTable && !isLoading) {
    return (
      <div className="rounded-md border bg-background p-8 text-center text-muted-foreground">
        No variants found for this status.
      </div>
    );
  }

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 1) return [];
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    if (currentPage > 2) pages.push(currentPage - 1);
    if (currentPage !== 1 && currentPage !== totalPages) pages.push(currentPage);
    if (currentPage < totalPages - 1) pages.push(currentPage + 1);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return [...new Set(pages)];
  };
  
  const totalColumnCount = visibleEnumAttributes.length + 5;

  return (
    <div className="rounded-md border bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <h4 className="text-sm font-semibold">Variants Table</h4>
          <Badge variant="outline" className="text-xs">
            {totalExistingRows} saved
          </Badge>
          {hasDrafts && (
            <Badge className="bg-blue-500 text-white text-xs">
              {draftVariants.length} draft
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Total: {totalExistingRows + draftVariants.length} row(s)
        </p>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <VariantsTableHeader visibleEnumAttributes={visibleEnumAttributes} />
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={totalColumnCount} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                </TableCell>
              </TableRow>
            ) : totalRowsToDisplay > 0 ? (
              rows.map((item) => (
                <VariantTableRow
                  key={item.rowKey}
                  item={item}
                  visibleEnumAttributes={visibleEnumAttributes}
                  existingSkus={existingSkus}
                  onUpdateDraft={onUpdateDraft}
                  editingRowData={editingRowData}
                  onEditRow={onEditRow}
                  onUpdateEditingRow={onUpdateEditingRow}
                  onSaveExisting={onSaveExisting}
                  onCancelEdit={onCancelEdit}
                  onArchiveRow={onArchiveRow}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={totalColumnCount} className="h-24 text-center">
                  No variants to display for this filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-center p-4 border-t">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) onPageChange(currentPage - 1);
                  }}
                  className={!isLoading && currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {getPageNumbers().map((page, index) => (
                <PaginationItem key={index}>
                  {typeof page === 'string' ? (
                    <span className="px-3">...</span>
                  ) : (
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange(page);
                      }}
                      isActive={currentPage === page}
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) onPageChange(currentPage + 1);
                  }}
                  className={!isLoading && currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
