'use client';

import type { PurchaseOrderFulfillmentGenerationResponse } from '@/core/api/purchase-order-fulfillment-generations';
import type { AddressFields, OrderRecord } from '../data/purchase-order-data';

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

  return `Purchase Invoice ${invoiceNumber}_${orderId}`;
}

export function getSundryCreditorDisplayName(order: OrderRecord) {
  return order.sundryCreditor?.creditorName || order.email || '—';
}

export function getPurchaseOrderFulfillmentTotalAmount(
  order: OrderRecord,
  generation: PurchaseOrderFulfillmentGenerationResponse
) {
  const invoiceSubtotal = (generation.items ?? []).reduce((sum, item) => {
    const receivedQuantity = item.deliveredQuantity ?? item.requestedQuantity ?? 0;
    const unitPrice =
      order.items.find((candidate) => candidate.orderDetailId === item.orderDetailId)?.itemPrice ??
      0;

    return sum + receivedQuantity * unitPrice;
  }, 0);

  const fulfillmentShare =
    order.orderBaseAmount > 0 ? Math.min(invoiceSubtotal / order.orderBaseAmount, 1) : 0;
  const allocatedShippingAmount = (order.shipping.shippingAmount ?? 0) * fulfillmentShare;
  const taxableAmount = Math.max(invoiceSubtotal, 0);
  const taxAmount = (order.orderTaxRate / 100) * taxableAmount;

  return Math.max(taxableAmount + taxAmount + allocatedShippingAmount, 0);
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
