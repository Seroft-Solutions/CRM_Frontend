'use client';

import type { OrderFulfillmentGenerationResponse } from '@/core/api/order-fulfillment-generations';
import type { AddressFields, OrderRecord } from '../data/order-data';

export function formatOrderDateTime(value?: string) {
  if (!value) return '—';
  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? '—' : parsed.toLocaleString();
}

export function formatOrderCurrency(amount?: number) {
  return (amount ?? 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
}

export function getFulfillmentRecordLabel(
  orderId: number,
  options?: { invoiceId?: number; generationNumber?: number }
) {
  const invoiceNumber = options?.generationNumber ?? options?.invoiceId ?? '—';

  return `Order Invoice ${invoiceNumber}_${orderId}`;
}

export function getOrderDiscountAmount(order: OrderRecord) {
  if (!order.discountCode) {
    return 0;
  }

  const shippingAmount = order.shipping.shippingAmount ?? 0;
  const totalAmount = order.orderTotalAmount ?? 0;
  const taxRate = order.orderTaxRate ?? 0;
  const divisor = 1 + taxRate / 100;

  if (divisor <= 0) {
    return 0;
  }

  const taxableAmount = Math.max((totalAmount - shippingAmount) / divisor, 0);

  return Math.max(order.orderBaseAmount - taxableAmount, 0);
}

export function getOrderFulfillmentTotalAmount(
  order: OrderRecord,
  generation: OrderFulfillmentGenerationResponse
) {
  const invoiceSubtotal = (generation.items ?? []).reduce((sum, item) => {
    const deliveredQuantity = item.deliveredQuantity ?? item.requestedQuantity ?? 0;
    const unitPrice =
      order.items.find((candidate) => candidate.orderDetailId === item.orderDetailId)?.itemPrice ??
      0;

    return sum + deliveredQuantity * unitPrice;
  }, 0);

  const fulfillmentShare =
    order.orderBaseAmount > 0 ? Math.min(invoiceSubtotal / order.orderBaseAmount, 1) : 0;
  const allocatedDiscountAmount = getOrderDiscountAmount(order) * fulfillmentShare;
  const allocatedShippingAmount = (order.shipping.shippingAmount ?? 0) * fulfillmentShare;
  const taxableAmount = Math.max(invoiceSubtotal - allocatedDiscountAmount, 0);
  const taxAmount = (order.orderTaxRate / 100) * taxableAmount;

  return Math.max(taxableAmount + taxAmount + allocatedShippingAmount, 0);
}

export function getCustomerDisplayName(order: OrderRecord) {
  return (
    order.customer?.customerBusinessName || order.customer?.contactPerson || order.email || '—'
  );
}

export function getAddressLines(address?: AddressFields) {
  if (!address) return [];

  return [
    [address.firstName, address.middleName, address.lastName].filter(Boolean).join(' ').trim(),
    address.addrLine1,
    address.addrLine2,
    [address.city, address.state, address.zipcode].filter(Boolean).join(', ').trim(),
    address.country,
    address.phone ? `Phone: ${address.phone}` : undefined,
    address.email ? `Email: ${address.email}` : undefined,
  ].filter((line): line is string => Boolean(line && line.trim()));
}
