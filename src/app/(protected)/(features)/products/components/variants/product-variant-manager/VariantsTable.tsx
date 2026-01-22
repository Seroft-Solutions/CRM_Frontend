import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { SystemConfigAttributeDTO } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTO';
import {
  CombinedVariantRow,
  DraftVariantRow,
  ExistingVariantRow,
  VariantTableSelection,
} from './types';
import { VariantsTableHeader } from './VariantsTableHeader';
import { VariantTableRow } from './VariantTableRow';

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
  editingRowData: ExistingVariantRow | null;
  onEditRow: (row: ExistingVariantRow) => void;
  onUpdateEditingRow: (updatedValues: Partial<ExistingVariantRow>) => void;
  onSaveExisting: () => void;
  onCancelEdit: () => void;
  onDeleteRow: (row: ExistingVariantRow) => void;
  isLoading?: boolean;
  isViewMode?: boolean;
  selection?: VariantTableSelection;
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
  editingRowData,
  onEditRow,
  onUpdateEditingRow,
  onSaveExisting,
  onCancelEdit,
  onDeleteRow,
  isLoading,
  isViewMode = false,
  selection,
}: VariantsTableProps) {
  const totalExistingRows = existingVariantRows.length;
  const totalRowsToDisplay = rows.length;
  const newDraftVariants = draftVariants.filter((v) => !v.isDuplicate);
  const duplicateDraftVariants = draftVariants.filter((v) => v.isDuplicate);
  const hasDrafts = newDraftVariants.length > 0;
  const hasDuplicates = duplicateDraftVariants.length > 0;

  const showTable = hasDrafts || totalExistingRows > 0;

  if (!showTable && !isLoading) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/5 p-8 text-center">
        <p className="text-sm text-muted-foreground font-medium mb-1">No variants found</p>
        <p className="text-xs text-muted-foreground">
          Create new variants using the generator above.
        </p>
      </div>
    );
  }

  const totalColumnCount =
    visibleEnumAttributes.length + (isViewMode ? 6 : 7) + (selection ? 1 : 0);

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-muted/30">
        <h4 className="text-sm font-semibold text-foreground">Variants</h4>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-green-300 bg-green-50 text-green-700">
            {totalExistingRows} saved
          </Badge>
          {hasDrafts && (
            <Badge className="bg-blue-500 text-white text-xs">{newDraftVariants.length} new</Badge>
          )}
          {hasDuplicates && (
            <Badge className="bg-amber-500 text-white text-xs">
              {duplicateDraftVariants.length} duplicate
              {duplicateDraftVariants.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <VariantsTableHeader
            visibleEnumAttributes={visibleEnumAttributes}
            isViewMode={isViewMode}
            selection={selection}
          />
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={totalColumnCount} className="h-24 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading variants...</p>
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
                  isViewMode={isViewMode}
                  selection={selection}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={totalColumnCount} className="h-24 text-center">
                  <p className="text-sm text-muted-foreground">
                    No variants to display for this filter.
                  </p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
