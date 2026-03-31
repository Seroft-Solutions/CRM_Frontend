'use client';

import { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrganizationDetails, useUserOrganizations } from '@/hooks/useUserOrganizations';
import type { OrderFulfillmentGenerationResponse } from '@/core/api/order-fulfillment-generations';
import type { OrderRecord } from '../data/order-data';
import {
  formatOrderCurrency,
  getAddressLines,
  getCustomerDisplayName,
  getFulfillmentRecordLabel,
  getOrderDiscountAmount,
} from './order-fulfillment-utils';

interface OrderFulfillmentHistoryDetailProps {
  order: OrderRecord;
  generation: OrderFulfillmentGenerationResponse;
}

const compactJoin = (parts: Array<string | undefined>, separator = ', ') =>
  parts
    .map((part) => (part ?? '').trim())
    .filter((part) => part.length > 0)
    .join(separator);

const stripContactLines = (lines: string[]) =>
  lines.filter((line) => !line.startsWith('Phone:') && !line.startsWith('Email:'));

const resolveOrganizationName = (organizations?: Array<{ id: string; name: string }>) => {
  if (typeof window === 'undefined') return '';

  const selectedOrgName = localStorage.getItem('selectedOrganizationName');

  if (selectedOrgName) return selectedOrgName;

  const selectedOrgId = localStorage.getItem('selectedOrganizationId');

  if (selectedOrgId && organizations?.length) {
    const selectedOrg = organizations.find((org) => org.id === selectedOrgId);

    if (selectedOrg) return selectedOrg.name;
  }

  return organizations?.[0]?.name || '';
};

const resolveOrganizationId = (organizations?: Array<{ id: string; name: string }>) => {
  if (typeof window === 'undefined') return '';

  const selectedOrgId = localStorage.getItem('selectedOrganizationId');

  if (selectedOrgId) return selectedOrgId;

  const selectedOrgName = localStorage.getItem('selectedOrganizationName');

  if (selectedOrgName && organizations?.length) {
    const selectedOrg = organizations.find((org) => org.name === selectedOrgName);

    if (selectedOrg) return selectedOrg.id;
  }

  return organizations?.[0]?.id || '';
};

const formatInvoiceDate = (value?: string) => {
  if (!value) return '';
  const trimmed = value.trim();

  if (!trimmed) return '';

  const [datePart] = trimmed.split('T');

  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    return datePart;
  }

  const parsed = new Date(trimmed);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return trimmed;
};

const COLOR_PROPERTIES = [
  'color',
  'background-color',
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
  'text-decoration-color',
  'caret-color',
  'column-rule-color',
] as const;

const SHADOW_PROPERTIES = ['box-shadow', 'text-shadow'] as const;

const BACKGROUND_PROPERTIES = ['background-image'] as const;

const normalizeCssColor = (value: string, fallback: string) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    return fallback;
  }

  try {
    context.fillStyle = fallback;
    context.fillStyle = value;

    return context.fillStyle || fallback;
  } catch {
    return fallback;
  }
};

const sanitizeColorValue = (value: string, fallback = '#0f172a') => {
  if (!value || value === 'initial' || value === 'inherit' || value === 'unset') {
    return value;
  }

  if (value.includes('oklch(')) {
    return normalizeCssColor(value, fallback);
  }

  return value;
};

