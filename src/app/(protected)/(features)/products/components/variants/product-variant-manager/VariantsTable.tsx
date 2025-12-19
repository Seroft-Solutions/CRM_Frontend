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
  onDeleteRow: (row: ExistingVariantRow) => void;
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
  onDeleteRow,
  isLoading,
}: VariantsTableProps) {
  const totalExistingRows = existingVariantRows.length;
  const totalRowsToDisplay = rows.length;
  const hasDrafts = draftVariants.length > 0;

  const showTable = hasDrafts || totalExistingRows > 0;
  if (!showTable && !isLoading) {
    return (
      <div className="rounded-xl border-2 border-dashed border-muted-foreground/30 bg-gradient-to-br from-muted/10 to-muted/5 p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
          <span className="text-3xl">📦</span>
        </div>
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No variants found</h3>
        <p className="text-sm text-muted-foreground">
          No variants found for this product. Create new variants using the generator above.
        </p>
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
    <div className="rounded-xl border-2 border-border/50 bg-gradient-to-br from-background to-background/95 shadow-lg">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-gradient-to-r from-muted/20 to-muted/10 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">📊</span>
            </div>
            <h4 className="text-base font-bold text-foreground">Variants Table</h4>
          </div>
          <Badge variant="outline" className="text-xs font-semibold border-green-300 bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            {totalExistingRows} saved
          </Badge>
          {hasDrafts && (
            <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105">
              <div className="w-2 h-2 bg-white/30 rounded-full mr-2"></div>
              {draftVariants.length} draft
            </Badge>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">
            {totalExistingRows + draftVariants.length} total variants
          </p>
          <p className="text-xs text-muted-foreground">
            {totalExistingRows} active • {draftVariants.length} pending
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <VariantsTableHeader visibleEnumAttributes={visibleEnumAttributes} />
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={totalColumnCount} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="relative">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping"></div>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">Loading variants...</p>
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
                  onDeleteRow={onDeleteRow}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={totalColumnCount} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-2xl">🔍</span>
                    <p className="text-sm text-muted-foreground font-medium">
                      No variants to display for this filter.
                    </p>
                  </div>
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
