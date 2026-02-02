import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
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
}: VariantsTableHeaderProps) {
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
        <TableHead className="font-semibold text-center w-16">Primary</TableHead>
        {visibleEnumAttributes.map((attr) => (
          <TableHead key={`attr-header-${attr.id}`} className="font-semibold">
            {attr.label ?? attr.name}
          </TableHead>
        ))}
        <TableHead className="font-semibold w-32">SKU</TableHead>
        <TableHead className="font-semibold w-24">
          Price <span className="text-red-500">*</span>
        </TableHead>
        <TableHead className="font-semibold w-20">
          Stock <span className="text-red-500">*</span>
        </TableHead>
        <TableHead className="font-semibold">Status</TableHead>
        <TableHead className="font-semibold text-center">Image</TableHead>
        {!isViewMode && (
          <TableHead className="font-semibold text-right">Actions</TableHead>
        )}
      </TableRow>
    </TableHeader>
  );
}
