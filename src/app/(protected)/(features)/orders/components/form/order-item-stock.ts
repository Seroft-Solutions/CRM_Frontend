import type { OrderItemForm } from './order-form-types';

export type OrderItemBillingBreakdown = {
  requestedQuantity: number;
  billableQuantity: number;
  backOrderQuantity: number;
  availableQuantity: number | null;
  stockScopeLabel: 'product' | 'variant';
};

const parseRequestedQuantity = (quantity: string) => {
  const parsed = Number.parseInt(quantity, 10);

  if (!Number.isFinite(parsed)) return 0;

  return Math.max(0, parsed);
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

  return {
    requestedQuantity,
    billableQuantity: requestedQuantity,
    backOrderQuantity: 0,
    availableQuantity,
    stockScopeLabel: item.variantId ? 'variant' : 'product',
  };
};
