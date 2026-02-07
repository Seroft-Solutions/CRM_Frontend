import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
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
import { useGetAllProductVariantImagesByVariant } from '@/core/api/generated/spring';
import { Image, Pencil, Save, Trash2, X } from 'lucide-react';
import {
  CombinedVariantRow,
  DraftVariantRow,
  ExistingVariantRow,
  VariantTableSelection,
} from './types';
import { VariantImagesSheet } from './VariantImagesSheet';
import {
  mapVariantImagesToSlots,
  VARIANT_IMAGE_ORDER,
  type VariantImageSlotMap,
} from '@/features/product-variant-images/utils/variant-image-slots';

/**
 * @interface VariantTableRowProps
 * @description Props for the VariantTableRow component.
 */
interface VariantTableRowProps {
  item: CombinedVariantRow;
  visibleEnumAttributes: SystemConfigAttributeDTO[];
  productName: string;
  existingSkus: Set<string>;
  onUpdateDraft: (key: string, updatedValues: Partial<DraftVariantRow>) => void;
  editingRowData: ExistingVariantRow | null;
  onEditRow: (row: ExistingVariantRow) => void;
  onUpdateEditingRow: (updatedValues: Partial<ExistingVariantRow>) => void;
  onSaveExisting: () => void;
  onCancelEdit: () => void;
  onDeleteRow: (row: ExistingVariantRow) => void;
  isViewMode?: boolean;
  selection?: VariantTableSelection;
  validationErrors?: string[];
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
  productName,
  existingSkus,
  onUpdateDraft,
  editingRowData,
  onEditRow,
  onUpdateEditingRow,
  onSaveExisting,
  onCancelEdit,
  onDeleteRow,
  isViewMode = false,
  selection,
  validationErrors = [],
}: VariantTableRowProps) {
  const isDraft = item.kind === 'draft';
  const isDuplicate = item.kind === 'duplicate';
  const { row } = item;
  const isEditing = !isDraft && !isDuplicate && editingRowData?.id === row.id;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [draftFrontImageUrl, setDraftFrontImageUrl] = useState<string | null>(null);
  const [isImageSheetOpen, setIsImageSheetOpen] = useState(false);
  const variantId = !isDraft && !isDuplicate ? (row as ExistingVariantRow).id : undefined;
  const { data: variantImages } = useGetAllProductVariantImagesByVariant(variantId ?? 0, {
    query: { enabled: !!variantId },
  });

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

  const handlePrimaryChange = (isPrimary: boolean) => {
    if (isDraft) {
      onUpdateDraft(row.key, { isPrimary });
    } else if (isEditing) {
      onUpdateEditingRow({ isPrimary });
    }
  };

  useEffect(() => {
    if (!isDraft && !isDuplicate) {
      return;
    }

    if (!row.imageFiles?.front) {
      setDraftFrontImageUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(row.imageFiles.front);
    setDraftFrontImageUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [isDraft, isDuplicate, row.imageFiles]);

  const existingImageUrl = useMemo(() => {
    if (!variantImages || variantImages.length === 0) return null;
    const slots = mapVariantImagesToSlots(variantImages);
    const frontImage = slots.front ?? variantImages[0];
    return frontImage?.thumbnailUrl || frontImage?.cdnUrl || null;
  }, [variantImages]);

  const imageUrl = draftFrontImageUrl ?? existingImageUrl;
  const draftImageFiles = useMemo<VariantImageSlotMap<File | null>>(() => {
    if (!isDraft && !isDuplicate) {
      return VARIANT_IMAGE_ORDER.reduce((acc, slot) => {
        acc[slot] = null;
        return acc;
      }, {} as VariantImageSlotMap<File | null>);
    }

    return VARIANT_IMAGE_ORDER.reduce((acc, slot) => {
      acc[slot] = row.imageFiles?.[slot] ?? null;
      return acc;
    }, {} as VariantImageSlotMap<File | null>);
  }, [isDraft, isDuplicate, row.imageFiles]);
  const handleDraftImagesSave =
    isDraft || isDuplicate
      ? (files: VariantImageSlotMap<File | null>) => onUpdateDraft(row.key, { imageFiles: files })
      : undefined;
  const canEditImages = !isViewMode && !isDuplicate;
  const isColorAttribute = (attr: SystemConfigAttributeDTO) =>
    attr.name?.toLowerCase() === 'color' || attr.label?.toLowerCase() === 'color';
  const resolveColorCode = (code?: string) => {
    const value = code?.trim();
    if (!value) return undefined;
    return /^#[0-9a-fA-F]{6}$/.test(value) ? value : undefined;
  };
  const resolveReadableTextColor = (hex: string) => {
    const value = hex.replace('#', '');
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#111827' : '#FFFFFF';
  };
  const isSelectableRow = item.kind === 'existing' && typeof row.id === 'number';
  const isSelected = selection ? (isSelectableRow ? selection.isRowSelected(item) : false) : false;

  // Validation error detection
  const hasPriceError = validationErrors.some(err => err.toLowerCase().includes('price'));
  const hasStockError = validationErrors.some(err => err.toLowerCase().includes('stock'));
  const dataColumnCount = visibleEnumAttributes.length + 6 + (isViewMode ? 0 : 1);
  const columnWidth = selection
    ? `calc((100% - 2.5rem) / ${dataColumnCount})`
    : `calc(100% / ${dataColumnCount})`;

  return (
    <>
      <TableRow
        key={item.rowKey}
        className={cn(
          'group transition-all duration-200',
          isEditing
            ? 'bg-gradient-to-r from-amber-50/60 via-orange-50/40 to-yellow-50/60 border-l-4 border-l-amber-400 shadow-sm'
            : isDuplicate
              ? 'bg-gradient-to-r from-amber-50/40 to-orange-50/30 border-l-4 border-l-amber-400 opacity-75'
              : isDraft
                ? 'bg-gradient-to-r from-blue-50/40 to-indigo-50/30 hover:from-blue-100/50 hover:to-indigo-100/40 border-l-4 border-l-blue-400 hover:shadow-md'
                : 'hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/10 hover:shadow-sm',
          {
            'bg-green-50/50 border-l-4 border-green-400':
              !isEditing && data.isPrimary,
          },
        )}
      >
        {selection && (
          <TableCell className="py-2">
            <div className="flex items-center justify-center">
              <Checkbox
                checked={isSelected}
                disabled={!isSelectableRow}
                onCheckedChange={(value) => {
                  if (!isSelectableRow) return;
                  selection.onRowToggle(item, !!value);
                }}
              />
            </div>
          </TableCell>
        )}
        {/* Primary Column */}
        <TableCell className="py-2" style={{ width: columnWidth }}>
          {isDraft || isEditing ? (
            <div className="flex items-center justify-center">
              <input
                type="radio"
                checked={!!data.isPrimary}
                onChange={() => handlePrimaryChange(true)}
                disabled={isViewMode}
                className={cn('h-4 w-4 accent-primary', isViewMode && 'opacity-50 cursor-not-allowed')}
              />
            </div>
          ) : data.isPrimary ? (
            <div className="flex items-center justify-center">
              <Badge className="bg-green-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm">
                Primary
              </Badge>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <span className="text-muted-foreground text-xs">—</span>
            </div>
          )}
        </TableCell>
        {/* Attribute Columns */}
        {visibleEnumAttributes.map((attr) => {
          const selection = row.selections.find((s) => s.attributeId === attr.id);
          const colorCode = isColorAttribute(attr)
            ? resolveColorCode(selection?.optionCode)
            : undefined;
          const badgeStyle = colorCode
            ? {
              backgroundColor: colorCode,
              borderColor: colorCode,
              color: resolveReadableTextColor(colorCode),
            }
            : undefined;

          return (
            <TableCell
              key={`${item.rowKey}-${attr.id}`}
              className="py-2"
              style={{ width: columnWidth }}
            >
              {selection ? (
                <Badge
                  variant="secondary"
                  className={`border-transparent font-medium px-2 py-0.5 text-xs shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 ${colorCode
                    ? 'bg-transparent'
                    : 'bg-gradient-to-r from-sidebar-accent/90 to-sidebar-accent text-sidebar-accent-foreground'
                    }`}
                  style={badgeStyle}
                >
                  {selection.optionLabel}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-sm font-medium">
                  —
                </span>
              )}
            </TableCell>
          );
        })}

        {/* SKU Column */}
        <TableCell className="py-2" style={{ width: columnWidth }}>
          {isDraft ? (
            <div className="space-y-1">
              <Input
                className="h-8 w-full min-w-0 border-2 border-blue-200 focus:border-blue-400 bg-blue-50/50 transition-colors text-sm"
                value={row.sku}
                onChange={(e) =>
                  onUpdateDraft(row.key, { sku: e.target.value })
                }
              />
              {existingSkus.has(row.sku) && (
                <p className="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded border border-red-200">
                  ⚠️ Duplicate SKU
                </p>
              )}
            </div>
          ) : isEditing ? (
            <Input
              className="h-8 w-full min-w-0 border-2 border-amber-200 focus:border-amber-400 bg-amber-50/50 transition-colors text-sm"
              value={data.sku}
              onChange={(e) => onUpdateEditingRow({ sku: e.target.value })}
            />
          ) : (
            <div className="flex items-center gap-2">
              <code
                className={`font-bold px-2 py-1 rounded text-sm border shadow-sm inline-block ${isDuplicate
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
        <TableCell className="py-2" style={{ width: columnWidth }}>
          {isDraft || isEditing ? (
            <div className="space-y-1">
              <Input
                className={`h-8 w-full min-w-0 border-2 transition-colors text-sm ${hasPriceError
                  ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                  : isDraft
                    ? 'border-blue-200 focus:border-blue-400 bg-blue-50/50'
                    : 'border-amber-200 focus:border-amber-400 bg-amber-50/50'
                  }`}
                type="number"
                step="0.01"
                placeholder="Price"
                value={data.price ?? ''}
                onChange={handlePriceChange}
              />
              {hasPriceError && (
                <p className="text-xs text-red-600 font-medium">
                  Price must be greater than 0
                </p>
              )}
            </div>
          ) : (
            <span className="font-semibold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200 text-sm">
              {data.price?.toFixed(2) ?? '—'}
            </span>
          )}
        </TableCell>
        <TableCell className="py-2" style={{ width: columnWidth }}>
          {isDraft || isEditing ? (
            <div className="space-y-1">
              <Input
                className={`h-8 w-full min-w-0 border-2 transition-colors text-sm ${hasStockError
                  ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                  : isDraft
                    ? 'border-blue-200 focus:border-blue-400 bg-blue-50/50'
                    : 'border-amber-200 focus:border-amber-400 bg-amber-50/50'
                  }`}
                type="number"
                min="0"
                placeholder="Quantity"
                value={data.stockQuantity ?? ''}
                onChange={handleStockChange}
              />
              {hasStockError && (
                <p className="text-xs text-red-600 font-medium">
                  Stock is required and cannot be negative
                </p>
              )}
            </div>
          ) : (
            <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200 text-sm">
              {data.stockQuantity}
            </span>
          )}
        </TableCell>

        {/* Status Column */}
        <TableCell className="py-2" style={{ width: columnWidth }}>
          {isDraft || isEditing ? (
            <Select value={data.status} onValueChange={handleStatusChange}>
              <SelectTrigger
                className={`h-8 border-2 transition-colors text-sm ${isDraft
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
              className={`font-medium px-2 py-0.5 text-xs ${data.status === ProductVariantDTOStatus.ACTIVE
                ? 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200'
                : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
                }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full mr-1 inline-block ${data.status === ProductVariantDTOStatus.ACTIVE
                  ? 'bg-green-500'
                  : 'bg-gray-500'
                  }`}
              ></div>
              {data.status === ProductVariantDTOStatus.ACTIVE
                ? 'Active'
                : 'Inactive'}
            </Badge>
          )}
        </TableCell>

        {/* Image Column */}
        <TableCell className="py-2" style={{ width: columnWidth }}>
          <div className="flex items-center justify-center">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Variant"
                className="h-10 w-10 rounded-md border object-cover"
              />
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            )}
          </div>
        </TableCell>

        {/* Actions Column - Hidden in view mode */}
        {!isViewMode && (
          <TableCell className="py-2 text-right" style={{ width: columnWidth }}>
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                type="button"
                onClick={() => setIsImageSheetOpen(true)}
                disabled={!canEditImages}
                className="h-7 w-7"
                title="Manage images"
              >
                <Image className="h-3 w-3" />
              </Button>

              {!isDraft && !isDuplicate && !isEditing && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() => onEditRow(row as ExistingVariantRow)}
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200 hover:scale-105 px-2 h-7 text-xs"
                    title="Edit variant"
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
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
                    type="button"
                    onClick={onSaveExisting}
                    className="text-muted-foreground hover:text-green-700 hover:bg-green-100 transition-all duration-200 hover:scale-105 px-2 h-7 text-xs"
                    title="Save changes"
                  >
                    <Save className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
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
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowDeleteDialog(false)}
              className="px-4"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 bg-red-600 hover:bg-red-700"
            >
              Delete Variant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <VariantImagesSheet
        open={isImageSheetOpen}
        onOpenChange={setIsImageSheetOpen}
        variantId={variantId}
        variantLabel={row.sku || 'Variant'}
        productName={productName}
        existingImages={variantImages ?? []}
        initialFiles={draftImageFiles}
        onSaveDraft={handleDraftImagesSave}
      />
    </>
  );
}
