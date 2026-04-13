import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { SystemConfigAttributeDTO } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTO';
import {
  CombinedVariantRow,
  DraftVariantRow,
  ExistingVariantRow,
  VariantTableSelection,
  VariantWarehouseOption,
} from './types';
import { VariantsTableHeader } from './VariantsTableHeader';
import { VariantTableRow } from './VariantTableRow';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

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
  productName: string;
  existingSkus: Set<string>;
  onUpdateDraft: (key: string, updatedValues: Partial<DraftVariantRow>) => void;
  editingRowData: ExistingVariantRow | null;
  onEditRow: (row: ExistingVariantRow) => void;
  onMarkPrimaryExisting: (row: ExistingVariantRow) => void;
  onUpdateEditingRow: (updatedValues: Partial<ExistingVariantRow>) => void;
  onSaveExisting: () => void;
  onCancelEdit: () => void;
  onDeleteRow: (row: ExistingVariantRow) => void;
  warehouses: VariantWarehouseOption[];
  isLoading?: boolean;
  isViewMode?: boolean;
  selection?: VariantTableSelection;
  validationErrors?: Record<string, string[]>;
  onCopySalePriceToAll?: () => void;
  onBulkPriceUpdate?: (price: number) => void;
  onBulkStockUpdate?: (warehouseId: number, stock: number) => void;
  viewPriceHistoryHref?: string;
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
  productName,
  existingSkus,
  onUpdateDraft,
  editingRowData,
  onEditRow,
  onMarkPrimaryExisting,
  onUpdateEditingRow,
  onSaveExisting,
  onCancelEdit,
  onDeleteRow,
  warehouses,
  isLoading,
  isViewMode = false,
  selection,
  validationErrors = {},
  onCopySalePriceToAll,
  onBulkPriceUpdate,
  onBulkStockUpdate,
  viewPriceHistoryHref,
}: VariantsTableProps) {
  const totalExistingRows = existingVariantRows.length;
  const totalRowsToDisplay = rows.length;
  const newDraftVariants = draftVariants.filter((v) => !v.isDuplicate);
  const duplicateDraftVariants = draftVariants.filter((v) => v.isDuplicate);
  const hasDrafts = newDraftVariants.length > 0;
  const hasDuplicates = duplicateDraftVariants.length > 0;

  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkWarehouseId, setBulkWarehouseId] = useState<number | undefined>(undefined);
  const [bulkStock, setBulkStock] = useState('');

  const handleBulkPriceAdd = () => {
    const price = Number(bulkPrice);

    if (!isNaN(price) && price > 0 && onBulkPriceUpdate) {
      onBulkPriceUpdate(price);
      setBulkPrice('');
    }
  };

  const handleBulkStockAdd = () => {
    const stock = Number(bulkStock);

    if (!isNaN(stock) && stock >= 0 && bulkWarehouseId !== undefined && onBulkStockUpdate) {
      onBulkStockUpdate(bulkWarehouseId, stock);
      setBulkStock('');
      setBulkWarehouseId(undefined);
    }
  };

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
    visibleEnumAttributes.length + (isViewMode ? 8 : 9) + (selection ? 1 : 0);

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-b bg-muted/30">
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
        {isViewMode && viewPriceHistoryHref && (
          <Button
            asChild
            variant="outline"
            size="sm"
            className="ml-auto h-8 px-3 text-xs font-semibold"
          >
            <Link href={viewPriceHistoryHref}>View Price History</Link>
          </Button>
        )}
        {!isViewMode && (
          <>
            <div className="flex items-center gap-2 ml-auto border-l pl-4">
              <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                Price:
              </span>
              <Input
                type="number"
                placeholder="Enter price"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                className="w-32 h-8 text-sm font-medium"
                min="0"
                step="0.01"
              />
              <Button
                type="button"
                size="sm"
                variant="default"
                className="h-8 px-3 text-xs font-semibold"
                onClick={handleBulkPriceAdd}
                disabled={!bulkPrice || Number(bulkPrice) <= 0}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add to all
              </Button>
            </div>
            <div className="flex items-center gap-2 border-l pl-4">
              <span className="text-xs font-semibold text-foreground whitespace-nowrap">
                Warehouse:
              </span>
              <Select
                value={bulkWarehouseId?.toString() || ''}
                onValueChange={(val) => setBulkWarehouseId(Number(val))}
              >
                <SelectTrigger className="w-40 h-8 text-sm font-medium">
                  <SelectValue placeholder="Select warehouse" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id.toString()}>
                      {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Stock"
                value={bulkStock}
                onChange={(e) => setBulkStock(e.target.value)}
                className="w-28 h-8 text-sm font-medium"
                min="0"
              />
              <Button
                type="button"
                size="sm"
                variant="default"
                className="h-8 px-3 text-xs font-semibold"
                onClick={handleBulkStockAdd}
                disabled={!bulkWarehouseId || bulkStock === '' || Number(bulkStock) < 0}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add to all
              </Button>
            </div>
          </>
        )}
      </div>
      <div className="overflow-x-auto">
        <Table className="table-fixed w-full min-w-[1200px]">
          <VariantsTableHeader
            visibleEnumAttributes={visibleEnumAttributes}
            isViewMode={isViewMode}
            selection={selection}
            onCopySalePriceToAll={onCopySalePriceToAll}
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
              rows.map((item) => {
                const rowErrors = validationErrors[item.rowKey] || [];

                return (
                  <VariantTableRow
                    key={item.rowKey}
                    item={item}
                    visibleEnumAttributes={visibleEnumAttributes}
                    productName={productName}
                    existingSkus={existingSkus}
                    onUpdateDraft={onUpdateDraft}
                    editingRowData={editingRowData}
                    onEditRow={onEditRow}
                    onMarkPrimaryExisting={onMarkPrimaryExisting}
                    onUpdateEditingRow={onUpdateEditingRow}
                    onSaveExisting={onSaveExisting}
                    onCancelEdit={onCancelEdit}
                    onDeleteRow={onDeleteRow}
                    warehouses={warehouses}
                    isViewMode={isViewMode}
                    selection={selection}
                    validationErrors={rowErrors}
                  />
                );
              })
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