const prepareCloneForPdf = (source: HTMLElement, cloneRoot: HTMLElement) => {
  const sourceNodes = [source, ...Array.from(source.querySelectorAll<HTMLElement>('*'))];
  const cloneNodes = [cloneRoot, ...Array.from(cloneRoot.querySelectorAll<HTMLElement>('*'))];

  cloneRoot.style.backgroundColor = '#ffffff';
  cloneRoot.style.color = '#0f172a';

  sourceNodes.forEach((sourceNode, index) => {
    const cloneNode = cloneNodes[index];

    if (!cloneNode) {
      return;
    }

    const computedStyle = window.getComputedStyle(sourceNode);

    Array.from(computedStyle).forEach((property) => {
      if (property.startsWith('--')) {
        return;
      }

      let resolvedValue = computedStyle.getPropertyValue(property);

      if (!resolvedValue) {
        return;
      }

      if (COLOR_PROPERTIES.includes(property as (typeof COLOR_PROPERTIES)[number])) {
        const fallback = property === 'background-color' ? '#ffffff' : '#0f172a';

        resolvedValue = sanitizeColorValue(resolvedValue, fallback);
      }

      if (
        SHADOW_PROPERTIES.includes(property as (typeof SHADOW_PROPERTIES)[number]) &&
        resolvedValue.includes('oklch(')
      ) {
        resolvedValue = 'none';
      }

      if (
        BACKGROUND_PROPERTIES.includes(property as (typeof BACKGROUND_PROPERTIES)[number]) &&
        resolvedValue.includes('oklch(')
      ) {
        resolvedValue = 'none';
      }

      if (resolvedValue.includes('oklch(')) {
        return;
      }

      if (resolvedValue) {
        cloneNode.style.setProperty(property, resolvedValue);
      }
    });

    cloneNode.className = '';
    cloneNode.style.boxShadow = 'none';

    if (computedStyle.backgroundImage && computedStyle.backgroundImage !== 'none') {
      cloneNode.style.backgroundImage = 'none';
    }
  });
};

