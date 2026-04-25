'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronDown, Minus, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  OrderRecord,
  getOrderStatusTransitionError,
  getOrderStatusCode,
  getPaymentStatusCode,
  getSelectableOrderStatuses,
  getShippingMethodCode,
  paymentStatusOptions,
  shippingMethodOptions,
} from '../../data/order-data';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  useCreateOrder,
  useUpdateOrder,
} from '@/core/api/generated/spring/endpoints/order-resource/order-resource.gen';
import { useGetCustomer } from '@/core/api/generated/spring/endpoints/customer-resource/customer-resource.gen';
import type { CustomerDTO, OrderDTO, ProductVariantDTO } from '@/core/api/generated/spring/schemas';
import {
  useCreateOrderDetail,
  useDeleteOrderDetail,
  useUpdateOrderDetail,
} from '@/core/api/generated/spring/endpoints/order-detail-resource/order-detail-resource.gen';
import { useGetAllProductVariants } from '@/core/api/generated/spring/endpoints/product-variant-resource/product-variant-resource.gen';
import {
  useCreateOrderAddressDetail,
  useUpdateOrderAddressDetail,
} from '@/core/api/generated/spring/endpoints/order-address-detail-resource/order-address-detail-resource.gen';
import { useCreateOrderHistory } from '@/core/api/generated/spring/endpoints/order-history-resource/order-history-resource.gen';
import { useGetAllSystemConfigAttributeOptions } from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';
import {
  useCreateOrderShippingDetail,
  useUpdateOrderShippingDetail,
} from '@/core/api/order-shipping-detail';
import { SaveDraftDialog } from '@/components/form-drafts';
import { useCrossFormNavigation } from '@/context/cross-form-navigation';
import { getDiscountByCode } from '../../../discounts/actions/discount-api';
import type { IDiscount } from '../../../discounts/types/discount';
import type {
  AddressFieldsForm,
  ItemErrors,
  OrderAddressForm,
  OrderFormErrors,
  OrderFormState,
  OrderItemForm,
  WarehouseStockEntry,
} from './order-form-types';
import { OrderFormAddress } from './order-form-address';
import { OrderFormFooter } from './order-form-footer';
import { OrderFormFields } from './order-form-fields';
import { OrderFormItems } from './order-form-items';
import { FieldError } from './order-form-field-error';
import { getOrderItemBillingBreakdown } from './order-item-stock';
import { useCallId } from './order-form-provider';
import { cn } from '@/lib/utils';

export interface OrderFormProps {
  initialOrder?: OrderRecord;
  addressExists?: boolean;
  shippingExists?: boolean;
  onSubmitSuccess?: () => void;
  callId?: number;
  customerId?: number;
}

const getOrderStatusErrorDescription = (error: unknown, fallback: string) => {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const maybeAxiosError = error as {
      response?: {
        data?: {
          detail?: string;
          title?: string;
          message?: string;
        };
      };
    };

    return (
      maybeAxiosError.response?.data?.detail ||
      maybeAxiosError.response?.data?.title ||
      maybeAxiosError.response?.data?.message ||
      fallback
    );
  }

  return fallback;
};

const taxRateOptions = ['6', '12', '18'] as const;

const emptyOrderItem = (itemType: OrderItemForm['itemType'] = 'product'): OrderItemForm => ({
  itemType,
  itemStatus: '',
  quantity: '',
  itemPrice: '',
  itemTaxAmount: '',
  itemComment: '',
});

const calculateItemsTotal = (items: OrderItemForm[]) =>
  items.reduce((sum, item) => {
    const breakdown = getOrderItemBillingBreakdown(item);
    const qty = breakdown.billableQuantity;
    const price = Number.parseFloat(item.itemPrice) || 0;
    const tax = Number.parseFloat(item.itemTaxAmount) || 0;

    return sum + Math.max(qty * price + tax, 0);
  }, 0);

const calculateItemTotal = (item: OrderItemForm) => {
  const breakdown = getOrderItemBillingBreakdown(item);
  const qty = breakdown.billableQuantity;
  const price = Number.parseFloat(item.itemPrice) || 0;
  const tax = Number.parseFloat(item.itemTaxAmount) || 0;

  return Math.max(qty * price + tax, 0);
};

const hasItemData = (item: OrderItemForm) => {
  const hasText = (value?: string) => Boolean(value && value.trim() !== '');

  return Boolean(
    item.productId ||
      item.variantId ||
      item.productCatalogId ||
      hasText(item.quantity) ||
      hasText(item.itemPrice) ||
      hasText(item.itemTaxAmount) ||
      hasText(item.itemComment)
  );
};

const parseItemStatusValue = (value?: string) => {
  if (!value) return '';
  const match = value.match(/\d+/);

  return match ? match[0] : '';
};

const formatStockQuantity = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '0';
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2);
};

type OptionLabelsById = Map<number, string>;

function getSelectionDisplayValue(
  selection: NonNullable<ProductVariantDTO['selections']>[number],
  optionLabelsById?: OptionLabelsById
) {
  const optionId = selection.option?.id;
  const resolvedOptionLabel =
    typeof optionId === 'number' ? optionLabelsById?.get(optionId) : undefined;

  return (
    selection.option?.label ||
    resolvedOptionLabel ||
    selection.rawValue ||
    selection.option?.code ||
    ''
  );
}

function getVariantDisplayParts(
  variant: ProductVariantDTO,
  index: number,
  optionLabelsById?: OptionLabelsById
) {
  const variantLabel = variant.sku || `Variant ${index + 1}`;
  const selectionValues = (variant.selections ?? [])
    .map((selection) => getSelectionDisplayValue(selection, optionLabelsById))
    .filter((value): value is string => Boolean(value));
  const [color = selectionValues[0] ?? variantLabel, size = selectionValues[1] ?? '-'] =
    selectionValues.length > 0
      ? selectionValues
      : variantLabel
          .split(/[|,/]/)
          .map((part) => part.trim())
          .filter(Boolean);

  return { color, size, label: variantLabel };
}

