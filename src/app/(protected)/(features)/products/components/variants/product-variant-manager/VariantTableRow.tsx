import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProductVariantDTOStatus } from '@/core/api/generated/spring/schemas/ProductVariantDTOStatus';
import { SystemConfigAttributeDTO } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTO';
import { Pencil, Save, Trash2, X } from 'lucide-react';
import { CombinedVariantRow, DraftVariantRow, ExistingVariantRow } from './types';

/**
 * @interface VariantTableRowProps
 * @description Props for the VariantTableRow component.
 */
interface VariantTableRowProps {
  item: CombinedVariantRow;
  visibleEnumAttributes: SystemConfigAttributeDTO[];
  existingSkus: Set<string>;
  onUpdateDraft: (key: string, updatedValues: Partial<DraftVariantRow>) => void;
  editingRowData: ExistingVariantRow | null;
  onEditRow: (row: ExistingVariantRow) => void;
  onUpdateEditingRow: (updatedValues: Partial<ExistingVariantRow>) => void;
  onSaveExisting: () => void;
  onCancelEdit: () => void;
  onDeleteRow: (row: ExistingVariantRow) => void;
  isViewMode?: boolean;
}

/**
 * @component VariantTableRow
 * @description Renders a single row in the variants table, handling display and actions for draft, existing, and editing states.
 * @param {VariantTableRowProps} props - The props for the component.
 * @returns {JSX.Element} The rendered table row.
 */