export function OrderFulfillmentHistoryDetail({
  order,
  generation,
}: OrderFulfillmentHistoryDetailProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { data: organizations } = useUserOrganizations();
  const organizationName = useMemo(() => resolveOrganizationName(organizations), [organizations]);
  const organizationId = useMemo(() => resolveOrganizationId(organizations), [organizations]);
  const { data: organizationDetails } = useOrganizationDetails(organizationId);
  const organizationEmail = useMemo(
    () => organizationDetails?.attributes?.organizationEmail?.[0] || '',
    [organizationDetails]
  );

  const invoiceLabel = getFulfillmentRecordLabel(order.orderId, {
    invoiceId: generation.id,
    generationNumber: generation.generationNumber,
  });
  const customer = order.customer;
  const customerName = getCustomerDisplayName(order);
  const customerPhone = customer?.mobile || order.phone || '—';
  const customerEmail = customer?.email || order.email || '—';
  const shipToLines = stripContactLines(getAddressLines(order.address.shipTo));
  const billToLines = order.address.billToSameAsShip
    ? shipToLines
    : stripContactLines(getAddressLines(order.address.billTo));
  const shipToPhone = order.address.shipTo.phone || customerPhone;
  const shipToEmail = order.address.shipTo.email || customerEmail;
  const billToPhone = order.address.billTo.phone || customerPhone;
  const billToEmail = order.address.billTo.email || customerEmail;
  const shipToAddress = compactJoin(shipToLines, ', ') || '—';
  const billToAddress = compactJoin(billToLines, ', ') || '—';
  const customerContactPerson = customer?.contactPerson?.trim() || billToPhone;
  const customerWhatsApp = customer?.whatsApp?.trim() || billToPhone;
  const customerAddress =
    customer?.completeAddress?.trim() ||
    customer?.defaultAddress?.completeAddress?.trim() ||
    (billToAddress !== '—' ? billToAddress : '') ||
    (shipToAddress !== '—' ? shipToAddress : '') ||
    '—';
  const discountAmount = getOrderDiscountAmount(order);
  const taxableAmount = Math.max(order.orderBaseAmount - discountAmount, 0);
  const taxAmount = (order.orderTaxRate / 100) * taxableAmount;

  const invoiceItems = useMemo(() => {
    return (generation.items ?? []).map((item, index) => {
      const orderItem = order.items.find(
        (candidate) => candidate.orderDetailId === item.orderDetailId
      );
      const deliveredQuantity = item.deliveredQuantity ?? item.requestedQuantity ?? 0;
      const unitPrice = orderItem?.itemPrice ?? 0;

      return {
        id: item.id ?? item.orderDetailId ?? index,
        productName:
          item.productName ||
          orderItem?.productName ||
          `Order item #${item.orderDetailId ?? index + 1}`,
        sku: item.sku || orderItem?.sku || '—',
        variantAttributes: orderItem?.variantAttributes || '',
        requestedQuantity: item.requestedQuantity ?? 0,
        deliveredQuantity,
        backlogLeft: item.remainingBacklogQuantity ?? 0,
        unitPrice,
        lineTotal: deliveredQuantity * unitPrice,
      };
    });
  }, [generation.items, order.items]);

  const handleDownloadPdf = async () => {
    if (!invoiceRef.current || isDownloading) {
      return;
    }

    setIsDownloading(true);
    let renderHost: HTMLDivElement | null = null;
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    const originalHtmlBackground = htmlElement.style.backgroundColor;
    const originalHtmlColor = htmlElement.style.color;
    const originalBodyBackground = bodyElement.style.backgroundColor;
    const originalBodyColor = bodyElement.style.color;

    try {
      const sanitizedClone = invoiceRef.current.cloneNode(true) as HTMLDivElement;

      renderHost = document.createElement('div');

      renderHost.style.position = 'fixed';
      renderHost.style.left = '-100000px';
      renderHost.style.top = '0';
      renderHost.style.pointerEvents = 'none';
      renderHost.style.backgroundColor = '#ffffff';
      renderHost.appendChild(sanitizedClone);

      htmlElement.style.backgroundColor = '#ffffff';
      htmlElement.style.color = '#0f172a';
      bodyElement.style.backgroundColor = '#ffffff';
      bodyElement.style.color = '#0f172a';

      document.body.appendChild(renderHost);

      prepareCloneForPdf(invoiceRef.current, sanitizedClone);

      const canvas = await html2canvas(sanitizedClone, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageWidth = pageWidth;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;
      let heightLeft = imageHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imageWidth, imageHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imageWidth, imageHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${invoiceLabel.replace(/\s+/g, '-')}.pdf`);
    } finally {
      htmlElement.style.backgroundColor = originalHtmlBackground;
      htmlElement.style.color = originalHtmlColor;
      bodyElement.style.backgroundColor = originalBodyBackground;
      bodyElement.style.color = originalBodyColor;

      if (renderHost && document.body.contains(renderHost)) {
        document.body.removeChild(renderHost);
      }

      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isDownloading}
          className="gap-2 bg-slate-900 text-white hover:bg-slate-800"
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {isDownloading ? 'Preparing PDF...' : 'Download PDF'}
        </Button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div ref={invoiceRef} id="order-fulfillment-invoice" className="p-8">
          <style>
            {`
              #order-fulfillment-invoice {
                background: #ffffff !important;
                color: #000000 !important;
              }

              #order-fulfillment-invoice,
              #order-fulfillment-invoice * {
                color: #000000 !important;
                border-color: #000000 !important;
                box-shadow: none !important;
                text-shadow: none !important;
              }

              #order-fulfillment-invoice .invoice-muted-bg {
                background: #f4f4f5 !important;
              }

              #order-fulfillment-invoice .invoice-white-bg {
                background: #ffffff !important;
              }
            `}
          </style>
          <div className="border-b-2 border-slate-200 pb-6">
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                Order Fulfillment Invoice
              </div>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <h1 className="text-3xl font-black tracking-tight text-slate-950">
                  {invoiceLabel}
                </h1>
                <div className="text-sm text-slate-700">
                  <div>
                    <span className="font-semibold text-slate-950">Date:</span>{' '}
                    {formatInvoiceDate(generation.createdDate)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 border-b border-slate-200 py-6 lg:grid-cols-4">
            <div className="space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Billing From
              </div>
              <div className="space-y-1 text-sm text-slate-700">
                <div className="font-semibold text-slate-950">
                  {organizationName || 'Organization'}
                </div>
                <div>{organizationEmail || '—'}</div>
                <div>Created By: {generation.createdBy || 'System'}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Bill To
              </div>
              <div className="space-y-1 text-sm text-slate-700">
                <div className="font-semibold text-slate-950">{customerName}</div>
                <div>{billToPhone}</div>
                <div>{billToEmail}</div>
                <div className="leading-6">{billToAddress}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Ship To
              </div>
              <div className="space-y-1 text-sm text-slate-700">
                <div className="font-semibold text-slate-950">{customerName}</div>
                <div>{shipToPhone}</div>
                <div>{shipToEmail}</div>
                <div className="leading-6">{shipToAddress}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Shipping Data
              </div>
              <div className="space-y-1 text-sm text-slate-700">
                <div>
                  <span className="font-semibold text-slate-950">Method:</span>{' '}
                  {order.shipping.shippingMethod || '—'}
                </div>
                <div>
                  <span className="font-semibold text-slate-950">Tracking ID:</span>{' '}
                  {order.shipping.shippingId || '—'}
                </div>
                <div>
                  <span className="font-semibold text-slate-950">Payment:</span>{' '}
                  {order.paymentStatus}
                </div>
                <div>
                  <span className="font-semibold text-slate-950">Order Status:</span>{' '}
                  {order.orderStatus}
                </div>
              </div>
            </div>
          </div>

          <div className="py-6">
            <div className="invoice-white-bg overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-left">
                <thead className="invoice-muted-bg">
                  <tr>
                    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Item Details
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Requested
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Delivered
                    </th>
                    <th className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Outstanding After
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoiceItems.length > 0 ? (
                    invoiceItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-950">{item.productName}</div>
                          <div className="mt-1 text-xs text-slate-500">SKU: {item.sku}</div>
                          {item.variantAttributes ? (
                            <div className="mt-1 text-xs text-slate-400">
                              {item.variantAttributes}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 text-center text-sm font-medium text-slate-700">
                          {item.requestedQuantity}
                        </td>
                        <td className="px-4 py-4 text-center text-sm font-medium text-emerald-700">
                          {item.deliveredQuantity}
                        </td>
                        <td className="px-4 py-4 text-center text-sm text-amber-700">
                          {item.backlogLeft}
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-medium text-slate-700">
                          {formatOrderCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-4 text-right text-sm font-semibold text-slate-950">
                          {formatOrderCurrency(item.lineTotal)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                        No fulfillment line items were returned for this invoice.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-6 border-t border-slate-200 pt-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Customer Data
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-slate-700">
                    <div>Business: {customerName}</div>
                    {customerContactPerson ? <div>Contact: {customerContactPerson}</div> : null}
                    {customerWhatsApp ? <div>WhatsApp: {customerWhatsApp}</div> : null}
                    <div>Address: {customerAddress}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Order Data
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-slate-700">
                    <div>Base Amount: {formatOrderCurrency(order.orderBaseAmount)}</div>
                    <div>Tax Rate: {order.orderTaxRate.toFixed(2)}%</div>
                    <div>Shipping Amount: {formatOrderCurrency(order.shipping.shippingAmount)}</div>
                    <div>Discount Code: {order.discountCode || '—'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="invoice-muted-bg rounded-2xl border border-slate-200 p-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-950">
                    {formatOrderCurrency(order.orderBaseAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-rose-600">
                  <span>Discount</span>
                  <span className="font-semibold">- {formatOrderCurrency(discountAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Taxable Amount</span>
                  <span className="font-semibold text-slate-950">
                    {formatOrderCurrency(taxableAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Tax</span>
                  <span className="font-semibold text-slate-950">
                    {formatOrderCurrency(taxAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <span>Shipping</span>
                  <span className="font-semibold text-slate-950">
                    {formatOrderCurrency(order.shipping.shippingAmount)}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-black uppercase tracking-tight text-slate-950">
                      Grand Total
                    </span>
                    <span className="text-2xl font-black text-slate-950">
                      {formatOrderCurrency(order.orderTotalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