function VariantWarehousePanel({
  selectedItem,
  selectedItemIndex,
  items,
  onToggleWarehouseVariant,
  onAdjustItemQuantity,
}: {
  selectedItem?: OrderItemForm;
  selectedItemIndex: number | null;
  items: OrderItemForm[];
  onToggleWarehouseVariant: (
    variant: ProductVariantDTO,
    stock: NonNullable<ProductVariantDTO['variantStocks']>[number],
    checked: boolean
  ) => void;
  onAdjustItemQuantity: (itemIndex: number, delta: number) => void;
}) {
  const selectedProductId =
    selectedItem?.itemType === 'product' ? selectedItem.productId : undefined;
  const { data: variantsData = [], isFetching } = useGetAllProductVariants(
    {
      'productId.equals': selectedProductId,
      'status.equals': 'ACTIVE',
      size: 1000,
    },
    {
      query: {
        enabled: Boolean(selectedProductId),
      },
    }
  );
  const variants = variantsData as ProductVariantDTO[];
  const optionIdsMissingLabels = useMemo(
    () =>
      Array.from(
        new Set(
          variants
            .flatMap((variant) => variant.selections ?? [])
            .map((selection) => {
              const optionId = selection.option?.id;

              if (typeof optionId !== 'number' || selection.option?.label) {
                return null;
              }

              return optionId;
            })
            .filter((optionId): optionId is number => typeof optionId === 'number')
        )
      ),
    [variants]
  );
  const { data: optionLabelOptions = [] } = useGetAllSystemConfigAttributeOptions(
    optionIdsMissingLabels.length > 0
      ? {
          'id.in': optionIdsMissingLabels,
          size: optionIdsMissingLabels.length,
        }
      : undefined,
    {
      query: {
        enabled: optionIdsMissingLabels.length > 0,
        staleTime: 60_000,
      },
    }
  );
  const optionLabelsById = useMemo(
    () =>
      new Map(
        optionLabelOptions
          .filter((option) => typeof option.id === 'number' && Boolean(option.label))
          .map((option) => [option.id!, option.label] as const)
      ),
    [optionLabelOptions]
  );
  const selectedProductItems = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.itemType === 'product' && item.productId === selectedProductId)
    .filter(({ item }) => typeof item.variantId === 'number');
  const getItemParamParts = (item: OrderItemForm) => {
    const variantIndex = variants.findIndex((variant) => variant.id === item.variantId);
    const variant = variantIndex >= 0 ? variants[variantIndex] : undefined;

    if (variant) {
      const { color, size } = getVariantDisplayParts(variant, variantIndex, optionLabelsById);

      return { color, size };
    }

    const [color = item.sku || '-', size = '-'] = (item.variantAttributes || '')
      .replace(/^Variant:\s*/, '')
      .split('/')
      .map((part) => part.trim())
      .filter(Boolean);

    return { color, size };
  };
  const isWarehouseVariantSelected = (
    variant: ProductVariantDTO,
    stock: NonNullable<ProductVariantDTO['variantStocks']>[number]
  ) =>
    selectedProductItems.some(
      ({ item }) => item.variantId === variant.id && item.warehouseId === stock.warehouse?.id
    );
  const warehouses = variants.reduce<
    Map<
      string,
      {
        title: string;
        rows: Array<{
          key: string;
          variant: ProductVariantDTO;
          stock: NonNullable<ProductVariantDTO['variantStocks']>[number];
          color: string;
          size: string;
          quantity: number;
        }>;
      }
    >
  >((accumulator, variant, variantIndex) => {
    const { color, size } = getVariantDisplayParts(variant, variantIndex, optionLabelsById);
    const stocks = variant.variantStocks ?? [];

    stocks.forEach((stock, stockIndex) => {
      const warehouseName =
        stock.warehouse?.name || `Warehouse ${stock.warehouse?.id ?? stockIndex + 1}`;
      const warehouseKey = `${stock.warehouse?.id ?? warehouseName}`;
      const warehouse = accumulator.get(warehouseKey) ?? {
        title: warehouseName,
        rows: [],
      };

      warehouse.rows.push({
        key: `${variant.id ?? variantIndex}-${warehouseKey}-${stockIndex}`,
        variant,
        stock,
        color,
        size,
        quantity: stock.salesStockQuantity ?? stock.stockQuantity ?? 0,
      });
      accumulator.set(warehouseKey, warehouse);
    });

    return accumulator;
  }, new Map());

  const warehouseTables = Array.from(warehouses.values());
  const stockGridClass =
    warehouseTables.length <= 1
      ? 'md:grid-cols-[1fr_1fr]'
      : warehouseTables.length === 2
        ? 'md:grid-cols-[1fr_1fr_1fr]'
        : 'md:grid-cols-[0.9fr_repeat(3,minmax(0,1fr))]';

  if (!selectedProductId) {
    return (
      <div className="overflow-hidden border border-slate-400 bg-white shadow-sm">
        <div className="grid min-h-[520px] grid-cols-1 divide-y divide-slate-400 md:grid-cols-[1fr_1fr_1fr] md:divide-x md:divide-y-0">
          <LegacyStockTable
            title="Item Params"
            titleClassName="bg-orange-500 text-white"
            columns={['Color', 'Size', 'Qty', 'Warehouse']}
            emptyMessage="Select a product row"
            rows={[]}
          />
          <LegacyStockTable
            title="Warehouse Stock"
            titleClassName="bg-blue-900 text-white"
            columns={['Color', 'Size', 'Qty']}
            emptyMessage="No selected product"
            rows={[]}
          />
          <LegacyStockTable
            title="Warehouse Stock"
            titleClassName="bg-teal-700 text-white"
            columns={['Color', 'Size', 'Qty']}
            emptyMessage="No selected product"
            rows={[]}
          />
        </div>
      </div>
    );
  }

  if (isFetching && variants.length === 0) {
    return (
      <div className="border border-slate-400 bg-white p-4 text-xs text-slate-600">
        Loading variants for selected row {selectedItemIndex !== null ? selectedItemIndex + 1 : ''}
        ...
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-slate-400 bg-white shadow-sm">
      <div
        className={`grid min-h-[520px] grid-cols-1 divide-y divide-slate-400 ${stockGridClass} md:divide-x md:divide-y-0`}
      >
        <LegacyStockTable
          title="Item Params"
          titleClassName="bg-orange-500 text-white"
          columns={['Color', 'Size', 'Qty', 'Warehouse']}
          emptyMessage="Select warehouse variants"
          rows={selectedProductItems.map(({ item, index }) => {
            const { color, size } = getItemParamParts(item);

            return [
              color,
              size,
              <QuantityStepper
                key={`qty-${index}`}
                quantity={Number.parseInt(item.quantity, 10) || 0}
                onDecrease={() => onAdjustItemQuantity(index, -1)}
                onIncrease={() => onAdjustItemQuantity(index, 1)}
              />,
              item.warehouseName || item.warehouseCode || '-',
            ];
          })}
        />
        {warehouseTables.length === 0 ? (
          <LegacyStockTable
            title="Warehouse Stock"
            titleClassName="bg-blue-900 text-white"
            columns={['Color', 'Size', 'Qty']}
            emptyMessage="No warehouse stock"
            rows={[]}
          />
        ) : (
          warehouseTables.map((warehouse, warehouseIndex) => (
            <LegacyStockTable
              key={warehouse.title}
              title={warehouse.title}
              titleClassName={
                warehouseIndex % 2 === 0 ? 'bg-blue-900 text-white' : 'bg-teal-700 text-white'
              }
              columns={['Color', 'Size', 'Qty']}
              emptyMessage="No warehouse stock"
              rows={warehouse.rows.map((row) => [
                row.color,
                row.size,
                formatStockQuantity(row.quantity),
              ])}
              rowClassName={(rowIndex) => {
                const row = warehouse.rows[rowIndex];

                return isWarehouseVariantSelected(row.variant, row.stock)
                  ? 'bg-orange-100 text-blue-950'
                  : undefined;
              }}
              onRowClick={(rowIndex) => {
                const row = warehouse.rows[rowIndex];
                const selected = isWarehouseVariantSelected(row.variant, row.stock);

                onToggleWarehouseVariant(row.variant, row.stock, !selected);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function QuantityStepper({
  quantity,
  onDecrease,
  onIncrease,
}: {
  quantity: number;
  onDecrease: () => void;
  onIncrease: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDecrease();
        }}
        className="inline-flex h-5 w-5 items-center justify-center border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
        disabled={quantity <= 0}
        aria-label="Decrease quantity"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="min-w-5 text-center font-semibold">{quantity}</span>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onIncrease();
        }}
        className="inline-flex h-5 w-5 items-center justify-center border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
        aria-label="Increase quantity"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

function LegacyStockTable({
  title,
  titleClassName,
  columns,
  rows,
  emptyMessage,
  highlightNegative = false,
  onRowClick,
  rowClassName,
}: {
  title: string;
  titleClassName: string;
  columns: string[];
  rows: Array<Array<ReactNode>>;
  emptyMessage: string;
  highlightNegative?: boolean;
  onRowClick?: (rowIndex: number) => void;
  rowClassName?: (rowIndex: number) => string | undefined;
}) {
  return (
    <div className="min-w-0 bg-white">
      <div className={`px-2 py-1 text-center text-xs font-bold ${titleClassName}`}>{title}</div>
      <table className="w-full table-fixed border-collapse text-[11px] leading-tight">
        <thead>
          <tr className="bg-slate-100">
            {columns.map((column) => (
              <th key={column} className="border border-slate-300 px-1 py-0.5 text-left font-bold">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-2 py-3 text-slate-500" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => {
              const lastCell = row[row.length - 1];
              const quantity =
                typeof lastCell === 'number' || typeof lastCell === 'string' ? Number(lastCell) : 0;
              const shouldHighlight = highlightNegative && quantity < 0;

              return (
                <tr
                  key={`${title}-${rowIndex}`}
                  onClick={() => onRowClick?.(rowIndex)}
                  className={cn(
                    shouldHighlight ? 'bg-red-600 font-bold text-white' : 'text-blue-900',
                    rowClassName?.(rowIndex),
                    onRowClick && 'cursor-pointer hover:bg-blue-50'
                  )}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={`${title}-${rowIndex}-${cellIndex}`}
                      className="border border-slate-300 px-1 py-0.5"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export function OrderFormContent({
  initialOrder,
  addressExists,
  shippingExists,
  onSubmitSuccess,
  customerId,
}: OrderFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const callId = useCallId();
  const { registerDraftCheck, unregisterDraftCheck } = useCrossFormNavigation();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<OrderFormErrors>({});
  const [showEmptyCartDialog, setShowEmptyCartDialog] = useState(false);
  const [showBackOrderResolutionDialog, setShowBackOrderResolutionDialog] = useState(false);
  const [backOrderResolutionPrompted, setBackOrderResolutionPrompted] = useState(false);
  const [backOrderResolutionCandidates, setBackOrderResolutionCandidates] = useState<
    {
      index: number;
      name: string;
      fulfillableQuantity: number;
      existingBackOrderQuantity: number;
    }[]
  >([]);
  const [showItemsBreakdown, setShowItemsBreakdown] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const isEditing = Boolean(initialOrder?.orderId);
  const [formSessionId] = useState(() => {
    const fallbackId = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    if (typeof window === 'undefined') {
      return fallbackId;
    }

    const sessionKey = `orderFormSession:${initialOrder?.orderId ?? 'new'}`;
    const existingSession = sessionStorage.getItem(sessionKey);

    if (existingSession) {
      return existingSession;
    }

    sessionStorage.setItem(sessionKey, fallbackId);

    return fallbackId;
  });
  const formStateStorageKey = `orderFormState:${formSessionId}`;

  const { mutateAsync: createOrder } = useCreateOrder();
  const { mutateAsync: updateOrder } = useUpdateOrder();
  const { mutateAsync: createOrderDetail } = useCreateOrderDetail();
  const { mutateAsync: updateOrderDetail } = useUpdateOrderDetail();
  const { mutateAsync: deleteOrderDetail } = useDeleteOrderDetail();
  const { mutateAsync: createOrderAddressDetail } = useCreateOrderAddressDetail();
  const { mutateAsync: updateOrderAddressDetail } = useUpdateOrderAddressDetail();
  const { mutateAsync: createOrderShippingDetail } = useCreateOrderShippingDetail();
  const { mutateAsync: updateOrderShippingDetail } = useUpdateOrderShippingDetail();
  const { mutateAsync: createOrderHistory } = useCreateOrderHistory();

  const defaultState: OrderFormState = useMemo(() => {
    return {
      orderStatus: initialOrder?.orderStatus || 'Created',
      paymentStatus: initialOrder?.paymentStatus || 'Pending',
      orderBaseAmount: initialOrder ? initialOrder.orderBaseAmount.toString() : '',
      shippingAmount: initialOrder ? initialOrder.shipping.shippingAmount.toString() : '',
      orderTaxRate:
        typeof initialOrder?.orderTaxRate === 'number' ? initialOrder.orderTaxRate.toString() : '',
      customerId: initialOrder?.customer?.id
        ? String(initialOrder.customer.id)
        : customerId
          ? String(customerId)
          : '',
      shippingMethod: initialOrder?.shipping.shippingMethod || '',
      shippingId: initialOrder?.shipping.shippingId || '',
      discountCode: initialOrder?.discountCode || '',
      orderComment: '',
    };
  }, [customerId, initialOrder]);

  const [formState, setFormState] = useState<OrderFormState>(defaultState);
  const [discountData, setDiscountData] = useState<IDiscount | null>(null);
  const [useCustomTaxRate, setUseCustomTaxRate] = useState(() => {
    const rate = defaultState.orderTaxRate.trim();

    return rate !== '' && !taxRateOptions.includes(rate as (typeof taxRateOptions)[number]);
  });
  const [shippingEditable, setShippingEditable] = useState(false);
  const [items, setItems] = useState<OrderItemForm[]>(() => {
    if (!initialOrder?.items?.length) return [];

    return initialOrder.items.map((item) => ({
      id: item.orderDetailId || undefined,
      itemType: item.productCatalogId ? 'catalog' : 'product',
      productId: item.productId || undefined,
      initialProductId: item.productId || undefined,
      variantId: item.variantId || undefined,
      initialVariantId: item.variantId || undefined,
      productCatalogId: item.productCatalogId || undefined,
      existingQuantity: Math.max(item.quantity || 0, 0),
      existingBackOrderQuantity: Math.max(item.backOrderQuantity || 0, 0),
      productName: item.productName || undefined,
      sku: item.sku || undefined,
      variantAttributes: item.variantAttributes || undefined,
      itemStatus: item.itemStatusCode?.toString() || parseItemStatusValue(item.itemStatus),
      quantity: Math.max((item.quantity || 0) + (item.backOrderQuantity || 0), 0).toString(),
      itemPrice: item.itemPrice ? item.itemPrice.toString() : '',
      itemTaxAmount: item.itemTaxAmount ? item.itemTaxAmount.toString() : '',
      itemComment: item.itemComment || '',
    }));
  });
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(() =>
    initialOrder?.items?.length ? 0 : null
  );
  const [removedItemIds, setRemovedItemIds] = useState<number[]>([]);
  const [address, setAddress] = useState<OrderAddressForm>(() => {
    const initial = initialOrder?.address;

    return {
      shipTo: {
        firstName: initial?.shipTo?.firstName || '',
        middleName: initial?.shipTo?.middleName || '',
        lastName: initial?.shipTo?.lastName || '',
        addrLine1: initial?.shipTo?.addrLine1 || '',
        addrLine2: initial?.shipTo?.addrLine2 || '',
        city: initial?.shipTo?.city || '',
        state: initial?.shipTo?.state || '',
        zipcode: initial?.shipTo?.zipcode || '',
        country: initial?.shipTo?.country || '',
        contact: initial?.shipTo?.phone || '',
      },
      billTo: {
        firstName: initial?.billTo?.firstName || '',
        middleName: initial?.billTo?.middleName || '',
        lastName: initial?.billTo?.lastName || '',
        addrLine1: initial?.billTo?.addrLine1 || '',
        addrLine2: initial?.billTo?.addrLine2 || '',
        city: initial?.billTo?.city || '',
        state: initial?.billTo?.state || '',
        zipcode: initial?.billTo?.zipcode || '',
        country: initial?.billTo?.country || '',
        contact: initial?.billTo?.phone || '',
      },
      billToSameFlag: Boolean(initial?.billToSameAsShip),
    };
  });
  const hasAddressValues = (fields: AddressFieldsForm) =>
    Object.values(fields).some((value) => value.trim() !== '');
  const hasInitialBillToRef = useRef(
    hasAddressValues(address.billTo) || (address.billToSameFlag && hasAddressValues(address.shipTo))
  );
  const hasInitialShipToRef = useRef(hasAddressValues(address.shipTo));
  const lastCustomerIdRef = useRef<number | null>(null);
  const discountCodeRef = useRef<string>('');
  const hasUnsavedChanges =
    !isEditing &&
    (JSON.stringify(formState) !== JSON.stringify(defaultState) ||
      items.some(hasItemData) ||
      removedItemIds.length > 0 ||
      hasAddressValues(address.shipTo) ||
      hasAddressValues(address.billTo) ||
      address.billToSameFlag);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleSaveFormState = () => {
      const payload = {
        timestamp: Date.now(),
        pathname: window.location.pathname,
        orderId: initialOrder?.orderId ?? null,
        pendingReturn: true,
        data: {
          formState,
          items,
          removedItemIds,
          address,
          useCustomTaxRate,
          shippingEditable,
          discountData,
        },
      };

      localStorage.setItem(formStateStorageKey, JSON.stringify(payload));
    };

    window.addEventListener('saveFormState', handleSaveFormState);

    return () => {
      window.removeEventListener('saveFormState', handleSaveFormState);
    };
  }, [
    formState,
    items,
    removedItemIds,
    address,
    useCustomTaxRate,
    shippingEditable,
    discountData,
    initialOrder?.orderId,
    formStateStorageKey,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedRaw = localStorage.getItem(formStateStorageKey);

    if (!savedRaw) {
      return;
    }

    try {
      const saved = JSON.parse(savedRaw);
      const isRecent = Date.now() - saved.timestamp < 30 * 60 * 1000;
      const pathnameMatches = saved.pathname === window.location.pathname;
      const orderMatches = saved.orderId ? saved.orderId === initialOrder?.orderId : !saved.orderId;

      if (!saved.pendingReturn || !isRecent || !pathnameMatches || !orderMatches) {
        return;
      }

      if (saved.data?.formState) {
        setFormState(saved.data.formState);
      }
      if (saved.data?.items) {
        setItems(saved.data.items);
      }
      if (saved.data?.removedItemIds) {
        setRemovedItemIds(saved.data.removedItemIds);
      }
      if (saved.data?.address) {
        setAddress(saved.data.address);
        hasInitialShipToRef.current = hasAddressValues(saved.data.address.shipTo);
        hasInitialBillToRef.current =
          hasAddressValues(saved.data.address.billTo) ||
          (saved.data.address.billToSameFlag && hasAddressValues(saved.data.address.shipTo));
      }
      if (typeof saved.data?.useCustomTaxRate === 'boolean') {
        setUseCustomTaxRate(saved.data.useCustomTaxRate);
      }
      if (typeof saved.data?.shippingEditable === 'boolean') {
        setShippingEditable(saved.data.shippingEditable);
      }
      if (saved.data?.discountData !== undefined) {
        setDiscountData(saved.data.discountData);
      }
      if (saved.data?.formState?.customerId) {
        const restoredCustomerId = Number.parseInt(saved.data.formState.customerId, 10);

        if (!Number.isNaN(restoredCustomerId)) {
          lastCustomerIdRef.current = restoredCustomerId;
        }
      }

      localStorage.removeItem(formStateStorageKey);
    } catch (error) {
      console.error('Failed to restore order form state:', error);
    }
  }, [formStateStorageKey, initialOrder?.orderId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const createdEntityInfo = localStorage.getItem('createdEntityInfo');

    if (!createdEntityInfo) {
      return;
    }

    try {
      const info = JSON.parse(createdEntityInfo);
      const sessionMatches = info.targetSessionId === formSessionId;

      if (sessionMatches) {
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey[0];

            return typeof key === 'string' && key.startsWith('/api/products');
          },
          refetchType: 'active',
        });
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey[0];

            return typeof key === 'string' && key.startsWith('/api/product-catalogs');
          },
          refetchType: 'active',
        });
        localStorage.removeItem('createdEntityInfo');
      }
    } catch (error) {
      console.error('Failed to process created entity info:', error);
    }
  }, [formSessionId, queryClient]);

  useEffect(() => {
    if (isEditing) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) {
        return;
      }

      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, isEditing]);

  useEffect(() => {
    if (isEditing) return;

    const handleNavigationClick = (event: Event) => {
      if (!hasUnsavedChanges || showDraftDialog) {
        return;
      }

      const target = event.target as Element;
      const link = target.closest('a[href]') as HTMLAnchorElement | null;

      if (!link) {
        return;
      }

      const href = link.getAttribute('href');

      if (
        !href ||
        href.startsWith('http') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        href.startsWith('#')
      ) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      setPendingNavigation(() => () => router.push(href));
      setShowDraftDialog(true);
    };

    document.addEventListener('click', handleNavigationClick, true);

    return () => {
      document.removeEventListener('click', handleNavigationClick, true);
    };
  }, [hasUnsavedChanges, isEditing, router, showDraftDialog]);

  useEffect(() => {
    if (isEditing) return;

    const draftCheckHandler = {
      formId: 'orders',
      checkDrafts: (onProceed: () => void) => {
        if (hasUnsavedChanges) {
          setPendingNavigation(() => onProceed);
          setShowDraftDialog(true);

          return;
        }
        onProceed();
      },
    };

    registerDraftCheck(draftCheckHandler);

    return () => {
      unregisterDraftCheck('orders');
    };
  }, [hasUnsavedChanges, isEditing, registerDraftCheck, unregisterDraftCheck]);

  const selectedCustomerId = formState.customerId.trim()
    ? Number.parseInt(formState.customerId, 10)
    : undefined;
  const { data: customerData } = useGetCustomer(selectedCustomerId || 0, {
    query: { enabled: Boolean(selectedCustomerId) },
  });
  const initialCustomer = initialOrder?.customer;
  const selectedCustomerEmail =
    customerData?.email ??
    (initialCustomer?.id === selectedCustomerId ? initialOrder?.email : undefined);
  const selectedCustomerPhone =
    customerData?.mobile ??
    (initialCustomer?.id === selectedCustomerId ? initialOrder?.phone : undefined);

  const splitContactPerson = (contactPerson?: string) => {
    if (!contactPerson?.trim()) {
      return { firstName: '', middleName: '', lastName: '' };
    }
    const parts = contactPerson.trim().split(/\s+/);

    if (parts.length === 1) {
      return { firstName: parts[0], middleName: '', lastName: '' };
    }
    if (parts.length === 2) {
      return { firstName: parts[0], middleName: '', lastName: parts[1] };
    }

    return {
      firstName: parts[0],
      middleName: parts.slice(1, -1).join(' '),
      lastName: parts[parts.length - 1],
    };
  };

  const buildAddressFromCustomer = (customer: CustomerDTO): AddressFieldsForm => {
    const { firstName, middleName, lastName } = splitContactPerson(customer.contactPerson);

    const defaultAddr = customer.defaultAddress ?? customer.addresses?.[0];

    if (defaultAddr) {
      return {
        firstName,
        middleName,
        lastName,
        addrLine1: defaultAddr.completeAddress ?? '',
        addrLine2: '',
        city: defaultAddr.area?.city?.name ?? '',
        state: defaultAddr.area?.city?.district?.state?.name ?? '',
        zipcode: defaultAddr.area?.pincode ?? '',
        country: defaultAddr.area?.city?.district?.state?.country ?? '',
        contact: customer.mobile ?? '',
      };
    }

    return {
      firstName,
      middleName,
      lastName,
      addrLine1: '',
      addrLine2: '',
      city: '',
      state: '',
      zipcode: '',
      country: '',
      contact: customer.mobile ?? '',
    };
  };

  useEffect(() => {
    if (!customerData) return;
    const currentId = customerData.id ?? null;
    const previousId = lastCustomerIdRef.current;
    const shouldAutoFill =
      previousId === null
        ? !addressExists || !hasInitialShipToRef.current
        : previousId !== currentId;

    if (!shouldAutoFill) {
      lastCustomerIdRef.current = currentId;

      return;
    }

    setAddress((prev) => ({
      ...prev,
      shipTo: buildAddressFromCustomer(customerData),
    }));
    setShippingEditable(false);
    lastCustomerIdRef.current = currentId;
  }, [addressExists, customerData?.id]);

  useEffect(() => {
    const code = formState.discountCode?.trim() || '';

    if (!code) {
      setDiscountData(null);
      discountCodeRef.current = '';

      return;
    }
    if (discountCodeRef.current && discountCodeRef.current !== code) {
      setDiscountData(null);
    }
    discountCodeRef.current = code;
  }, [formState.discountCode]);

  const handleChange = (key: keyof OrderFormState, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
    if (
      key === 'orderBaseAmount' ||
      key === 'shippingAmount' ||
      key === 'orderTaxRate' ||
      key === 'shippingId' ||
      key === 'discountCode' ||
      key === 'customerId'
    ) {
      setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
    }
  };

  const handleTaxRateSelect = (value: string) => {
    if (value === 'custom') {
      setUseCustomTaxRate(true);
      if (taxRateOptions.includes(formState.orderTaxRate as (typeof taxRateOptions)[number])) {
        handleChange('orderTaxRate', '');
      }

      return;
    }
    setUseCustomTaxRate(false);
    handleChange('orderTaxRate', value);
  };

  const handleItemChange = (
    index: number,
    key: keyof OrderItemForm,
    value: string | number | WarehouseStockEntry[] | undefined
  ) => {
    setItems((prev) => prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)));
    setErrors((prev) => {
      if (!prev.items?.[index]?.[key]) {
        return prev;
      }
      const nextItems = prev.items ? [...prev.items] : [];
      const nextItem = { ...nextItems[index] };

      delete nextItem[key];
      nextItems[index] = nextItem;

      return { ...prev, items: nextItems };
    });
  };

  const addItem = () => {
    setItems((prev) => {
      setSelectedItemIndex(prev.length);

      return [...prev, emptyOrderItem()];
    });
  };

  const addCatalogItem = () => {
    setItems((prev) => {
      setSelectedItemIndex(prev.length);

      return [...prev, emptyOrderItem('catalog')];
    });
  };

  const applyVariantSelection = (index: number, nextItems: OrderItemForm[], replaceCount = 1) => {
    if (nextItems.length === 0) {
      return;
    }

    setItems((prev) => {
      if (index < 0 || index >= prev.length) {
        return prev;
      }

      const safeReplaceCount = Math.max(replaceCount, 1);

      return [...prev.slice(0, index), ...nextItems, ...prev.slice(index + safeReplaceCount)];
    });
    setErrors((prev) => (prev.items ? { ...prev, items: undefined } : prev));
  };

  const removeItem = (index: number) => {
    setItems((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);

      if (removed?.id) {
        setRemovedItemIds((current) => [...current, removed.id!]);
      }

      return next;
    });
    setSelectedItemIndex((current) => {
      if (current === null) {
        return null;
      }
      if (current === index) {
        return Math.max(index - 1, 0);
      }
      if (current > index) {
        return current - 1;
      }

      return current;
    });
  };

  useEffect(() => {
    setSelectedItemIndex((current) => {
      if (items.length === 0) {
        return null;
      }
      if (current === null) {
        return 0;
      }

      return Math.min(current, items.length - 1);
    });
  }, [items.length]);

  const buildWarehouseVariantItem = (
    baseItem: OrderItemForm,
    variant: ProductVariantDTO,
    stock: NonNullable<ProductVariantDTO['variantStocks']>[number]
  ): OrderItemForm => {
    const warehouseStock: WarehouseStockEntry = {
      warehouseId: stock.warehouse?.id,
      warehouseName: stock.warehouse?.name,
      warehouseCode: undefined,
      variantLabel: variant.sku,
      stockQuantity: Math.max(0, stock.stockQuantity ?? 0),
      salesStockQuantity: stock.salesStockQuantity ?? stock.stockQuantity ?? 0,
    };
    const availableQuantity = warehouseStock.salesStockQuantity ?? warehouseStock.stockQuantity;
    const { color, size } = getVariantDisplayParts(variant, 0);

    return {
      ...emptyOrderItem('product'),
      productId: baseItem.productId,
      productName: baseItem.productName,
      variantId: variant.id,
      sku: variant.sku,
      warehouseId: stock.warehouse?.id,
      warehouseName: stock.warehouse?.name,
      warehouseCode: undefined,
      availableQuantity,
      warehouseStocks: [warehouseStock],
      variantAttributes: `${color} / ${size}`,
      quantity: '1',
      itemPrice:
        variant.price !== undefined && variant.price !== null
          ? String(variant.price)
          : baseItem.itemPrice,
    };
  };

  const handleToggleWarehouseVariant = (
    variant: ProductVariantDTO,
    stock: NonNullable<ProductVariantDTO['variantStocks']>[number],
    checked: boolean
  ) => {
    if (selectedItemIndex === null) {
      return;
    }

    const selectedItem = items[selectedItemIndex];

    if (!selectedItem?.productId) {
      return;
    }

    const warehouseId = stock.warehouse?.id;

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.itemType === 'product' &&
          item.productId === selectedItem.productId &&
          item.variantId === variant.id &&
          item.warehouseId === warehouseId
      );

      if (!checked) {
        if (existingIndex === -1) {
          return prev;
        }

        const next = [...prev];
        const [removed] = next.splice(existingIndex, 1);

        if (removed?.id) {
          setRemovedItemIds((current) => [...current, removed.id!]);
        }

        setSelectedItemIndex((current) => {
          if (current === null) {
            return null;
          }
          if (current === existingIndex) {
            return Math.max(existingIndex - 1, 0);
          }
          if (current > existingIndex) {
            return current - 1;
          }

          return current;
        });

        return next.length > 0 ? next : [emptyOrderItem()];
      }

      if (existingIndex !== -1) {
        return prev;
      }

      const nextItem = buildWarehouseVariantItem(selectedItem, variant, stock);
      const canReplaceSelected =
        selectedItem.itemType === 'product' &&
        selectedItem.productId === nextItem.productId &&
        selectedItem.variantId === undefined &&
        !selectedItem.id;

      if (canReplaceSelected) {
        const next = [...prev];

        next[selectedItemIndex] = nextItem;

        return next;
      }

      const insertAfterIndex = Math.max(
        ...prev
          .map((item, index) =>
            item.itemType === 'product' && item.productId === selectedItem.productId ? index : -1
          )
          .filter((index) => index >= 0),
        selectedItemIndex
      );
      const next = [
        ...prev.slice(0, insertAfterIndex + 1),
        nextItem,
        ...prev.slice(insertAfterIndex + 1),
      ];

      setSelectedItemIndex(insertAfterIndex + 1);

      return next;
    });
    setErrors((prev) => (prev.items ? { ...prev, items: undefined } : prev));
  };

  const handleAdjustItemQuantity = (itemIndex: number, delta: number) => {
    setItems((prev) =>
      prev.map((item, index) => {
        if (index !== itemIndex) {
          return item;
        }

        const currentQuantity = Number.parseInt(item.quantity, 10) || 0;
        const nextQuantity = Math.max(0, currentQuantity + delta);

        return { ...item, quantity: String(nextQuantity) };
      })
    );
    setErrors((prev) => {
      if (!prev.items?.[itemIndex]?.quantity) {
        return prev;
      }

      const nextItems = [...prev.items];
      const nextItem = { ...nextItems[itemIndex] };

      delete nextItem.quantity;
      nextItems[itemIndex] = nextItem;

      return { ...prev, items: nextItems };
    });
  };

  useEffect(() => {
    if (!isEditing || backOrderResolutionPrompted) {
      return;
    }

    const candidates = items
      .map((item, index) => {
        const existingBackOrderQuantity = Math.max(item.existingBackOrderQuantity || 0, 0);

        if (item.itemType !== 'product' || existingBackOrderQuantity <= 0) {
          return null;
        }

        const breakdown = getOrderItemBillingBreakdown(item);
        const fulfillableQuantity = Math.max(
          existingBackOrderQuantity - breakdown.backOrderQuantity,
          0
        );

        if (fulfillableQuantity <= 0) {
          return null;
        }

        const name = item.productName || item.sku || `Item ${index + 1}`;

        return { index, name, fulfillableQuantity, existingBackOrderQuantity };
      })
      .filter(
        (
          candidate
        ): candidate is {
          index: number;
          name: string;
          fulfillableQuantity: number;
          existingBackOrderQuantity: number;
        } => candidate !== null
      );

    if (candidates.length === 0) {
      return;
    }

    setBackOrderResolutionCandidates(candidates);
    setShowBackOrderResolutionDialog(true);
    setBackOrderResolutionPrompted(true);
  }, [backOrderResolutionPrompted, isEditing, items]);

  const handleCancelBackOrders = () => {
    const quantityByIndex = new Map(
      backOrderResolutionCandidates.map((candidate) => [
        candidate.index,
        candidate.existingBackOrderQuantity,
      ])
    );

    setItems((prev) =>
      prev.map((item, index) => {
        const existingBackOrderQuantity = quantityByIndex.get(index);

        if (!existingBackOrderQuantity) {
          return item;
        }

        const currentRequestedQuantity = Number.parseInt(item.quantity, 10);
        const normalizedCurrentRequestedQuantity = Number.isFinite(currentRequestedQuantity)
          ? Math.max(currentRequestedQuantity, 0)
          : 0;
        const nextRequestedQuantity = Math.max(
          normalizedCurrentRequestedQuantity - existingBackOrderQuantity,
          0
        );

        return {
          ...item,
          quantity: String(nextRequestedQuantity),
          existingBackOrderQuantity: 0,
        };
      })
    );

    setShowBackOrderResolutionDialog(false);
    toast.info('Back order quantities removed. Save the order to apply cancellation.');
  };

  const handleProceedBackOrders = () => {
    setShowBackOrderResolutionDialog(false);
    toast.info('Proceed selected. Save the order to refresh the outstanding quantities.');
  };

  const handleAddressChange = (
    section: 'shipTo' | 'billTo',
    key: keyof AddressFieldsForm,
    value: string
  ) => {
    const nextValue = key === 'zipcode' ? value.slice(0, 10) : value;

    setAddress((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: nextValue,
      },
    }));
    if (key === 'zipcode' || key === 'contact') {
      const errorKey =
        section === 'shipTo'
          ? key === 'zipcode'
            ? 'shipToZipcode'
            : 'shipToContact'
          : key === 'zipcode'
            ? 'billToZipcode'
            : 'billToContact';

      setErrors((prev) => (prev[errorKey] ? { ...prev, [errorKey]: undefined } : prev));
    }
  };

  const toggleBillToSame = (checked: boolean) => {
    setAddress((prev) => ({
      ...prev,
      billToSameFlag: checked,
      billTo: checked ? { ...prev.shipTo } : prev.billTo,
    }));
    if (checked) {
      setErrors((prev) => ({
        ...prev,
        billToZipcode: undefined,
        billToContact: undefined,
      }));
    }
  };

  const isDiscountActive = (discount?: IDiscount | null) =>
    (discount?.status || '').toUpperCase() === 'ACTIVE';

  const normalizeTimeForCompare = (time?: string | null) => {
    if (!time) {
      return null;
    }

    const segments = time.split(':');

    if (segments.length < 2) {
      return null;
    }

    const [hoursRaw, minutesRaw, secondsRaw = '00'] = segments;
    const hours = Number.parseInt(hoursRaw, 10);
    const minutes = Number.parseInt(minutesRaw, 10);
    const seconds = Number.parseInt(secondsRaw, 10);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes) || !Number.isFinite(seconds)) {
      return null;
    }

    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');

    return `${hh}:${mm}:${ss}`;
  };

  const getNowDateForCompare = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const getNowTimeForCompare = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${hours}:${minutes}:${seconds}`;
  };

  const evaluateDiscountAvailability = (discount?: IDiscount | null) => {
    if (!discount || !isDiscountActive(discount)) {
      return 'inactive' as const;
    }

    const today = getNowDateForCompare();
    const nowTime = getNowTimeForCompare();
    const startDate = discount.startDate?.trim() || null;
    const endDate = discount.endDate?.trim() || null;
    const startTime = normalizeTimeForCompare(discount.discountStartTime);
    const endTime = normalizeTimeForCompare(discount.discountEndTime);

    if (startDate) {
      if (today < startDate) {
        return 'not_started' as const;
      }
      if (today === startDate && startTime && nowTime < startTime) {
        return 'not_started' as const;
      }
    }

    if (endDate) {
      if (today > endDate) {
        return 'expired' as const;
      }
      if (today === endDate && endTime && nowTime > endTime) {
        return 'expired' as const;
      }
    }

    return 'valid' as const;
  };

  const resolveDiscountAmount = (baseAmount: number, discount?: IDiscount | null) => {
    if (evaluateDiscountAvailability(discount) !== 'valid') {
      return 0;
    }
    const discountType = (discount.discountType || '').toUpperCase();
    const rawValue = Number(discount.discountValue ?? discount.discountAmount ?? 0);

    if (!Number.isFinite(rawValue) || rawValue <= 0) {
      return 0;
    }
    let amount = 0;

    if (discountType === 'PERCENTAGE') {
      const safePercent = Math.min(Math.max(rawValue, 0), 100);

      amount = (safePercent / 100) * baseAmount;
    } else {
      amount = Math.max(rawValue, 0);
    }
    if (discountType === 'PERCENTAGE') {
      const maxDiscountValue = Number(discount.maxDiscountValue);

      if (Number.isFinite(maxDiscountValue) && maxDiscountValue > 0 && amount > maxDiscountValue) {
        amount = maxDiscountValue;
      }
    }

    return Math.max(amount, 0);
  };

  const fetchDiscountByCode = async (code: string) => {
    try {
      const discount = await getDiscountByCode(code);

      setDiscountData(discount);
      const availability = evaluateDiscountAvailability(discount);

      if (availability === 'valid') {
        toast.success(`Discount code "${discount.discountCode}" applied!`);
      } else if (availability === 'expired') {
        toast.error('This discount code is expired.');
      } else if (availability === 'not_started') {
        toast.error('This discount code is not active yet.');
      } else {
        toast.error('This discount code is inactive.');
      }

      return discount;
    } catch (error) {
      console.error('Failed to verify discount code:', error);
      setDiscountData(null);
      toast.error('Invalid discount code.');

      return null;
    }
  };

  const handleVerifyDiscount = async () => {
    const code = formState.discountCode?.trim();

    if (!code) {
      toast.error('Please enter a discount code.');

      return;
    }

    await fetchDiscountByCode(code);
  };

  const shouldSaveAddress = (value: OrderAddressForm) => {
    const hasShipTo = Object.values(value.shipTo).some((field) => field.trim() !== '');
    const hasBillTo = Object.values(value.billTo).some((field) => field.trim() !== '');

    return hasShipTo || hasBillTo || value.billToSameFlag;
  };

  const validateForm = (): OrderFormErrors => {
    const nextErrors: OrderFormErrors = {};
    const numberPattern = /^-?\d+(\.\d+)?$/;
    const parsedCustomerId = Number.parseInt(formState.customerId, 10);

    if (
      !formState.customerId.trim() ||
      !Number.isFinite(parsedCustomerId) ||
      parsedCustomerId <= 0
    ) {
      nextErrors.customerId = 'Please select a customer.';
    }

    const validateAmount = (value: string, key: 'orderBaseAmount' | 'shippingAmount') => {
      if (!value.trim()) {
        return;
      }
      if (!numberPattern.test(value.trim())) {
        nextErrors[key] = 'Enter a valid number.';

        return;
      }
      const parsed = Number.parseFloat(value);

      if (!Number.isFinite(parsed) || parsed < 0) {
        nextErrors[key] = 'Amount cannot be negative.';
      }
    };

    const validatePercentage = (value: string, key: 'orderTaxRate') => {
      if (!value.trim()) {
        return;
      }
      if (!numberPattern.test(value.trim())) {
        nextErrors[key] = 'Enter a valid percentage.';

        return;
      }
      const parsed = Number.parseFloat(value);

      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
        nextErrors[key] = 'Percentage must be between 0 and 100.';
      }
    };

    validateAmount(formState.orderBaseAmount, 'orderBaseAmount');
    validateAmount(formState.shippingAmount, 'shippingAmount');
    validatePercentage(formState.orderTaxRate, 'orderTaxRate');

    if (formState.discountCode && formState.discountCode.length > 20) {
      nextErrors.discountCode = 'Max 20 characters.';
    }

    if (formState.shippingId && formState.shippingId.length > 50) {
      nextErrors.shippingId = 'Max 50 characters.';
    }

    if (shouldSaveAddress(address)) {
      if (address.shipTo.zipcode.trim().length > 10) {
        nextErrors.shipToZipcode = 'Max 10 characters.';
      }
      if (address.shipTo.contact.trim().length > 50) {
        nextErrors.shipToContact = 'Max 50 characters.';
      }
      if (!address.billToSameFlag) {
        if (address.billTo.zipcode.trim().length > 10) {
          nextErrors.billToZipcode = 'Max 10 characters.';
        }
        if (address.billTo.contact.trim().length > 50) {
          nextErrors.billToContact = 'Max 50 characters.';
        }
      }
    }

    const hasText = (value?: string) => Boolean(value && value.trim() !== '');
    const nextItemErrors: ItemErrors[] = items.map(() => ({}));

    items.forEach((item, index) => {
      const hasData =
        hasText(item.quantity) ||
        hasText(item.itemPrice) ||
        hasText(item.itemTaxAmount) ||
        hasText(item.itemComment) ||
        hasText(item.itemStatus);

      if (!hasData) return;

      if (item.itemStatus.trim() && !/^\d+$/.test(item.itemStatus.trim())) {
        nextItemErrors[index].itemStatus = 'Use a numeric status code.';
      }

      if (item.quantity.trim() && !/^\d+$/.test(item.quantity.trim())) {
        nextItemErrors[index].quantity = 'Use a whole number.';
      }

      if (item.itemPrice.trim()) {
        const value = Number.parseFloat(item.itemPrice);

        if (!Number.isFinite(value) || value < 0) {
          nextItemErrors[index].itemPrice = 'Enter a valid amount.';
        }
      }

      if (item.itemTaxAmount.trim()) {
        const value = Number.parseFloat(item.itemTaxAmount);

        if (!Number.isFinite(value) || value < 0) {
          nextItemErrors[index].itemTaxAmount = 'Enter a valid amount.';
        }
      }
    });

    const hasItemErrors = nextItemErrors.some((entry) => Object.keys(entry).length > 0);

    if (hasItemErrors) {
      nextErrors.items = nextItemErrors;
    }

    return nextErrors;
  };

  const orderStatusSelectOptions: OrderStatus[] = getSelectableOrderStatuses(
    initialOrder?.orderStatus ?? formState.orderStatus,
    {
      isEditing,
      includeUnknown: formState.orderStatus === 'Unknown',
    }
  );
  const paymentStatusSelectOptions: PaymentStatus[] =
    formState.paymentStatus === 'Unknown'
      ? [...paymentStatusOptions, 'Unknown']
      : paymentStatusOptions;
  const shippingMethodSelectOptions: ShippingMethod[] =
    formState.shippingMethod === 'Unknown'
      ? [...shippingMethodOptions, 'Unknown']
      : shippingMethodOptions;

  const saveDraft = async (): Promise<boolean> => {
    if (isEditing) return false;

    const statusTransitionError = getOrderStatusTransitionError(undefined, formState.orderStatus, {
      isEditing: false,
    });

    if (statusTransitionError) {
      toast.error('Invalid order status.', {
        description: statusTransitionError,
      });

      return false;
    }

    setSubmitting(true);

    const parseAmount = (value: string) => {
      const parsed = Number.parseFloat(value);

      return Number.isFinite(parsed) ? parsed : 0;
    };

    const parseInteger = (value: string) => {
      const parsed = Number.parseInt(value, 10);

      return Number.isFinite(parsed) ? parsed : 0;
    };

    const buildAddressPayload = (orderId: number) => {
      const billTo = address.billToSameFlag ? address.shipTo : address.billTo;

      return {
        orderId,
        shipToFirstName: address.shipTo.firstName || undefined,
        shipToMiddleName: address.shipTo.middleName || undefined,
        shipToLastName: address.shipTo.lastName || undefined,
        shipToAddLine1: address.shipTo.addrLine1 || undefined,
        shipToAddLine2: address.shipTo.addrLine2 || undefined,
        shipToCity: address.shipTo.city || undefined,
        shipToState: address.shipTo.state || undefined,
        shipToZipcode: address.shipTo.zipcode || undefined,
        shipToContact: address.shipTo.contact || undefined,
        shipToCountry: address.shipTo.country || undefined,
        billToSameFlag: address.billToSameFlag || false,
        billToFirstName: billTo.firstName || undefined,
        billToMiddleName: billTo.middleName || undefined,
        billToLastName: billTo.lastName || undefined,
        billToAddLine1: billTo.addrLine1 || undefined,
        billToAddLine2: billTo.addrLine2 || undefined,
        billToCity: billTo.city || undefined,
        billToState: billTo.state || undefined,
        billToZipcode: billTo.zipcode || undefined,
        billToContact: billTo.contact || undefined,
        billToCountry: billTo.country || undefined,
      };
    };

    try {
      const itemsTotal = calculateItemsTotal(items);
      const baseAmount = itemsTotal;
      const shippingAmount = parseAmount(formState.shippingAmount || '0');
      const taxRate = Math.min(Math.max(parseAmount(formState.orderTaxRate || '0'), 0), 100);
      const taxAmount = (taxRate / 100) * Math.max(baseAmount, 0);
      const orderTotalAmount = Math.max(baseAmount + shippingAmount + taxAmount, 0);

      const orderStatusCode =
        getOrderStatusCode(formState.orderStatus) ?? initialOrder?.orderStatusCode ?? 0;
      const paymentStatusCode =
        getPaymentStatusCode(formState.paymentStatus) ?? initialOrder?.paymentStatusCode ?? 0;
      const shippingMethodCode = getShippingMethodCode(formState.shippingMethod || undefined);
      const customerPayload = selectedCustomerId
        ? ({ id: selectedCustomerId } as CustomerDTO)
        : undefined;

      const payload: OrderDTO = {
        orderStatus: orderStatusCode,
        orderTotalAmount,
        orderTaxRate: taxRate,
        shippingAmount,
        customer: customerPayload,
        orderBaseAmount: baseAmount,
        phone: selectedCustomerPhone || undefined,
        email: selectedCustomerEmail || undefined,
        paymentStatus: paymentStatusCode,
        discountCode: formState.discountCode?.trim() || undefined,
        status: 'DRAFT',
      } as OrderDTO;

      const result = await createOrder({ data: payload });
      const orderId = result?.id;

      if (!orderId) {
        throw new Error('Order ID missing after draft save.');
      }

      const detailTasks = items
        .filter((item) => hasItemData(item))
        .map((item) => {
          const isCatalog = item.itemType === 'catalog' || Boolean(item.productCatalogId);
          const breakdown = getOrderItemBillingBreakdown(item);
          const quantity = breakdown.billableQuantity;
          const backOrderQuantity = breakdown.backOrderQuantity;
          const itemPrice = parseAmount(item.itemPrice || '0');
          const itemTaxAmount = parseAmount(item.itemTaxAmount || '0');
          const itemTotalAmount = Math.max(quantity * itemPrice + itemTaxAmount, 0);
          const itemStatus = parseInteger(item.itemStatus || '0');

          return createOrderDetail({
            data: {
              orderId,
              productId: isCatalog ? undefined : item.productId || undefined,
              variantId: isCatalog ? undefined : item.variantId || undefined,
              productCatalogId: isCatalog ? item.productCatalogId || undefined : undefined,
              productName: item.productName || undefined,
              sku: item.sku || undefined,
              variantAttributes: item.variantAttributes || undefined,
              itemStatus,
              quantity,
              backOrderQuantity,
              itemPrice,
              itemTaxAmount,
              itemTotalAmount,
              itemComment: item.itemComment || undefined,
            },
          });
        });
      const totalBackOrderUnits = items
        .filter((item) => hasItemData(item))
        .reduce((sum, item) => sum + getOrderItemBillingBreakdown(item).backOrderQuantity, 0);

      const addressTasks: Promise<unknown>[] = [];

      if (shouldSaveAddress(address)) {
        addressTasks.push(createOrderAddressDetail({ data: buildAddressPayload(orderId) }));
      }

      const shippingTasks: Promise<unknown>[] = [];
      const shouldSaveShipping =
        Boolean(formState.shippingId?.trim()) ||
        typeof shippingMethodCode === 'number' ||
        shippingAmount > 0;

      if (shouldSaveShipping) {
        shippingTasks.push(
          createOrderShippingDetail({
            data: {
              orderId,
              shippingAmount,
              shippingMethod: shippingMethodCode,
              shippingId: formState.shippingId || undefined,
            },
          })
        );
      }

      const historyTask = createOrderHistory({
        data: {
          orderId,
          status: `Order saved as draft (${formState.orderStatus})`,
          notificationSent: false,
        },
      });

      const backOrderHistoryTask =
        totalBackOrderUnits > 0
          ? createOrderHistory({
              data: {
                orderId,
                status: `Back order created: ${totalBackOrderUnits} item${totalBackOrderUnits === 1 ? '' : 's'}`,
                notificationSent: false,
              },
            })
          : null;

      await Promise.allSettled([
        ...detailTasks,
        ...addressTasks,
        ...shippingTasks,
        historyTask,
        ...(backOrderHistoryTask ? [backOrderHistoryTask] : []),
      ]);

      await queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/order-details'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/order-address-details'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/order-shipping-details'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/order-histories'] });

      setRemovedItemIds([]);
      toast.success('Order draft saved successfully.');

      return true;
    } catch (error) {
      console.error('Failed to save order draft:', error);
      toast.error('Unable to save order draft.', {
        description: getOrderStatusErrorDescription(
          error,
          'Please check the details and try again.'
        ),
      });

      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!items.some(hasItemData)) {
      setShowEmptyCartDialog(true);

      return;
    }
    const validationErrors = validateForm();
    const hasErrors = Object.values(validationErrors).some((value) => {
      if (Array.isArray(value)) {
        return value.some((entry) => Object.keys(entry).length > 0);
      }

      return Boolean(value);
    });

    if (hasErrors) {
      setErrors(validationErrors);
      toast.error('Please fix the highlighted fields.');

      return;
    }

    const statusTransitionError = getOrderStatusTransitionError(
      initialOrder?.orderStatus,
      formState.orderStatus,
      { isEditing }
    );

    if (statusTransitionError) {
      toast.error('Invalid order status.', {
        description: statusTransitionError,
      });

      return;
    }

    setErrors({});
    setSubmitting(true);

    const parseAmount = (value: string) => {
      const parsed = Number.parseFloat(value);

      return Number.isFinite(parsed) ? parsed : 0;
    };

    const parseInteger = (value: string) => {
      const parsed = Number.parseInt(value, 10);

      return Number.isFinite(parsed) ? parsed : 0;
    };

    const buildAddressPayload = (orderId: number) => {
      const billTo = address.billToSameFlag ? address.shipTo : address.billTo;

      return {
        id: addressExists ? orderId : undefined,
        orderId,
        shipToFirstName: address.shipTo.firstName || undefined,
        shipToMiddleName: address.shipTo.middleName || undefined,
        shipToLastName: address.shipTo.lastName || undefined,
        shipToAddLine1: address.shipTo.addrLine1 || undefined,
        shipToAddLine2: address.shipTo.addrLine2 || undefined,
        shipToCity: address.shipTo.city || undefined,
        shipToState: address.shipTo.state || undefined,
        shipToZipcode: address.shipTo.zipcode || undefined,
        shipToContact: address.shipTo.contact || undefined,
        shipToCountry: address.shipTo.country || undefined,
        billToSameFlag: address.billToSameFlag || false,
        billToFirstName: billTo.firstName || undefined,
        billToMiddleName: billTo.middleName || undefined,
        billToLastName: billTo.lastName || undefined,
        billToAddLine1: billTo.addrLine1 || undefined,
        billToAddLine2: billTo.addrLine2 || undefined,
        billToCity: billTo.city || undefined,
        billToState: billTo.state || undefined,
        billToZipcode: billTo.zipcode || undefined,
        billToContact: billTo.contact || undefined,
        billToCountry: billTo.country || undefined,
      };
    };

    const itemsTotal = calculateItemsTotal(items);
    const baseAmount = itemsTotal;
    const discountCode = formState.discountCode?.trim() || '';
    let resolvedDiscount = discountData;

    if (discountCode && discountData?.discountCode?.toUpperCase() !== discountCode.toUpperCase()) {
      resolvedDiscount = await fetchDiscountByCode(discountCode);
    }
    const discountAmount = resolveDiscountAmount(baseAmount, resolvedDiscount);
    const shippingAmount = parseAmount(formState.shippingAmount || '0');
    const taxRate = Math.min(Math.max(parseAmount(formState.orderTaxRate || '0'), 0), 100);
    const taxableAmount = Math.max(baseAmount - discountAmount, 0);
    const taxAmount = (taxRate / 100) * taxableAmount;
    const orderTotalAmount = Math.max(taxableAmount + shippingAmount + taxAmount, 0);

    const orderStatusCode =
      getOrderStatusCode(formState.orderStatus) ?? initialOrder?.orderStatusCode ?? 0;
    const paymentStatusCode =
      getPaymentStatusCode(formState.paymentStatus) ?? initialOrder?.paymentStatusCode ?? 0;
    const shippingMethodCode =
      getShippingMethodCode(formState.shippingMethod || undefined) ??
      initialOrder?.shipping.shippingMethodCode ??
      undefined;

    const customerPayload = selectedCustomerId
      ? ({ id: selectedCustomerId } as CustomerDTO)
      : undefined;

    const callPayload = callId
      ? ({ id: callId } as import('@/core/api/generated/spring/schemas').CallDTO)
      : undefined;

    const payload: OrderDTO & {
      call?: import('@/core/api/generated/spring/schemas').CallDTO;
    } = {
      id: initialOrder?.orderId,
      orderStatus: orderStatusCode,
      orderTotalAmount,
      orderTaxRate: taxRate,
      shippingAmount,
      customer: customerPayload,
      call: callPayload,
      orderBaseAmount: baseAmount,
      phone: selectedCustomerPhone || undefined,
      email: selectedCustomerEmail || undefined,
      paymentStatus: paymentStatusCode,
      discountCode: discountCode || undefined,
      status: 'ACTIVE',
    };

    try {
      const result = isEditing
        ? await updateOrder({ id: initialOrder!.orderId, data: payload })
        : await createOrder({ data: payload });

      const orderId = result?.id ?? initialOrder?.orderId;

      if (!orderId) {
        throw new Error('Order ID missing after save.');
      }

      const itemTasks = items
        .filter((item) => {
          const hasData =
            item.productId ||
            item.variantId ||
            item.productCatalogId ||
            item.quantity?.trim() ||
            item.itemPrice?.trim() ||
            item.itemTaxAmount?.trim() ||
            item.itemComment?.trim();

          return hasData;
        })
        .map((item) => {
          const isCatalog = item.itemType === 'catalog' || Boolean(item.productCatalogId);
          const breakdown = getOrderItemBillingBreakdown(item);
          const quantity = breakdown.billableQuantity;
          const backOrderQuantity = breakdown.backOrderQuantity;
          const itemPrice = parseAmount(item.itemPrice || '0');
          const itemTaxAmount = parseAmount(item.itemTaxAmount || '0');
          const itemTotalAmount = Math.max(quantity * itemPrice + itemTaxAmount, 0);
          const itemStatus = parseInteger(item.itemStatus || '0');

          const detailPayload = {
            id: item.id,
            orderId,
            productId: isCatalog ? undefined : item.productId || undefined,
            variantId: isCatalog ? undefined : item.variantId || undefined,
            productCatalogId: isCatalog ? item.productCatalogId || undefined : undefined,
            productName: item.productName || undefined,
            sku: item.sku || undefined,
            variantAttributes: item.variantAttributes || undefined,
            itemStatus,
            quantity,
            backOrderQuantity,
            itemPrice,
            itemTaxAmount,
            itemTotalAmount,
            itemComment: item.itemComment || undefined,
          };

          return item.id
            ? updateOrderDetail({ id: item.id, data: detailPayload })
            : createOrderDetail({ data: detailPayload });
        });
      const totalBackOrderUnits = items
        .filter((item) => {
          const hasData =
            item.productId ||
            item.variantId ||
            item.productCatalogId ||
            item.quantity?.trim() ||
            item.itemPrice?.trim() ||
            item.itemTaxAmount?.trim() ||
            item.itemComment?.trim();

          return hasData;
        })
        .reduce((sum, item) => sum + getOrderItemBillingBreakdown(item).backOrderQuantity, 0);

      const deleteTasks = removedItemIds.map((id) => deleteOrderDetail({ id }));

      const addressTasks: Promise<unknown>[] = [];

      if (shouldSaveAddress(address)) {
        const addressPayload = buildAddressPayload(orderId);

        if (addressExists) {
          addressTasks.push(updateOrderAddressDetail({ id: orderId, data: addressPayload }));
        } else {
          addressTasks.push(createOrderAddressDetail({ data: addressPayload }));
        }
      }

      const shippingTasks: Promise<unknown>[] = [];
      const shouldSaveShipping =
        Boolean(shippingExists) ||
        Boolean(formState.shippingId?.trim()) ||
        typeof shippingMethodCode === 'number' ||
        shippingAmount > 0;

      if (shouldSaveShipping) {
        const shippingPayload = {
          id: shippingExists ? orderId : undefined,
          orderId,
          shippingAmount,
          shippingMethod: shippingMethodCode,
          shippingId: formState.shippingId || undefined,
        };

        if (shippingExists) {
          shippingTasks.push(updateOrderShippingDetail({ id: orderId, data: shippingPayload }));
        } else {
          shippingTasks.push(createOrderShippingDetail({ data: shippingPayload }));
        }
      }

      const statusChanged =
        initialOrder?.orderStatus && initialOrder.orderStatus !== formState.orderStatus;
      const historyStatus = isEditing
        ? statusChanged
          ? `Status changed to ${formState.orderStatus}`
          : 'Order updated'
        : `Order created (${formState.orderStatus})`;
      const historyTask = createOrderHistory({
        data: {
          orderId,
          status: historyStatus,
          notificationSent: false,
        },
      });
      const backOrderHistoryTask =
        totalBackOrderUnits > 0
          ? createOrderHistory({
              data: {
                orderId,
                status: `Back order created: ${totalBackOrderUnits} item${totalBackOrderUnits === 1 ? '' : 's'}`,
                notificationSent: false,
              },
            })
          : null;

      const results = await Promise.allSettled([
        ...itemTasks,
        ...deleteTasks,
        ...addressTasks,
        ...shippingTasks,
        historyTask,
        ...(backOrderHistoryTask ? [backOrderHistoryTask] : []),
      ]);

      const failed = results.filter((entry) => entry.status === 'rejected');

      if (failed.length > 0) {
        toast.error('Order saved, but some related records failed.', {
          description: 'Please review items, address, or history.',
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      if (result?.id) {
        await queryClient.invalidateQueries({ queryKey: [`/api/orders/${result.id}`] });
      }
      if (initialOrder?.orderId) {
        await queryClient.invalidateQueries({ queryKey: [`/api/orders/${initialOrder.orderId}`] });
      }
      await queryClient.invalidateQueries({ queryKey: ['/api/order-details'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/order-address-details'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/order-shipping-details'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/order-histories'] });
      if (callId) {
        await queryClient.invalidateQueries({ queryKey: [`/api/calls/${callId}`] });
      }

      toast.success(isEditing ? 'Order updated' : 'Order created', {
        description: isEditing ? 'Changes saved successfully.' : 'New order is now available.',
      });

      setRemovedItemIds([]);

      if (onSubmitSuccess) {
        onSubmitSuccess();
      } else if (isEditing && initialOrder?.orderId) {
        router.push(`/orders/${initialOrder.orderId}`);
      } else if (callId) {
        router.push(`/calls/${callId}`);
      } else if (result?.id) {
        router.push(`/orders/${result.id}`);
      } else {
        router.push('/orders');
      }
    } catch (error) {
      toast.error('Unable to save order', {
        description: getOrderStatusErrorDescription(
          error,
          'Please check the details and try again.'
        ),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const itemsTotal = calculateItemsTotal(items);
  const baseAmount = itemsTotal;
  const discountCodeValue = formState.discountCode?.trim() || '';
  const activeDiscount =
    discountCodeValue &&
    discountData?.discountCode?.toUpperCase() === discountCodeValue.toUpperCase()
      ? discountData
      : null;
  const discountAmount = resolveDiscountAmount(baseAmount, activeDiscount);
  const discountLabel = discountCodeValue ? `Discount (${discountCodeValue})` : 'Discount';
  const shippingAmount = Number.parseFloat(formState.shippingAmount) || 0;
  const taxRateValue = Math.min(Math.max(Number.parseFloat(formState.orderTaxRate) || 0, 0), 100);
  const taxableAmount = Math.max(baseAmount - discountAmount, 0);
  const taxAmount = (taxRateValue / 100) * taxableAmount;
  const orderTotal = Math.max(taxableAmount + shippingAmount + taxAmount, 0);
  const taxRateSelectValue = useCustomTaxRate
    ? 'custom'
    : taxRateOptions.includes(formState.orderTaxRate as (typeof taxRateOptions)[number])
      ? formState.orderTaxRate
      : '';
  const itemSummaries = items.filter(hasItemData).map((item, index) => {
    const breakdown = getOrderItemBillingBreakdown(item);
    const name =
      item.itemType === 'catalog'
        ? item.productName
          ? `Catalog: ${item.productName}`
          : 'Catalog item'
        : item.productName || item.sku || `Item ${index + 1}`;

    return {
      key: item.id ?? `${item.productId ?? item.productCatalogId ?? 'item'}-${index}`,
      name,
      quantity: breakdown.requestedQuantity,
      billableQuantity: breakdown.billableQuantity,
      backOrderQuantity: breakdown.backOrderQuantity,
      total: calculateItemTotal(item),
    };
  });
  const hasItemSummaries = itemSummaries.length > 0;

  return (
    <>
      <form
        className="overflow-hidden border border-slate-500 bg-[#e6e6e6] text-xs shadow-sm"
        onSubmit={handleSubmit}
      >
        <div className="border-b border-slate-500 bg-[#3f7770] px-3 py-1 text-center text-xs font-bold text-white">
          Sale Order
        </div>
        <div className="grid gap-0 xl:grid-cols-[46%_54%]">
          <div className="space-y-1 border-slate-500 bg-[#efefef] p-1 xl:border-r">
            <div className="space-y-2 border border-slate-400 bg-[#f8f8d8] p-2 shadow-sm">
              <div className="border-b border-slate-300 pb-1">
                <h3 className="text-center text-xs font-bold text-slate-800">Sale Order Details</h3>
              </div>
              <OrderFormFields
                formState={formState}
                errors={errors}
                orderStatusOptions={orderStatusSelectOptions}
                paymentStatusOptions={paymentStatusSelectOptions}
                shippingMethodOptions={shippingMethodSelectOptions}
                onChange={handleChange}
                onVerifyDiscount={handleVerifyDiscount}
              />
              <OrderFormAddress
                address={address}
                errors={errors}
                onAddressChange={handleAddressChange}
                onToggleBillToSame={toggleBillToSame}
                shippingEditable={shippingEditable}
                onToggleShippingEditable={setShippingEditable}
              />
            </div>

            <OrderFormItems
              items={items}
              itemErrors={errors.items}
              onAddItem={addItem}
              onAddCatalogItem={addCatalogItem}
              onRemoveItem={removeItem}
              onApplyVariantSelection={applyVariantSelection}
              onItemChange={handleItemChange}
              selectedItemIndex={selectedItemIndex}
              onSelectItem={setSelectedItemIndex}
              referrerForm="orders"
              referrerSessionId={formSessionId}
              referrerField="productId"
              referrerCatalogField="productCatalogId"
            />
          </div>

          <div className="space-y-2 bg-white p-2">
            <div className="space-y-2 xl:sticky xl:top-2">
              <VariantWarehousePanel
                selectedItem={selectedItemIndex !== null ? items[selectedItemIndex] : undefined}
                selectedItemIndex={selectedItemIndex}
                items={items}
                onToggleWarehouseVariant={handleToggleWarehouseVariant}
                onAdjustItemQuantity={handleAdjustItemQuantity}
              />

              <div className="rounded-none border border-slate-400 bg-[#efefef] p-3 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500">
                    <svg
                      className="h-4 w-4 text-slate-900"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Order Summary</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between border-b border-yellow-500/20 pb-2">
                    <span className="text-sm font-medium text-slate-600">Items Subtotal</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">₹{itemsTotal.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => setShowItemsBreakdown((prev) => !prev)}
                        disabled={!hasItemSummaries}
                        aria-expanded={showItemsBreakdown}
                        aria-controls="order-items-breakdown"
                        className="rounded-sm p-1 text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${
                            showItemsBreakdown ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                  {showItemsBreakdown && hasItemSummaries && (
                    <div id="order-items-breakdown" className="border-b border-yellow-500/20 pb-2">
                      <div className="space-y-1 text-xs">
                        {itemSummaries.map((item) => (
                          <div
                            key={item.key}
                            className="flex items-center justify-between text-slate-700"
                          >
                            <span className="truncate">{item.name}</span>
                            <span className="font-semibold text-slate-800">
                              Qty {item.quantity} • ₹{item.total.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3 border-b border-yellow-500/20 pb-2">
                    <span className="text-sm font-medium text-slate-600">Tax</span>
                    <div className="flex flex-1 flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <Select value={taxRateSelectValue} onValueChange={handleTaxRateSelect}>
                          <SelectTrigger className="h-8 w-[120px] border-yellow-500/30 bg-white text-xs">
                            <SelectValue placeholder="Select %" />
                          </SelectTrigger>
                          <SelectContent>
                            {taxRateOptions.map((rate) => (
                              <SelectItem key={rate} value={rate}>
                                {rate}%
                              </SelectItem>
                            ))}
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="font-semibold text-slate-800">
                          ₹{taxAmount.toFixed(2)}
                        </span>
                      </div>
                      {useCustomTaxRate && (
                        <div className="w-[120px]">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step="0.01"
                            placeholder="Custom %"
                            value={formState.orderTaxRate}
                            onChange={(event) => {
                              setUseCustomTaxRate(true);
                              handleChange('orderTaxRate', event.target.value);
                            }}
                            className="h-8 border-yellow-500/30 bg-white text-xs"
                          />
                          <FieldError message={errors.orderTaxRate} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between border-b border-yellow-500/20 pb-2">
                    <span className="text-sm font-medium text-slate-600">Shipping</span>
                    <span className="font-semibold text-slate-800">
                      ₹{shippingAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-yellow-500/20 pb-2">
                    <span className="text-sm font-medium text-slate-600">{discountLabel}</span>
                    <span className="font-semibold text-red-600">
                      -₹{discountAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-4 flex justify-between rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500 p-3">
                    <span className="font-bold text-slate-900">Order Total</span>
                    <span className="text-lg font-bold text-slate-900">
                      ₹{orderTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 rounded-md bg-white/60 p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Quick Stats
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Status</div>
                      <div className="font-semibold text-slate-800">{formState.orderStatus}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Payment</div>
                      <div className="font-semibold text-slate-800">{formState.paymentStatus}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Items</div>
                      <div className="font-semibold text-slate-800">{items.length}</div>
                    </div>
                  </div>
                </div>
              </div>

              <OrderFormFooter formState={formState} submitting={submitting} />
            </div>
          </div>
        </div>
      </form>
      <SaveDraftDialog
        open={showDraftDialog}
        onOpenChange={setShowDraftDialog}
        entityType="Order"
        onSaveDraft={async () => {
          const success = await saveDraft();

          if (success && pendingNavigation) {
            pendingNavigation();
            setPendingNavigation(null);
          }

          return success;
        }}
        onDiscardChanges={() => {
          if (pendingNavigation) {
            pendingNavigation();
            setPendingNavigation(null);
          }
        }}
        onCancel={() => {
          setPendingNavigation(null);
        }}
        isDirty={hasUnsavedChanges}
        formData={formState as Record<string, unknown>}
      />
      <AlertDialog
        open={showBackOrderResolutionDialog}
        onOpenChange={setShowBackOrderResolutionDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Additional stock is now available</AlertDialogTitle>
            <AlertDialogDescription>
              Additional stock has arrived for one or more outstanding items. Do you want to reduce
              the outstanding quantity or keep the current requested quantity?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">Eligible items</p>
            <ul className="mt-1 list-disc pl-4">
              {backOrderResolutionCandidates.map((candidate) => (
                <li key={`${candidate.index}-${candidate.name}`}>
                  {candidate.name}: {candidate.fulfillableQuantity} item
                  {candidate.fulfillableQuantity === 1 ? '' : 's'} ready now
                </li>
              ))}
            </ul>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelBackOrders}>Reduce Quantity</AlertDialogCancel>
            <AlertDialogAction onClick={handleProceedBackOrders}>Keep Quantity</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showEmptyCartDialog} onOpenChange={setShowEmptyCartDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cart is empty</AlertDialogTitle>
            <AlertDialogDescription>
              At least one item should be available in the cart.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowEmptyCartDialog(false)}>Ok</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
