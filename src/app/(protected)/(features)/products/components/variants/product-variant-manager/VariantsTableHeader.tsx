import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SystemConfigAttributeDTO } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTO';

/**
 * @interface VariantsTableHeaderProps
 * @description Props for the VariantsTableHeader component.
 * @property {SystemConfigAttributeDTO[]} visibleEnumAttributes - The sorted list of attributes that should be displayed as columns in the table.
 * @property {boolean} [isViewMode] - Whether the table is in view-only mode.
 */
interface VariantsTableHeaderProps {
  visibleEnumAttributes: SystemConfigAttributeDTO[];
  isViewMode?: boolean;
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
}: VariantsTableHeaderProps) {
  return (
    <TableHeader>
      <TableRow className="bg-muted/50">
        {visibleEnumAttributes.map((attr) => (
          <TableHead key={`attr-header-${attr.id}`} className="font-semibold">
            {attr.label ?? attr.name}
          </TableHead>
        ))}
        <TableHead className="font-semibold">SKU</TableHead>
        <TableHead className="font-semibold">Price</TableHead>
        <TableHead className="font-semibold">Stock</TableHead>
        <TableHead className="font-semibold">Status</TableHead>
        <TableHead className="font-semibold text-center">Image</TableHead>
        <TableHead className="font-semibold text-center">Primary</TableHead>
        {!isViewMode && (
          <TableHead className="font-semibold text-right">Actions</TableHead>
        )}
      </TableRow>
    </TableHeader>
  );
}
