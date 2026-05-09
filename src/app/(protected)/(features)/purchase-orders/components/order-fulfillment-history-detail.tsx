'use client';

import { useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Loader2, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { useOrganizationDetails, useUserOrganizations } from '@/hooks/useUserOrganizations';
import type { PurchaseOrderFulfillmentGenerationResponse } from '@/core/api/purchase-order-fulfillment-generations';
import type { OrderRecord } from '../data/purchase-order-data';
import {
  formatOrderCurrency,
  getAddressLines,
  getFulfillmentRecordLabel,
  getSundryCreditorDisplayName,
} from './order-fulfillment-utils';

interface OrderFulfillmentHistoryDetailProps {
  order: OrderRecord;
  generation: PurchaseOrderFulfillmentGenerationResponse;
  generations: PurchaseOrderFulfillmentGenerationResponse[];
}

type SundryCreditorWithAddress = NonNullable<OrderRecord['sundryCreditor']> & {
  completeAddress?: string | null;
};

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

      cloneNode.style.setProperty(property, resolvedValue);
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
  generations,
}: OrderFulfillmentHistoryDetailProps) {
  const printContainerRef = useRef<HTMLDivElement>(null);
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

  const handlePrintInvoice = useReactToPrint({
    contentRef: printContainerRef,
    documentTitle: invoiceLabel.replace(/\s+/g, '-'),
    pageStyle: `
      @page { size: A4 portrait; margin: 0; }
      html, body { margin: 0 !important; padding: 0 !important; }
      body {
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #order-fulfillment-print-card,
      #order-fulfillment-print-card * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #order-fulfillment-print-card {
        overflow: visible !important;
        background: #ffffff !important;
      }
    `,
  });

  const creditor = order.sundryCreditor as SundryCreditorWithAddress | undefined;
  const creditorName = getSundryCreditorDisplayName(order);
  const creditorPhone = creditor?.mobile || order.phone || '—';
  const creditorEmail = creditor?.email || order.email || '—';
  const shipToLines = stripContactLines(getAddressLines(order.address.shipTo));
  const billToLines = order.address.billToSameAsShip
    ? shipToLines
    : stripContactLines(getAddressLines(order.address.billTo));
  const shipToPhone = order.address.shipTo.phone || creditorPhone;
  const shipToEmail = order.address.shipTo.email || creditorEmail;
  const billToPhone = order.address.billTo.phone || creditorPhone;
  const billToEmail = order.address.billTo.email || creditorEmail;
  const shipToAddress = compactJoin(shipToLines, ', ') || '—';
  const billToAddress = compactJoin(billToLines, ', ') || '—';
  const creditorContactPerson = creditor?.contactPerson?.trim() || billToPhone;
  const creditorWhatsApp = creditor?.whatsApp?.trim() || billToPhone;
  const creditorAddress =
    creditor?.completeAddress?.trim() || billToAddress || shipToAddress || '—';

  const receivedQuantityByOrderDetailId = useMemo(() => {
    const receivedMap = new Map<number, number>();

    generations.forEach((entry) => {
      entry.items?.forEach((item) => {
        if (typeof item.orderDetailId !== 'number') {
          return;
        }

        receivedMap.set(
          item.orderDetailId,
          (receivedMap.get(item.orderDetailId) ?? 0) + Math.max(0, item.deliveredQuantity ?? 0)
        );
      });
    });

    return receivedMap;
  }, [generations]);

  const originalOrderQuantityByOrderDetailId = useMemo(() => {
    const originalQuantityMap = new Map<number, number>();

    order.items.forEach((item) => {
      const remainingQuantity = Math.max(0, item.quantity);
      const receivedQuantity = receivedQuantityByOrderDetailId.get(item.orderDetailId) ?? 0;

      originalQuantityMap.set(item.orderDetailId, remainingQuantity + receivedQuantity);
    });

    return originalQuantityMap;
  }, [order.items, receivedQuantityByOrderDetailId]);

  const invoiceItems = useMemo(() => {
    return (generation.items ?? []).map((item, index) => {
      const orderItem = order.items.find(
        (candidate) => candidate.orderDetailId === item.orderDetailId
      );
      const receivedQuantity = item.deliveredQuantity ?? item.requestedQuantity ?? 0;
      const unitPrice = orderItem?.itemPrice ?? 0;

      return {
        id: item.id ?? item.orderDetailId ?? index,
        productName:
          item.productName ||
          orderItem?.productName ||
          `Order item #${item.orderDetailId ?? index + 1}`,
        sku: item.sku || orderItem?.sku || '—',
        variantAttributes: orderItem?.variantAttributes || '',
        orderedQuantity:
          originalOrderQuantityByOrderDetailId.get(item.orderDetailId ?? -1) ??
          item.requestedQuantity ??
          0,
        receivedQuantity,
        backlogLeft: item.remainingBacklogQuantity ?? 0,
        unitPrice,
        lineTotal: receivedQuantity * unitPrice,
      };
    });
  }, [generation.items, order.items, originalOrderQuantityByOrderDetailId]);

  const invoiceSubtotal = useMemo(
    () => invoiceItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [invoiceItems]
  );
  const fulfillmentShare =
    order.orderBaseAmount > 0 ? Math.min(invoiceSubtotal / order.orderBaseAmount, 1) : 0;
  const allocatedShippingAmount = (order.shipping.shippingAmount ?? 0) * fulfillmentShare;
  const taxableAmount = Math.max(invoiceSubtotal, 0);
  const taxAmount = (order.orderTaxRate / 100) * taxableAmount;
  const invoiceGrandTotal = Math.max(taxableAmount + taxAmount + allocatedShippingAmount, 0);

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
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => handlePrintInvoice()}
          className="gap-2"
        >
          <Printer className="h-4 w-4" />
          Print Invoice
        </Button>
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

      <div
        ref={printContainerRef}
        id="order-fulfillment-print-card"
        className="overflow-hidden border border-slate-300 bg-white"
      >
        <div
          ref={invoiceRef}
          id="order-fulfillment-invoice"
          className="box-border min-h-[297mm] bg-white p-[7mm] text-[10px] leading-tight text-slate-900"
        >
          <style>
            {`
              #order-fulfillment-invoice .invoice-table {
                border-collapse: collapse;
                table-layout: fixed;
                width: 100%;
              }
              #order-fulfillment-invoice .invoice-table th,
              #order-fulfillment-invoice .invoice-table td {
                border: 1px solid #334155;
              }
              #order-fulfillment-invoice .invoice-avoid-break {
                break-inside: avoid;
                page-break-inside: avoid;
              }
            `}
          </style>

          <div className="mb-2 flex items-start justify-between border-b-2 border-slate-900 pb-1">
            <h1 className="text-xl font-black uppercase text-slate-950">
              Purchase Fulfillment Invoice
            </h1>
            <div className="text-right text-[9px] font-semibold uppercase text-slate-700">
              <div>{invoiceLabel}</div>
              <div>Date: {formatInvoiceDate(generation.createdDate) || '-'}</div>
            </div>
          </div>

          <table className="invoice-table mb-2">
            <tbody>
              <tr>
                <th className="w-[14%] bg-slate-100 px-1 py-1 text-left font-bold uppercase">
                  Purchase Order
                </th>
                <td className="w-[18%] px-1 py-1 font-semibold">#{order.orderId}</td>
                <th className="w-[12%] bg-slate-100 px-1 py-1 text-left font-bold uppercase">
                  Created By
                </th>
                <td className="w-[20%] px-1 py-1 font-semibold">
                  {generation.createdBy || 'System'}
                </td>
                <th className="w-[12%] bg-slate-100 px-1 py-1 text-left font-bold uppercase">
                  Status
                </th>
                <td className="w-[24%] px-1 py-1 font-semibold uppercase">
                  {order.orderStatus || '-'}
                </td>
              </tr>
            </tbody>
          </table>

          <table className="invoice-table mb-2">
            <thead>
              <tr className="bg-slate-100">
                <th className="w-1/4 px-1 py-1 text-left font-bold uppercase">Billing From</th>
                <th className="w-1/4 px-1 py-1 text-left font-bold uppercase">Sundry Creditor</th>
                <th className="w-1/4 px-1 py-1 text-left font-bold uppercase">Ship To</th>
                <th className="w-1/4 px-1 py-1 text-left font-bold uppercase">Bill To</th>
              </tr>
            </thead>
            <tbody>
              <tr className="align-top">
                <td className="px-1.5 py-1">
                  <div className="break-words font-bold">{organizationName || 'Organization'}</div>
                  <div className="break-all">{organizationEmail || '-'}</div>
                </td>
                <td className="px-1.5 py-1">
                  <div className="break-words font-bold">{creditorName}</div>
                  <div className="break-all">{creditorPhone}</div>
                  <div className="break-all">{creditorEmail}</div>
                  <div className="break-words">{creditorAddress}</div>
                </td>
                <td className="px-1.5 py-1">
                  <div className="break-words font-bold">{creditorName}</div>
                  <div className="break-all">{shipToPhone}</div>
                  <div className="break-all">{shipToEmail}</div>
                  <div className="break-words">{shipToAddress}</div>
                </td>
                <td className="px-1.5 py-1">
                  <div className="break-words font-bold">{creditorName}</div>
                  <div className="break-all">{billToPhone}</div>
                  <div className="break-all">{billToEmail}</div>
                  <div className="break-words">{billToAddress}</div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mb-2">
            <table className="invoice-table text-left text-[9px]">
              <thead>
                <tr className="bg-slate-100">
                  <th className="w-[4%] px-1 py-1 text-center font-bold uppercase">#</th>
                  <th className="w-[24%] px-1 py-1 font-bold uppercase">Product</th>
                  <th className="w-[11%] px-1 py-1 font-bold uppercase">SKU</th>
                  <th className="w-[17%] px-1 py-1 font-bold uppercase">Variant</th>
                  <th className="w-[8%] px-1 py-1 text-center font-bold uppercase">Ordered</th>
                  <th className="w-[8%] px-1 py-1 text-center font-bold uppercase">Received</th>
                  <th className="w-[8%] px-1 py-1 text-center font-bold uppercase">Remain</th>
                  <th className="w-[10%] px-1 py-1 text-right font-bold uppercase">Unit</th>
                  <th className="w-[10%] px-1 py-1 text-right font-bold uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoiceItems.length > 0 ? (
                  invoiceItems.map((item, index) => (
                    <tr key={item.id} className="invoice-avoid-break align-top">
                      <td className="px-1 py-0.5 text-center font-semibold">{index + 1}</td>
                      <td className="break-words px-1 py-0.5 font-semibold">{item.productName}</td>
                      <td className="break-all px-1 py-0.5">{item.sku || '-'}</td>
                      <td className="break-words px-1 py-0.5">{item.variantAttributes || '-'}</td>
                      <td className="px-1 py-0.5 text-center font-semibold">
                        {item.orderedQuantity}
                      </td>
                      <td className="px-1 py-0.5 text-center font-semibold">
                        {item.receivedQuantity}
                      </td>
                      <td className="px-1 py-0.5 text-center font-semibold">{item.backlogLeft}</td>
                      <td className="px-1 py-0.5 text-right">
                        {formatOrderCurrency(item.unitPrice)}
                      </td>
                      <td className="px-1 py-0.5 text-right font-bold">
                        {formatOrderCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-1 py-4 text-center text-slate-500">
                      No fulfillment line items were returned for this invoice.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-[1fr_45%] gap-2">
            <table className="invoice-table text-[10px]">
              <tbody>
                <tr>
                  <th className="w-[28%] bg-slate-100 px-1 py-1 text-left font-bold uppercase">
                    Business
                  </th>
                  <td className="px-1 py-1">{creditorName}</td>
                </tr>
                <tr>
                  <th className="bg-slate-100 px-1 py-1 text-left font-bold uppercase">Contact</th>
                  <td className="px-1 py-1">{creditorContactPerson || '-'}</td>
                </tr>
                <tr>
                  <th className="bg-slate-100 px-1 py-1 text-left font-bold uppercase">WhatsApp</th>
                  <td className="px-1 py-1">{creditorWhatsApp || '-'}</td>
                </tr>
                <tr>
                  <th className="bg-slate-100 px-1 py-1 text-left font-bold uppercase">Payment</th>
                  <td className="px-1 py-1">{order.paymentStatus || '-'}</td>
                </tr>
              </tbody>
            </table>

            <table className="invoice-table text-[10px]">
              <tbody>
                <tr>
                  <th className="bg-slate-100 px-1 py-1 text-left font-bold uppercase">Subtotal</th>
                  <td className="px-1 py-1 text-right font-semibold">
                    {formatOrderCurrency(invoiceSubtotal)}
                  </td>
                </tr>
                <tr>
                  <th className="bg-slate-100 px-1 py-1 text-left font-bold uppercase">
                    Taxable Amount
                  </th>
                  <td className="px-1 py-1 text-right font-semibold">
                    {formatOrderCurrency(taxableAmount)}
                  </td>
                </tr>
                <tr>
                  <th className="bg-slate-100 px-1 py-1 text-left font-bold uppercase">Tax</th>
                  <td className="px-1 py-1 text-right font-semibold">
                    {formatOrderCurrency(taxAmount)}
                  </td>
                </tr>
                <tr>
                  <th className="bg-slate-100 px-1 py-1 text-left font-bold uppercase">Shipping</th>
                  <td className="px-1 py-1 text-right font-semibold">
                    {formatOrderCurrency(allocatedShippingAmount)}
                  </td>
                </tr>
                <tr>
                  <th className="bg-slate-200 px-1 py-1 text-left text-xs font-black uppercase">
                    Grand Total
                  </th>
                  <td className="bg-slate-200 px-1 py-1 text-right text-xs font-black">
                    {formatOrderCurrency(invoiceGrandTotal)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
