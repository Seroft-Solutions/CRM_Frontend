import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
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
  onArchiveRow: (row: ExistingVariantRow) => void;
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
  onArchiveRow,
}: VariantTableRowProps) {
  const isDraft = item.kind === 'draft';
  const { row } = item;
  const isEditing = !isDraft && editingRowData?.id === row.id;

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
    <TableRow
      key={item.rowKey}
      className={
        isEditing
          ? 'bg-yellow-50/50'
          : isDraft
          ? 'bg-blue-50/50 hover:bg-blue-50/70'
          : 'hover:bg-muted/30'
      }
    >
      {/* Attribute Columns */}
      {visibleEnumAttributes.map((attr) => (
        <TableCell key={`${item.rowKey}-${attr.id}`} className="py-3">
          {row.selections.find((s) => s.attributeId === attr.id) ? (
            <Badge variant="secondary" className="bg-sidebar-accent text-sidebar-accent-foreground border-transparent font-normal">
              {row.selections.find((s) => s.attributeId === attr.id)?.optionLabel}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
        </TableCell>
      ))}

      {/* SKU Column */}
      <TableCell className="py-3">
        {isDraft ? (
          <div className="space-y-1">
            <Input className="h-9" value={row.sku} onChange={(e) => onUpdateDraft(row.key, { sku: e.target.value })} />
            {existingSkus.has(row.sku) && <p className="text-xs text-red-600">Duplicate SKU</p>}
          </div>
        ) : isEditing ? (
          <Input className="h-9" value={data.sku} onChange={(e) => onUpdateEditingRow({ sku: e.target.value })} />
        ) : (
          <div className="flex items-center gap-2">
            <code className="text-sm font-medium bg-muted px-2 py-1 rounded">{row.sku}</code>
          </div>
        )}
      </TableCell>

      {/* Price & Stock Columns */}
      <TableCell className="py-3">
        <Input
          className="h-9" type="number" step="0.01"
          placeholder={isDraft || isEditing ? 'Price' : ''}
          value={data.price ?? ''}
          disabled={!isDraft && !isEditing}
          onChange={handlePriceChange}
        />
      </TableCell>
      <TableCell className="py-3">
        <Input
          className="h-9" type="number" min="0"
          placeholder={isDraft || isEditing ? 'Quantity' : ''}
          value={data.stockQuantity}
          disabled={!isDraft && !isEditing}
          onChange={handleStockChange}
        />
      </TableCell>

      {/* Status Column */}
      <TableCell className="py-3">
        <Select value={data.status} disabled={!isDraft && !isEditing} onValueChange={handleStatusChange}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ProductVariantDTOStatus.ACTIVE}>Active</SelectItem>
            <SelectItem value={ProductVariantDTOStatus.INACTIVE}>Inactive</SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      
      {/* Actions Column */}
      <TableCell className="py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          {!isDraft && !isEditing && (
            <>
              <Button variant="ghost" size="icon" onClick={() => onEditRow(row as ExistingVariantRow)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onArchiveRow(row as ExistingVariantRow)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </>
          )}
          {isEditing && (
            <>
              <Button variant="ghost" size="icon" onClick={onSaveExisting}>
                <Save className="h-4 w-4 text-green-600" />
              </Button>
              <Button variant="ghost" size="icon" onClick={onCancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
