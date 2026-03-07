import type { OrderItemForm } from './order-form-types';

export type OrderItemBillingBreakdown = {
  requestedQuantity: number;
  billableQuantity: number;
  backOrderQuantity: number;
  availableQuantity: number | null;
  stockScopeLabel: 'product' | 'variant';
};

const normalizeNonNegativeInteger = (value: number | undefined) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value as number));
};

const parseRequestedQuantity = (quantity: string) => {
  const parsed = Number.parseInt(quantity, 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, parsed);
};

const asNullableId = (value: number | undefined) => (typeof value === 'number' ? value : null);

const isSameStockTargetAsInitial = (item: OrderItemForm) => {
  if (typeof item.id !== 'number') return false;

  return (
    asNullableId(item.initialProductId ?? item.productId) === asNullableId(item.productId) &&
    asNullableId(item.initialVariantId ?? item.variantId) === asNullableId(item.variantId)
  );
};

export const getOrderItemBillingBreakdown = (item: OrderItemForm): OrderItemBillingBreakdown => {
  const requestedQuantity = parseRequestedQuantity(item.quantity);

  if (item.itemType !== 'product') {
    return {
      requestedQuantity,
      billableQuantity: requestedQuantity,
      backOrderQuantity: 0,
      availableQuantity: null,
      stockScopeLabel: item.variantId ? 'variant' : 'product',
    };
  }

  const availableQuantity =
    typeof item.availableQuantity === 'number' ? Math.max(0, item.availableQuantity) : null;

  if (availableQuantity === null) {
    return {
      requestedQuantity,
      billableQuantity: requestedQuantity,
      backOrderQuantity: 0,
      availableQuantity: null,
      stockScopeLabel: item.variantId ? 'variant' : 'product',
    };
  }

  const existingReservedQuantity = isSameStockTargetAsInitial(item)
    ? normalizeNonNegativeInteger(item.existingQuantity)
    : 0;

  const maxBillableQuantity = availableQuantity + existingReservedQuantity;
  const billableQuantity = Math.min(requestedQuantity, maxBillableQuantity);
  const backOrderQuantity = Math.max(requestedQuantity - billableQuantity, 0);

  return {
    requestedQuantity,
    billableQuantity,
    backOrderQuantity,
    availableQuantity,
    stockScopeLabel: item.variantId ? 'variant' : 'product',
  };
};
