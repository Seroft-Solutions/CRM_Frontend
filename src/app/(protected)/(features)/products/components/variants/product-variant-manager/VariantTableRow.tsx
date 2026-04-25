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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ProductVariantDTOStatus } from '@/core/api/generated/spring/schemas/ProductVariantDTOStatus';
import { SystemConfigAttributeDTO } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTO';
import { useGetAllProductVariantImagesByVariant } from '@/core/api/generated/spring';
import { Image, Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import {
  CombinedVariantRow,
  DraftVariantRow,
  ExistingVariantRow,
  VariantSelection,
  VariantTableSelection,
  VariantWarehouseOption,
} from './types';
import { VariantImagesSheet } from './VariantImagesSheet';
import {
  mapVariantImagesToSlots,
  VARIANT_IMAGE_ORDER,
  type VariantImageSlotMap,
} from '@/features/product-variant-images/utils/variant-image-slots';

const isColorSelection = (selection: VariantSelection) => {
  const label = (selection.attributeLabel ?? '').trim().toLowerCase();

  return (
    label === 'c' ||
    label === 'clr' ||
    label === 'color' ||
    label === 'colour' ||
    label.includes('color') ||
    label.includes('colour')
  );
};

const getColorSelection = (selections: VariantSelection[]) =>
  selections.find((selection) => isColorSelection(selection));

/**
 * @interface VariantTableRowProps
 * @description Props for the VariantTableRow component.
 */
interface VariantTableRowProps {
  item: CombinedVariantRow;
  allRows: CombinedVariantRow[];
  visibleEnumAttributes: SystemConfigAttributeDTO[];
  productName: string;
  existingSkus: Set<string>;
  onUpdateDraft: (key: string, updatedValues: Partial<DraftVariantRow>) => void;
  onApplyDraftImagesToVariants: (keys: string[], files: VariantImageSlotMap<File | null>) => void;
  editingRowData: ExistingVariantRow | null;
  onEditRow: (row: ExistingVariantRow) => void;
  onMarkPrimaryExisting: (row: ExistingVariantRow) => void;
  onUpdateEditingRow: (updatedValues: Partial<ExistingVariantRow>) => void;
  onSaveExisting: () => void;
  onCancelEdit: () => void;
  onDeleteRow: (row: ExistingVariantRow) => void;
  warehouses: VariantWarehouseOption[];
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
  allRows,
  visibleEnumAttributes,
  productName,
  existingSkus,
  onUpdateDraft,
  onApplyDraftImagesToVariants,
  editingRowData,
  onEditRow,
  onMarkPrimaryExisting,
  onUpdateEditingRow,
  onSaveExisting,
  onCancelEdit,
  onDeleteRow,
  warehouses,
  isViewMode = false,
  selection,
  validationErrors = [],
}: VariantTableRowProps) {
  const isDraft = item.kind === 'draft';
  const isDuplicate = item.kind === 'duplicate';
  const { row } = item;
  const isExisting = !isDraft && !isDuplicate;
  const isEditing = isExisting && editingRowData?.id === row.id;
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

  const getVariantStocks = () => data.variantStocks ?? [];
  const calculateTotalStock = (variantStocks: Array<{ stockQuantity: number }>) =>
    variantStocks.reduce((sum, variantStock) => sum + (Number(variantStock.stockQuantity) || 0), 0);
  const updateVariantStocks = (
    variantStocks: Array<{
      id?: number;
      warehouseId?: number;
      warehouseName?: string;
      stockQuantity: number;
    }>
  ) => {
    const stockQuantity = calculateTotalStock(variantStocks);

    if (isDraft) {
      onUpdateDraft(row.key, { variantStocks, stockQuantity });
    } else if (isEditing) {
      onUpdateEditingRow({ variantStocks, stockQuantity });
    }
  };

  const handleStatusChange = (v: ProductVariantDTOStatus) => {
    if (isDraft) {
      onUpdateDraft(row.key, { status: v });
    } else if (isEditing) {
      onUpdateEditingRow({ status: v });
    }
  };

  const handleWarehouseChange = (stockIndex: number, warehouseValue: string) => {
    const nextStocks = getVariantStocks().map((variantStock, index) => {
      if (index !== stockIndex) {
        return variantStock;
      }

      const selectedWarehouse =
        warehouseValue === '__none__'
          ? undefined
          : warehouses.find((warehouse) => warehouse.id === Number(warehouseValue));

      return {
        ...variantStock,
        warehouseId: selectedWarehouse?.id,
        warehouseName: selectedWarehouse?.name,
      };
    });

    updateVariantStocks(nextStocks);
  };

  const handleWarehouseStockChange = (stockIndex: number, stockValue: string) => {
    const parsedStock = Number.parseInt(stockValue, 10);
    const stockQuantity = Number.isNaN(parsedStock) ? 0 : Math.max(0, parsedStock);
    const nextStocks = getVariantStocks().map((variantStock, index) => {
      if (index !== stockIndex) {
        return variantStock;
      }

      return {
        ...variantStock,
        stockQuantity,
      };
    });

    updateVariantStocks(nextStocks);
  };

  const handleAddWarehouseStock = () => {
    const selectedWarehouseIds = new Set(
      getVariantStocks()
        .map((variantStock) => variantStock.warehouseId)
        .filter((warehouseId): warehouseId is number => typeof warehouseId === 'number')
    );
    const firstAvailableWarehouse = warehouses.find(
      (warehouse) => !selectedWarehouseIds.has(warehouse.id)
    );

    if (!firstAvailableWarehouse) {
      return;
    }

    const nextStocks = [
      ...getVariantStocks(),
      {
        warehouseId: firstAvailableWarehouse.id,
        warehouseName: firstAvailableWarehouse.name,
        stockQuantity: 0,
      },
    ];

    updateVariantStocks(nextStocks);
  };

  const handleRemoveWarehouseStock = (stockIndex: number) => {
    const currentStocks = getVariantStocks();

    if (currentStocks.length <= 1) {
      return;
    }

    const nextStocks = currentStocks.filter((_, index) => index !== stockIndex);

    updateVariantStocks(nextStocks);
  };

  const resolveWarehouseLabel = (warehouseId?: number, warehouseName?: string) => {
    if (warehouseName) {
      return warehouseName;
    }
    if (typeof warehouseId !== 'number') {
      return undefined;
    }

    const selectedWarehouse =
      warehouses.find((warehouse) => warehouse.id === warehouseId) ?? undefined;

    return selectedWarehouse?.name;
  };

  const selectedWarehouseIds = new Set(
    getVariantStocks()
      .map((variantStock) => variantStock.warehouseId)
      .filter((warehouseId): warehouseId is number => typeof warehouseId === 'number')
  );
  const hasSingleWarehouse = warehouses.length === 1;
  const singleWarehouse = hasSingleWarehouse ? warehouses[0] : undefined;
  const canAddMoreWarehouseRows = warehouses.some(
    (warehouse) => !selectedWarehouseIds.has(warehouse.id)
  );
  const getAvailableWarehousesForRow = (stockIndex: number) => {
    const currentWarehouseId = getVariantStocks()[stockIndex]?.warehouseId;

    return warehouses.filter((warehouse) => {
      if (warehouse.id === currentWarehouseId) {
        return true;
      }

      return !selectedWarehouseIds.has(warehouse.id);
    });
  };

  useEffect(() => {
    if (!singleWarehouse || (!isDraft && !isEditing)) {
      return;
    }

    const currentStocks = getVariantStocks();
    const totalStock = calculateTotalStock(currentStocks);
    const firstStock = currentStocks[0];
    const firstStockQuantity = Number(firstStock?.stockQuantity) || 0;
    const requiresNormalization =
      currentStocks.length !== 1 ||
      firstStock?.warehouseId !== singleWarehouse.id ||
      firstStock?.warehouseName !== singleWarehouse.name ||
      firstStockQuantity !== totalStock;

    if (!requiresNormalization) {
      return;
    }

    const normalizedStocks = [
      {
        id: firstStock?.id,
        warehouseId: singleWarehouse.id,
        warehouseName: singleWarehouse.name,
        stockQuantity: totalStock,
      },
    ];

    updateVariantStocks(normalizedStocks);
  }, [singleWarehouse, isDraft, isEditing, data.variantStocks]);

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
      return VARIANT_IMAGE_ORDER.reduce(
        (acc, slot) => {
          acc[slot] = null;

          return acc;
        },
        {} as VariantImageSlotMap<File | null>
      );
    }

    return VARIANT_IMAGE_ORDER.reduce(
      (acc, slot) => {
        acc[slot] = row.imageFiles?.[slot] ?? null;

        return acc;
      },
      {} as VariantImageSlotMap<File | null>
    );
  }, [isDraft, isDuplicate, row.imageFiles]);
  const handleDraftImagesSave =
    isDraft || isDuplicate
      ? (files: VariantImageSlotMap<File | null>) => onUpdateDraft(row.key, { imageFiles: files })
      : undefined;
  const sourceColorSelection = useMemo(() => getColorSelection(row.selections), [row.selections]);
  const sameColorDraftTargets = useMemo(() => {
    if (!sourceColorSelection) {
      return [];
    }

    const sourceOptionId = sourceColorSelection.optionId;

    if (!sourceOptionId) {
      return [];
    }

    return allRows
      .filter(
        (candidate) =>
          candidate.rowKey !== item.rowKey &&
          (candidate.kind === 'draft' || candidate.kind === 'duplicate')
      )
      .map((candidate) => candidate.row)
      .filter((candidate) => {
        const colorSelection = getColorSelection(candidate.selections);

        return colorSelection?.optionId === sourceOptionId;
      })
      .map((candidate) => ({
        key: candidate.key,
        label: candidate.sku || sourceColorSelection.optionLabel,
      }));
  }, [allRows, item.rowKey, sourceColorSelection]);
  const sameColorExistingTargets = useMemo(() => {
    if (!sourceColorSelection || !isExisting) {
      return [];
    }

    const sourceOptionId = sourceColorSelection.optionId;

    if (!sourceOptionId) {
      return [];
    }

    return allRows
      .filter((candidate) => candidate.rowKey !== item.rowKey && candidate.kind === 'existing')
      .map((candidate) => candidate.row)
      .filter((candidate) => {
        const colorSelection = getColorSelection(candidate.selections);

        return colorSelection?.optionId === sourceOptionId;
      })
      .map((candidate) => ({
        id: candidate.id,
        label: candidate.sku || sourceColorSelection.optionLabel,
      }));
  }, [allRows, isExisting, item.rowKey, sourceColorSelection]);
  const handleCopyDraftImagesToSameColorVariants =
    sameColorDraftTargets.length > 0
      ? (files: VariantImageSlotMap<File | null>) =>
          onApplyDraftImagesToVariants(
            sameColorDraftTargets.map((target) => target.key),
            files
          )
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
  const hasPriceError = validationErrors.some((err) => err.toLowerCase().includes('price'));
  const hasStockError = validationErrors.some((err) => err.toLowerCase().includes('stock'));
  const hasWarehouseError = validationErrors.some((err) => err.toLowerCase().includes('warehouse'));
  const dataColumnCount = visibleEnumAttributes.length + 7 + (isViewMode ? 0 : 1);
  const warehouseColumnWidth = '280px';
  const nonWarehouseColumnCount = dataColumnCount - 1;
  const columnWidth = selection
    ? `calc((100% - 2.5rem - ${warehouseColumnWidth}) / ${nonWarehouseColumnCount})`
    : `calc((100% - ${warehouseColumnWidth}) / ${nonWarehouseColumnCount})`;

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
            'bg-green-50/50 border-l-4 border-green-400': !isEditing && data.isPrimary,
          }
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
                className={cn(
                  'h-4 w-4 accent-primary',
                  isViewMode && 'opacity-50 cursor-not-allowed'
                )}
              />
            </div>
          ) : isExisting && !isViewMode ? (
            <div className="flex items-center justify-center">
              <input
                type="radio"
                checked={!!data.isPrimary}
                onChange={() => onMarkPrimaryExisting(row as ExistingVariantRow)}
                disabled={!!data.isPrimary}
                className={cn('h-4 w-4 accent-primary', !!data.isPrimary && 'cursor-default')}
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
                  className={`border-transparent font-medium px-2 py-0.5 text-xs shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 ${
                    colorCode
                      ? 'bg-transparent'
                      : 'bg-gradient-to-r from-sidebar-accent/90 to-sidebar-accent text-sidebar-accent-foreground'
                  }`}
                  style={badgeStyle}
                >
                  {selection.optionLabel}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-sm font-medium">—</span>
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
              className="h-8 w-full min-w-0 border-2 border-amber-200 focus:border-amber-400 bg-amber-50/50 transition-colors text-sm"
              value={data.sku}
              onChange={(e) => onUpdateEditingRow({ sku: e.target.value })}
            />
          ) : (
            <div className="flex items-center gap-2 max-w-full">
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <code
                      className={`font-bold px-2 py-1 rounded text-sm border shadow-sm inline-block truncate max-w-[150px] ${
                        isDuplicate
                          ? 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-300'
                          : 'bg-gradient-to-r from-primary/10 to-primary/20 text-primary border-primary/20'
                      }`}
                    >
                      {row.sku}
                      {isDuplicate && <span className="ml-1 text-xs">⚠️</span>}
                    </code>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-mono font-bold">{row.sku}</p>
                    {isDuplicate && <p className="text-xs text-amber-500 mt-1">Duplicate SKU</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </TableCell>

        {/* Link ID Column */}
        <TableCell className="py-2" style={{ width: columnWidth }}>
          {!isDraft && !isDuplicate && data.linkId ? (
            <code className="inline-block rounded border bg-slate-50 px-2 py-1 font-mono text-sm text-slate-700">
              {data.linkId}
            </code>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </TableCell>

        {/* Price & Stock Columns */}
        <TableCell className="py-2" style={{ width: columnWidth }}>
          {isDraft || isEditing ? (
            <div className="space-y-1">
              <Input
                className={`h-8 w-full min-w-0 border-2 transition-colors text-sm ${
                  hasPriceError
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
                <p className="text-xs text-red-600 font-medium">Price must be greater than 0</p>
              )}
            </div>
          ) : (
            <span className="font-semibold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200 text-sm">
              {data.price?.toFixed(2) ?? '—'}
            </span>
          )}
        </TableCell>
        <TableCell className="py-2" style={{ width: columnWidth }}>
          <span
            className={cn(
              'font-semibold px-2 py-1 rounded border text-sm inline-flex',
              hasStockError && (isDraft || isEditing)
                ? 'text-red-700 bg-red-50 border-red-300'
                : 'text-blue-700 bg-blue-50 border-blue-200'
            )}
          >
            Stock: {data.stockQuantity}
          </span>
          {hasStockError && (isDraft || isEditing) && (
            <p className="text-xs text-red-600 font-medium mt-1">
              Please enter valid stock for each warehouse
            </p>
          )}
        </TableCell>

        {/* Warehouse Column */}
        <TableCell
          className="py-2 overflow-hidden"
          style={{ width: warehouseColumnWidth, minWidth: warehouseColumnWidth }}
        >
          {isDraft || isEditing ? (
            <div className="space-y-2 min-w-[260px]">
              {getVariantStocks().map((variantStock, stockIndex) => (
                <div
                  key={`${item.rowKey}-stock-${stockIndex}`}
                  className="grid grid-cols-[minmax(0,1fr)_5rem_auto] items-center gap-2"
                >
                  {hasSingleWarehouse ? (
                    <div
                      className={cn(
                        'h-8 w-full rounded-md border-2 px-3 text-sm font-medium flex items-center truncate',
                        isDraft
                          ? 'border-blue-200 bg-blue-50/50'
                          : 'border-amber-200 bg-amber-50/50'
                      )}
                      title={
                        singleWarehouse?.code
                          ? `${singleWarehouse.name} (${singleWarehouse.code})`
                          : singleWarehouse?.name
                      }
                    >
                      {singleWarehouse?.name}
                      {singleWarehouse?.code ? ` (${singleWarehouse.code})` : ''}
                    </div>
                  ) : (
                    (() => {
                      const availableWarehouses = getAvailableWarehousesForRow(stockIndex);

                      return (
                        <Select
                          value={
                            variantStock.warehouseId ? String(variantStock.warehouseId) : '__none__'
                          }
                          onValueChange={(warehouseValue) =>
                            handleWarehouseChange(stockIndex, warehouseValue)
                          }
                        >
                          <SelectTrigger
                            className={`h-8 w-full border-2 transition-colors text-sm [&>span]:truncate ${
                              hasWarehouseError
                                ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                                : isDraft
                                  ? 'border-blue-200 focus:border-blue-400 bg-blue-50/50'
                                  : 'border-amber-200 focus:border-amber-400 bg-amber-50/50'
                            }`}
                          >
                            <SelectValue placeholder="Select warehouse" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">Select warehouse</SelectItem>
                            {availableWarehouses.map((warehouse) => (
                              <SelectItem key={warehouse.id} value={String(warehouse.id)}>
                                {warehouse.name}
                                {warehouse.code ? ` (${warehouse.code})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      );
                    })()
                  )}
                  <Input
                    className={`h-8 w-full border-2 transition-colors text-sm ${
                      hasStockError
                        ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                        : isDraft
                          ? 'border-blue-200 focus:border-blue-400 bg-blue-50/50'
                          : 'border-amber-200 focus:border-amber-400 bg-amber-50/50'
                    }`}
                    type="number"
                    min="0"
                    placeholder="Qty"
                    value={variantStock.stockQuantity}
                    onChange={(event) => handleWarehouseStockChange(stockIndex, event.target.value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveWarehouseStock(stockIndex)}
                    disabled={getVariantStocks().length <= 1}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {!hasSingleWarehouse && (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="h-7 w-full justify-start text-xs"
                  onClick={handleAddWarehouseStock}
                  disabled={!canAddMoreWarehouseRows}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {canAddMoreWarehouseRows ? 'Add warehouse' : 'All warehouses added'}
                </Button>
              )}
              {hasWarehouseError && (
                <p className="text-xs text-red-600 font-medium">
                  {hasSingleWarehouse
                    ? 'Add at least one warehouse stock row'
                    : 'Add at least one warehouse and select a warehouse for each row'}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {(data.variantStocks ?? []).length > 0 ? (
                (data.variantStocks ?? []).map((variantStock, stockIndex) => (
                  <span
                    key={`${item.rowKey}-warehouse-${stockIndex}`}
                    className="font-medium text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200 text-xs truncate"
                  >
                    {`${
                      resolveWarehouseLabel(variantStock.warehouseId, variantStock.warehouseName) ??
                      '—'
                    }: ${variantStock.stockQuantity}`}
                  </span>
                ))
              ) : (
                <span className="font-medium text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200 text-sm">
                  —
                </span>
              )}
            </div>
          )}
        </TableCell>

        {/* Status Column */}
        <TableCell className="py-2 overflow-hidden" style={{ width: columnWidth }}>
          {isDraft || isEditing ? (
            <Select value={data.status} onValueChange={handleStatusChange}>
              <SelectTrigger
                className={`h-8 w-full min-w-0 border-2 transition-colors text-sm [&>span]:truncate ${
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
        sameColorLabel={sourceColorSelection?.optionLabel}
        sameColorDraftTargets={sameColorDraftTargets}
        sameColorExistingTargets={sameColorExistingTargets}
        onCopyDraftImagesToVariants={handleCopyDraftImagesToSameColorVariants}
      />
    </>
  );
}
