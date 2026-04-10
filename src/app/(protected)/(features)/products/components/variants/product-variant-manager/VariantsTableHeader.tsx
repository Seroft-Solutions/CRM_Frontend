import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { SystemConfigAttributeDTO } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTO';
import { VariantTableSelection } from './types';

/**
 * @interface VariantsTableHeaderProps
 * @description Props for the VariantsTableHeader component.
 * @property {SystemConfigAttributeDTO[]} visibleEnumAttributes - The sorted list of attributes that should be displayed as columns in the table.
 * @property {boolean} [isViewMode] - Whether the table is in view-only mode.
 */
interface VariantsTableHeaderProps {
  visibleEnumAttributes: SystemConfigAttributeDTO[];
  isViewMode?: boolean;
  selection?: VariantTableSelection;
  onCopySalePriceToAll?: () => void;
}

/**
 * @component VariantsTableHeader
 * @description Renders the header row for the variants table. It dynamically creates a column for each visible
 * ENUM attribute, followed by standard columns for SKU, Price, Stock, and Status.
 * @param {VariantsTableHeaderProps} props - The props for the component.
 * @returns {JSX.Element} The rendered table header.
 */
export function VariantsTableHeader({
  visibleEnumAttributes,
  isViewMode = false,
  selection,
  onCopySalePriceToAll,
}: VariantsTableHeaderProps) {
  const dataColumnCount = visibleEnumAttributes.length + 8 + (isViewMode ? 0 : 1);
  const warehouseColumnWidth = '280px';
  const nonWarehouseColumnCount = dataColumnCount - 1;
  const columnWidth = selection
    ? `calc((100% - 2.5rem - ${warehouseColumnWidth}) / ${nonWarehouseColumnCount})`
    : `calc((100% - ${warehouseColumnWidth}) / ${nonWarehouseColumnCount})`;

  return (
    <TableHeader>
      <TableRow className="bg-muted/50">
        {selection && (
          <TableHead className="font-semibold w-10">
            {selection.onToggleAll ? (
              <div className="flex items-center justify-center">
                <Checkbox
                  checked={selection.isAllSelected}
                  onCheckedChange={(value) => selection.onToggleAll?.(!!value)}
                />
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Select</span>
            )}
          </TableHead>
        )}
        <TableHead className="font-semibold text-center" style={{ width: columnWidth }}>
          Primary
        </TableHead>
        {visibleEnumAttributes.map((attr) => (
          <TableHead
            key={`attr-header-${attr.id}`}
            className="font-semibold"
            style={{ width: columnWidth }}
          >
            {attr.label ?? attr.name}
          </TableHead>
        ))}
        <TableHead className="font-semibold" style={{ width: columnWidth }}>
          SKU
        </TableHead>
        <TableHead className="font-semibold" style={{ width: columnWidth }}>
          Link ID
        </TableHead>
        <TableHead className="font-semibold" style={{ width: columnWidth }}>
          <div className="flex items-center gap-1">
            <span>
              Price <span className="text-red-500">*</span>
            </span>
            {!isViewMode && onCopySalePriceToAll && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-5 w-5 ml-1"
                onClick={onCopySalePriceToAll}
                title="Copy sale price to all variants"
              >
                <Copy className="h-3 w-3" />
              </Button>
            )}
          </div>
        </TableHead>
        <TableHead className="font-semibold" style={{ width: columnWidth }}>
          Stock <span className="text-red-500">*</span>
        </TableHead>
        <TableHead
          className="font-semibold"
          style={{ width: warehouseColumnWidth, minWidth: warehouseColumnWidth }}
        >
          Warehouse <span className="text-red-500">*</span>
        </TableHead>
        <TableHead className="font-semibold" style={{ width: columnWidth }}>
          Status
        </TableHead>
        <TableHead className="font-semibold text-center" style={{ width: columnWidth }}>
          Image
        </TableHead>
        {!isViewMode && (
          <TableHead className="font-semibold text-right" style={{ width: columnWidth }}>
            Actions
          </TableHead>
        )}
      </TableRow>
    </TableHeader>
  );
}