export function VariantTableRow({
  item,
  visibleEnumAttributes,
  existingSkus,
  onUpdateDraft,
  editingRowData,
  onEditRow,
  onUpdateEditingRow,
  onSaveExisting,
  onCancelEdit,
  onDeleteRow,
  isViewMode = false,
}: VariantTableRowProps) {
  const isDraft = item.kind === 'draft';
  const isDuplicate = item.kind === 'duplicate';
  const { row } = item;
  const isEditing = !isDraft && !isDuplicate && editingRowData?.id === row.id;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    onDeleteRow(row as ExistingVariantRow);
    setShowDeleteDialog(false);
  };

  const getRowData = () => {
    if (isEditing) return editingRowData!;

    return row;
  };
  const data = getRowData();

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value ? parseFloat(e.target.value) : undefined;

    if (isDraft) {
      onUpdateDraft(row.key, { price: value });
    } else if (isEditing) {
      onUpdateEditingRow({ price: value });
    }
  };

  const handleStockChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;

    if (isDraft) {
      onUpdateDraft(row.key, { stockQuantity: value });
    } else if (isEditing) {
      onUpdateEditingRow({ stockQuantity: value });
    }
  };

  const handleStatusChange = (v: ProductVariantDTOStatus) => {
    if (isDraft) {
      onUpdateDraft(row.key, { status: v });
    } else if (isEditing) {
      onUpdateEditingRow({ status: v });
    }
  };

  return (
    <>
      <TableRow
        key={item.rowKey}
        className={`group transition-all duration-200 ${
          isEditing
            ? 'bg-gradient-to-r from-amber-50/60 via-orange-50/40 to-yellow-50/60 border-l-4 border-l-amber-400 shadow-sm'
            : isDuplicate
              ? 'bg-gradient-to-r from-amber-50/40 to-orange-50/30 border-l-4 border-l-amber-400 opacity-75'
              : isDraft
                ? 'bg-gradient-to-r from-blue-50/40 to-indigo-50/30 hover:from-blue-100/50 hover:to-indigo-100/40 border-l-4 border-l-blue-400 hover:shadow-md'
                : 'hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 hover:shadow-sm'
        }`}
      >
        {/* Attribute Columns */}
        {visibleEnumAttributes.map((attr) => (
          <TableCell key={`${item.rowKey}-${attr.id}`} className="py-2">
            {row.selections.find((s) => s.attributeId === attr.id) ? (
              <Badge
                variant="secondary"
                className="bg-gradient-to-r from-sidebar-accent/90 to-sidebar-accent text-sidebar-accent-foreground border-transparent font-medium px-2 py-0.5 text-xs shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105"
              >
                {row.selections.find((s) => s.attributeId === attr.id)?.optionLabel}
              </Badge>
            ) : (
              <span className="text-muted-foreground text-sm font-medium">—</span>
            )}
          </TableCell>
        ))}

        {/* SKU Column */}
        <TableCell className="py-2">
          {isDraft ? (
            <div className="space-y-1">
              <Input
                className="h-8 border-2 border-blue-200 focus:border-blue-400 bg-blue-50/50 transition-colors text-sm"
                value={row.sku}
                onChange={(e) => onUpdateDraft(row.key, { sku: e.target.value })}
              />
              {existingSkus.has(row.sku) && (
                <p className="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded border border-red-200">
                  ⚠️ Duplicate SKU
                </p>
              )}
            </div>
          ) : isEditing ? (
            <Input
              className="h-8 border-2 border-amber-200 focus:border-amber-400 bg-amber-50/50 transition-colors text-sm"
              value={data.sku}
              onChange={(e) => onUpdateEditingRow({ sku: e.target.value })}
            />
          ) : (
            <div className="flex items-center gap-2">
              <code
                className={`font-bold px-2 py-1 rounded text-sm border shadow-sm inline-block ${
                  isDuplicate
                    ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-300'
                    : 'bg-gradient-to-r from-primary/10 to-primary/20 text-primary border-primary/20'
                }`}
              >
                {row.sku}
                {isDuplicate && <span className="ml-1 text-xs">⚠️</span>}
              </code>
            </div>
          )}
        </TableCell>

        {/* Price & Stock Columns */}
        <TableCell className="py-2">
          {isDraft || isEditing ? (
            <Input
              className={`h-8 border-2 transition-colors text-sm ${
                isDraft
                  ? 'border-blue-200 focus:border-blue-400 bg-blue-50/50'
                  : 'border-amber-200 focus:border-amber-400 bg-amber-50/50'
              }`}
              type="number"
              step="0.01"
              placeholder="Price"
              value={data.price ?? ''}
              onChange={handlePriceChange}
            />
          ) : (
            <span className="font-semibold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200 text-sm">
              {data.price?.toFixed(2) ?? '—'}
            </span>
          )}
        </TableCell>
        <TableCell className="py-2">
          {isDraft || isEditing ? (
            <Input
              className={`h-8 border-2 transition-colors text-sm ${
                isDraft
                  ? 'border-blue-200 focus:border-blue-400 bg-blue-50/50'
                  : 'border-amber-200 focus:border-amber-400 bg-amber-50/50'
              }`}
              type="number"
              min="0"
              placeholder="Quantity"
              value={data.stockQuantity}
              onChange={handleStockChange}
            />
          ) : (
            <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 text-sm">
              {data.stockQuantity}
            </span>
          )}
        </TableCell>

        {/* Status Column */}
        <TableCell className="py-2">
          {isDraft || isEditing ? (
            <Select value={data.status} onValueChange={handleStatusChange}>
              <SelectTrigger
                className={`h-8 border-2 transition-colors text-sm ${
                  isDraft
                    ? 'border-blue-200 focus:border-blue-400 bg-blue-50/50'
                    : 'border-amber-200 focus:border-amber-400 bg-amber-50/50'
                }`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ProductVariantDTOStatus.ACTIVE}>
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Active
                  </span>
                </SelectItem>
                <SelectItem value={ProductVariantDTOStatus.INACTIVE}>
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    Inactive
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge
              className={`font-medium px-2 py-0.5 text-xs ${
                data.status === ProductVariantDTOStatus.ACTIVE
                  ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full mr-1 inline-block ${
                  data.status === ProductVariantDTOStatus.ACTIVE ? 'bg-green-500' : 'bg-gray-500'
                }`}
              ></div>
              {data.status === ProductVariantDTOStatus.ACTIVE ? 'Active' : 'Inactive'}
            </Badge>
          )}
        </TableCell>

        {/* Actions Column - Hidden in view mode */}
        {!isViewMode && (
          <TableCell className="py-2 text-right">
            <div className="flex items-center justify-end gap-1">
              {!isDraft && !isDuplicate && !isEditing && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditRow(row as ExistingVariantRow)}
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 hover:scale-105 px-2 h-7 text-xs"
                    title="Edit variant"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteClick}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 hover:scale-105 px-2 h-7 text-xs"
                    title="Delete variant"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              )}
              {isDuplicate && (
                <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700 font-medium">
                  <span>⚠️</span>
                  <span>Duplicate</span>
                </div>
              )}
              {isEditing && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSaveExisting}
                    className="text-muted-foreground hover:text-green-700 hover:bg-green-100 transition-all duration-200 hover:scale-105 px-2 h-7 text-xs"
                    title="Save changes"
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onCancelEdit}
                    className="text-muted-foreground hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 hover:scale-105 px-2 h-7 text-xs"
                    title="Cancel editing"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </>
              )}
            </div>
          </TableCell>
        )}
      </TableRow>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              Delete Variant
            </DialogTitle>
            <DialogDescription className="text-left">
              Are you sure you want to delete the variant <strong>&quot;{row.sku}&quot;</strong>?
              <br />
              <span className="text-red-600 font-medium mt-2 block">
                This action cannot be undone and will permanently remove the variant.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} className="px-4">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="px-4 bg-red-600 hover:bg-red-700"
            >
              Delete Variant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
