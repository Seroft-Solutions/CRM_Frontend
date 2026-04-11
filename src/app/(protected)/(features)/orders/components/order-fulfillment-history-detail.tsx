'use client';

import { useMemo, useRef, useState } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download, Loader2, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import { useOrganizationDetails, useUserOrganizations } from '@/hooks/useUserOrganizations';
import type { OrderFulfillmentGenerationResponse } from '@/core/api/order-fulfillment-generations';
import { getGetProductVariantQueryOptions } from '@/core/api/generated/spring/endpoints/product-variant-resource/product-variant-resource.gen';
import { useGetAllProductVariantSelections } from '@/core/api/generated/spring/endpoints/product-variant-selection-resource/product-variant-selection-resource.gen';
import { useGetAllSystemConfigAttributeOptions } from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';
import type { ProductVariantDTO } from '@/core/api/generated/spring/schemas/ProductVariantDTO';
import type { ProductVariantSelectionDTO } from '@/core/api/generated/spring/schemas/ProductVariantSelectionDTO';
import { getOrganizationSettings } from '@/features/user-profile-management/services/organization-settings.service';
import type { OrderRecord } from '../data/order-data';
import {
  getAddressLines,
  getCustomerDisplayName,
  getFulfillmentRecordLabel,
  getOrderDiscountAmount,
} from './order-fulfillment-utils';

interface OrderFulfillmentHistoryDetailProps {
  order: OrderRecord;
  generation: OrderFulfillmentGenerationResponse;
  generations: OrderFulfillmentGenerationResponse[];
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

const formatInvoiceDisplayDate = (value?: string) => {
  if (!value) return '';

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return formatInvoiceDate(value);
  }

  const day = String(parsed.getDate()).padStart(2, '0');
  const month = parsed.toLocaleString('en-US', { month: 'short' });
  const year = parsed.getFullYear();

  return `${day}/${month}/${year}`;
};

const formatInvoiceNumberValue = (value?: number) => {
  const numericValue = value ?? 0;

  return Number.isInteger(numericValue)
    ? numericValue.toLocaleString('en-IN')
    : numericValue.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
};

const normalizeAttributeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');

const parseVariantAttributeEntries = (value?: string) => {
  if (!value) {
    return [];
  }

  const normalizedValue = value.replace(/\s+/g, ' ').trim();

  if (!normalizedValue) {
    return [];
  }

  const matches = Array.from(
    normalizedValue.matchAll(
      /([A-Za-z][A-Za-z\s/-]*)\s*:\s*([^,]+(?:,(?!\s*[A-Za-z][A-Za-z\s/-]*\s*:)[^,]+)*)/g
    )
  );

  if (matches.length > 0) {
    return matches.map((match) => ({
      key: match[1].trim(),
      value: match[2].trim(),
    }));
  }

  return normalizedValue
    .split(',')
    .map((segment) => {
      const [key, ...rest] = segment.split(':');

      if (!rest.length) {
        return null;
      }

      return {
        key: key.trim(),
        value: rest.join(':').trim(),
      };
    })
    .filter((entry): entry is { key: string; value: string } => Boolean(entry?.key && entry.value));
};

const findVariantAttributeValue = (value: string | undefined, aliases: string[]) => {
  const entries = parseVariantAttributeEntries(value);
  const normalizedAliases = aliases.map(normalizeAttributeKey);

  return (
    entries.find((entry) => {
      const normalizedKey = normalizeAttributeKey(entry.key);

      return normalizedAliases.some(
        (alias) =>
          normalizedKey === alias ||
          normalizedKey.endsWith(alias) ||
          normalizedKey.includes(alias) ||
          normalizedKey === `${alias}label` ||
          normalizedKey === `${alias}name` ||
          normalizedKey.endsWith(`${alias}label`) ||
          normalizedKey.endsWith(`${alias}name`)
      );
    })?.value ?? ''
  );
};

const resolveVariantColor = (value?: string) =>
  findVariantAttributeValue(value, ['color', 'colour', 'shade']);

const resolveVariantSizeQty = (value?: string) => {
  const explicitValue = findVariantAttributeValue(value, [
    'size',
    'sizes',
    'sizelabel',
    'sizename',
  ]);

  if (explicitValue) {
    return explicitValue;
  }

  return '';
};

const resolveInvoiceItemName = (productName: string, sku?: string) => {
  const trimmedName = productName.trim();
  const trimmedSku = sku?.trim();

  if (!trimmedSku || trimmedSku === '—') {
    return trimmedName;
  }

  if (trimmedName.toLowerCase().includes(trimmedSku.toLowerCase())) {
    return trimmedName;
  }

  return `${trimmedName}_${trimmedSku}`;
};

const normalizeSummaryLabel = (productName: string) => {
  const cleanedName = productName.replace(/\s+/g, ' ').trim();
  const prefixCandidate = cleanedName.split('-')[0]?.trim().replace(/,+$/, '') || cleanedName;
  const normalizedPrefix =
    prefixCandidate
      .replace(/[^A-Za-z\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim() || cleanedName;
  const uppercasePrefix = normalizedPrefix.toUpperCase();

  if (uppercasePrefix === 'KC') {
    return 'KURTA JACKET';
  }

  return uppercasePrefix;
};

const compactTextValue = (value?: string | null, fallback = '') => {
  const normalizedValue = value?.trim();

  return normalizedValue && normalizedValue !== '—' ? normalizedValue : fallback;
};

const normalizeWhatsAppNumber = (value?: string | null) => value?.replace(/\D/g, '') ?? '';

const getWhatsAppHref = (value?: string | null) => {
  const normalizedNumber = normalizeWhatsAppNumber(value);

  return normalizedNumber ? `https://wa.me/${normalizedNumber}` : '';
};

const getVariantSelectionDisplayValue = (
  selection: ProductVariantSelectionDTO | NonNullable<ProductVariantDTO['selections']>[number],
  optionLabelsById?: Map<number, string>
) => {
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
};

const getVariantSelectionValue = (
  selections:
    | ProductVariantSelectionDTO[]
    | NonNullable<ProductVariantDTO['selections']>
    | undefined,
  aliases: string[],
  optionLabelsById?: Map<number, string>
) => {
  const normalizedAliases = aliases.map(normalizeAttributeKey);
  const resolvedSelections = selections ?? [];

  const matchingSelection = resolvedSelections.find((selection) => {
    const normalizedLabel = normalizeAttributeKey(
      selection.attribute?.label || selection.attribute?.name || ''
    );

    return normalizedAliases.some(
      (alias) =>
        normalizedLabel === alias ||
        normalizedLabel.endsWith(alias) ||
        normalizedLabel.includes(alias) ||
        normalizedLabel === `${alias}label` ||
        normalizedLabel === `${alias}name` ||
        normalizedLabel.endsWith(`${alias}label`) ||
        normalizedLabel.endsWith(`${alias}name`)
    );
  });

  return matchingSelection
    ? getVariantSelectionDisplayValue(matchingSelection, optionLabelsById)
    : '';
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
  generations,
}: OrderFulfillmentHistoryDetailProps) {
  const printContainerRef = useRef<HTMLDivElement>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { data: organizations } = useUserOrganizations();
  const organizationName = useMemo(() => resolveOrganizationName(organizations), [organizations]);
  const organizationId = useMemo(() => resolveOrganizationId(organizations), [organizations]);
  const { data: organizationDetails } = useOrganizationDetails(organizationId);
  const { data: organizationSettings } = useQuery({
    queryKey: ['order-fulfillment-organization-settings'],
    queryFn: getOrganizationSettings,
    staleTime: 5 * 60 * 1000,
  });
  const organizationAddress = useMemo(
    () =>
      organizationSettings?.address?.trim() || organizationDetails?.attributes?.address?.[0] || '',
    [organizationDetails, organizationSettings]
  );
  const organizationDisplayName =
    organizationSettings?.name?.trim() || organizationName || 'Organization';
  const organizationLogoUrl =
    organizationSettings?.logoUrl?.trim() ||
    (organizationSettings?.logo?.trim()?.startsWith('http')
      ? organizationSettings.logo.trim()
      : '');
  const organizationWhatsApp = organizationSettings?.whatsApp?.trim() || '';
  const organizationWhatsAppHref = getWhatsAppHref(organizationWhatsApp);

  const invoiceLabel = getFulfillmentRecordLabel(order.orderId, {
    invoiceId: generation.id,
    generationNumber: generation.generationNumber,
  });
  const handlePrintInvoice = useReactToPrint({
    contentRef: printContainerRef,
    documentTitle: invoiceLabel.replace(/\s+/g, '-'),
    pageStyle: `
      @page { size: A4 portrait; margin: 6mm; }
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

  const deliveredQuantityByOrderDetailId = useMemo(() => {
    const deliveredMap = new Map<number, number>();

    generations.forEach((entry) => {
      entry.items?.forEach((item) => {
        if (typeof item.orderDetailId !== 'number') {
          return;
        }

        deliveredMap.set(
          item.orderDetailId,
          (deliveredMap.get(item.orderDetailId) ?? 0) + Math.max(0, item.deliveredQuantity ?? 0)
        );
      });
    });

    return deliveredMap;
  }, [generations]);

  const originalOrderQuantityByOrderDetailId = useMemo(() => {
    const originalQuantityMap = new Map<number, number>();

    order.items.forEach((item) => {
      const remainingQuantity = Math.max(0, item.quantity) + Math.max(0, item.backOrderQuantity);
      const deliveredQuantity = deliveredQuantityByOrderDetailId.get(item.orderDetailId) ?? 0;

      originalQuantityMap.set(item.orderDetailId, remainingQuantity + deliveredQuantity);
    });

    return originalQuantityMap;
  }, [deliveredQuantityByOrderDetailId, order.items]);

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
        variantId: orderItem?.variantId,
        sku: item.sku || orderItem?.sku || '—',
        displayName: resolveInvoiceItemName(
          item.productName ||
            orderItem?.productName ||
            `Order item #${item.orderDetailId ?? index + 1}`,
          item.sku || orderItem?.sku || '—'
        ),
        variantAttributes: orderItem?.variantAttributes || '',
        colorName: resolveVariantColor(orderItem?.variantAttributes),
        sizeQty: resolveVariantSizeQty(orderItem?.variantAttributes),
        summaryLabel: normalizeSummaryLabel(
          item.productName ||
            orderItem?.productName ||
            `Order item #${item.orderDetailId ?? index + 1}`
        ),
        requestedQuantity:
          originalOrderQuantityByOrderDetailId.get(item.orderDetailId ?? -1) ??
          item.requestedQuantity ??
          0,
        deliveredQuantity,
        backlogLeft: item.remainingBacklogQuantity ?? 0,
        unitPrice,
        lineTotal: deliveredQuantity * unitPrice,
      };
    });
  }, [generation.items, order.items, originalOrderQuantityByOrderDetailId]);

  const invoiceVariantIds = useMemo(
    () =>
      Array.from(
        new Set(
          invoiceItems
            .map((item) => item.variantId)
            .filter(
              (variantId): variantId is number => typeof variantId === 'number' && variantId > 0
            )
        )
      ),
    [invoiceItems]
  );

  const variantQueries = useQueries({
    queries: invoiceVariantIds.map((variantId) =>
      getGetProductVariantQueryOptions(variantId, {
        query: {
          enabled: variantId > 0,
          staleTime: 30_000,
        },
      })
    ),
  });

  const variantById = useMemo(() => {
    const nextMap = new Map<number, ProductVariantDTO>();

    variantQueries.forEach((query, index) => {
      const variantId = invoiceVariantIds[index];
      const variant = query.data as ProductVariantDTO | undefined;

      if (variantId && variant) {
        nextMap.set(variantId, variant);
      }
    });

    return nextMap;
  }, [invoiceVariantIds, variantQueries]);

  const { data: variantSelections = [] } = useGetAllProductVariantSelections(
    invoiceVariantIds.length > 0
      ? {
          'variantId.in': invoiceVariantIds,
          size: Math.max(invoiceVariantIds.length * 6, 100),
        }
      : undefined,
    {
      query: {
        enabled: invoiceVariantIds.length > 0,
        staleTime: 30_000,
      },
    }
  );

  const selectionsByVariantId = useMemo(() => {
    const nextMap = new Map<number, ProductVariantSelectionDTO[]>();

    variantSelections.forEach((selection) => {
      const variantId = selection.variant?.id;

      if (typeof variantId !== 'number') {
        return;
      }

      const existingSelections = nextMap.get(variantId) ?? [];

      existingSelections.push(selection);
      nextMap.set(variantId, existingSelections);
    });

    return nextMap;
  }, [variantSelections]);

  const optionIdsMissingLabels = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...variantSelections,
            ...Array.from(variantById.values()).flatMap((variant) => variant.selections ?? []),
          ]
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
    [variantSelections, variantById]
  );

  const { data: optionRows = [] } = useGetAllSystemConfigAttributeOptions(
    optionIdsMissingLabels.length > 0
      ? {
          'id.in': optionIdsMissingLabels,
          size: optionIdsMissingLabels.length,
        }
      : undefined,
    {
      query: {
        enabled: optionIdsMissingLabels.length > 0,
        staleTime: 30_000,
      },
    }
  );

  const optionLabelsById = useMemo(
    () => new Map(optionRows.map((option) => [option.id!, option.label] as const)),
    [optionRows]
  );

  const resolvedInvoiceItems = useMemo(
    () =>
      invoiceItems.map((item) => {
        const variant =
          typeof item.variantId === 'number' ? variantById.get(item.variantId) : undefined;
        const variantSelectionsForItem =
          typeof item.variantId === 'number'
            ? selectionsByVariantId.get(item.variantId)
            : undefined;
        const colorName =
          getVariantSelectionValue(
            variantSelectionsForItem,
            ['color', 'colour', 'shade'],
            optionLabelsById
          ) ||
          getVariantSelectionValue(
            variant?.selections,
            ['color', 'colour', 'shade'],
            optionLabelsById
          ) ||
          item.colorName ||
          '';
        const sizeQty =
          getVariantSelectionValue(
            variantSelectionsForItem,
            ['size', 'sizes', 'sizelabel', 'sizename'],
            optionLabelsById
          ) ||
          getVariantSelectionValue(
            variant?.selections,
            ['size', 'sizes', 'sizelabel', 'sizename'],
            optionLabelsById
          ) ||
          item.sizeQty ||
          '';

        return {
          ...item,
          colorName,
          sizeQty,
        };
      }),
    [invoiceItems, optionLabelsById, selectionsByVariantId, variantById]
  );

  const overallDiscountAmount = getOrderDiscountAmount(order);
  const invoiceSubtotal = useMemo(
    () => resolvedInvoiceItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [resolvedInvoiceItems]
  );
  const invoiceTotalQuantity = useMemo(
    () => resolvedInvoiceItems.reduce((sum, item) => sum + item.deliveredQuantity, 0),
    [resolvedInvoiceItems]
  );
  const invoiceItemSummary = useMemo(() => {
    const quantityByLabel = new Map<string, number>();

    resolvedInvoiceItems.forEach((item) => {
      const label = item.summaryLabel || normalizeSummaryLabel(item.productName);

      quantityByLabel.set(label, (quantityByLabel.get(label) ?? 0) + item.deliveredQuantity);
    });

    return Array.from(quantityByLabel.entries()).map(([label, quantity]) => ({
      label,
      quantity,
    }));
  }, [resolvedInvoiceItems]);
  const invoiceGrandTotal = useMemo(() => {
    const fulfillmentShare =
      order.orderBaseAmount > 0 ? Math.min(invoiceSubtotal / order.orderBaseAmount, 1) : 0;
    const allocatedDiscountAmount = overallDiscountAmount * fulfillmentShare;
    const allocatedShippingAmount = (order.shipping.shippingAmount ?? 0) * fulfillmentShare;
    const taxableAmount = Math.max(invoiceSubtotal - allocatedDiscountAmount, 0);
    const taxAmount = (order.orderTaxRate / 100) * taxableAmount;

    return Math.max(taxableAmount + taxAmount + allocatedShippingAmount, 0);
  }, [
    invoiceSubtotal,
    order.orderBaseAmount,
    overallDiscountAmount,
    order.shipping.shippingAmount,
    order.orderTaxRate,
  ]);
  const invoiceDateLabel = formatInvoiceDisplayDate(generation.createdDate);
  const orderNumberLabel = `ORD/${order.orderId}-${generation.generationNumber ?? generation.id ?? ''}`;
  const transportLabel = compactTextValue(order.shipping.shippingMethod);
  const bookingLabel = compactTextValue(order.shipping.shippingId);
  const markaLabel = compactTextValue(customerContactPerson, compactTextValue(customerWhatsApp));
  const remarksLabel = compactTextValue(generation.notes);
  const gstLabel = '';
  const termsAndConditions = [
    '1. बिका हुआ माल वापस नहीं होगा |',
    '2. माल गलती से गलत जाने पर इसकी जानकारी एक हफ्ते में देनी होगी |',
    '3. डिफेक्ट पीस बिना बारकोड के वापस नहीं होंगे |',
  ];

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
        className="mx-auto w-full max-w-[820px] overflow-hidden border border-slate-300 bg-white"
      >
        <div ref={invoiceRef} id="order-fulfillment-invoice" className="bg-white p-4 sm:p-6">
          <style>
            {`
              #order-fulfillment-print-card {
                background: #ffffff !important;
                width: 100% !important;
                max-width: 794px !important;
                margin: 0 auto !important;
              }

              #order-fulfillment-invoice {
                background: #ffffff !important;
                color: #000000 !important;
                width: 100% !important;
              }

              #order-fulfillment-invoice,
              #order-fulfillment-invoice * {
                color: #000000 !important;
                border-color: #000000 !important;
                box-shadow: none !important;
                text-shadow: none !important;
              }

              #order-fulfillment-invoice {
                font-family: Arial, Helvetica, sans-serif !important;
                font-size: 11px !important;
                line-height: 1.35 !important;
              }

              #order-fulfillment-invoice .invoice-accent-red {
                color: #b91c1c !important;
              }

              #order-fulfillment-invoice .invoice-accent-green {
                color: #15803d !important;
              }

              #order-fulfillment-invoice .invoice-dark-fill {
                background-color: #d1d5db !important;
              }

              #order-fulfillment-invoice .invoice-light-fill {
                background-color: #f3f4f6 !important;
              }

              #order-fulfillment-invoice .invoice-lighter-fill {
                background-color: #fafafa !important;
              }

              @media print {
                #order-fulfillment-print-card {
                  width: 760px !important;
                  max-width: 760px !important;
                  margin: 0 !important;
                  zoom: 1 !important;
                  overflow: visible !important;
                  border: 1px solid #000000 !important;
                  box-shadow: none !important;
                }

                #order-fulfillment-invoice {
                  padding: 1rem !important;
                }

	                #order-fulfillment-invoice .invoice-top-row {
	                  display: flex !important;
	                  align-items: flex-start !important;
	                  justify-content: space-between !important;
	                  gap: 1rem !important;
	                }

	                #order-fulfillment-invoice .invoice-org-header {
	                  display: flex !important;
	                  align-items: flex-start !important;
	                  gap: 0.875rem !important;
	                  flex: 1 1 auto !important;
	                }
	                
	                #order-fulfillment-invoice .invoice-address-grid {
	                  display: grid !important;
                  grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                }

                #order-fulfillment-invoice .invoice-footer-grid {
                  display: grid !important;
                  grid-template-columns: minmax(0, 1.35fr) minmax(240px, 0.65fr) !important;
                  gap: 1rem !important;
                }

                #order-fulfillment-invoice .invoice-address-panel,
                #order-fulfillment-invoice .invoice-meta-panel,
                #order-fulfillment-invoice .invoice-footer-panel,
                #order-fulfillment-invoice table,
                #order-fulfillment-invoice tr,
                #order-fulfillment-invoice td,
                #order-fulfillment-invoice th {
                  break-inside: avoid !important;
                  page-break-inside: avoid !important;
                }

                #order-fulfillment-print-card {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
              }
            `}
          </style>
          <div className="space-y-3 text-[11px] leading-5">
            <div className="invoice-top-row flex items-start justify-between gap-4 border-b border-black pb-3">
              <div className="invoice-org-header">
                {organizationLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={organizationLogoUrl}
                    alt={`${organizationDisplayName} logo`}
                    className="h-16 w-16 shrink-0 object-contain"
                  />
                ) : null}
                <div className="min-w-0 flex-1">
                  <div className="invoice-accent-red text-[17px] font-bold uppercase underline underline-offset-4">
                    Order Form
                  </div>
                  <div className="mt-1 text-[22px] font-bold uppercase tracking-wide">
                    {organizationDisplayName}
                  </div>
                  {organizationWhatsAppHref ? (
                    <div className="mt-1">
                      <a
                        href={organizationWhatsAppHref}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-[#0f172a] underline underline-offset-2"
                      >
                        {organizationWhatsApp}
                      </a>
                    </div>
                  ) : null}
                  {organizationAddress ? (
                    <div className="mt-1 whitespace-pre-line text-[11px] leading-5">
                      {organizationAddress}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="w-[24%] text-right text-[12px] font-semibold leading-6">
                <div>Date:-{invoiceDateLabel || formatInvoiceDate(generation.createdDate)}</div>
                <div>Order No:-{orderNumberLabel}</div>
              </div>
            </div>

            <div className="invoice-address-panel border border-black">
              <div className="invoice-address-grid grid grid-cols-2">
                <div className="min-h-[110px] border-r border-black p-3">
                  <div className="font-semibold">Bill To :</div>
                  <div className="mt-2 space-y-1">
                    <div className="font-semibold">{customerName}</div>
                    {billToAddress ? <div>{billToAddress}</div> : null}
                    {billToPhone !== '—' ? <div>{billToPhone}</div> : null}
                    {billToEmail !== '—' ? <div>{billToEmail}</div> : null}
                  </div>
                </div>
                <div className="min-h-[110px] p-3">
                  <div className="font-semibold">Ship To :</div>
                  <div className="mt-2 space-y-1">
                    <div className="font-semibold">{customerName}</div>
                    {shipToAddress ? <div>{shipToAddress}</div> : null}
                    {shipToPhone !== '—' ? <div>{shipToPhone}</div> : null}
                    {shipToEmail !== '—' ? <div>{shipToEmail}</div> : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="invoice-meta-panel border border-black">
              <div className="grid grid-cols-2">
                <div className="border-r border-black">
                  <div className="border-b border-black px-3 py-2">GST No:- {gstLabel}</div>
                  <div className="px-3 py-2">Transport:- {transportLabel}</div>
                </div>
                <div>
                  <div className="border-b border-black px-3 py-2">Booking:- {bookingLabel}</div>
                  <div className="px-3 py-2">Marka:- {markaLabel}</div>
                </div>
              </div>
              <div className="border-t border-black px-3 py-2">Remarks:- {remarksLabel}</div>
            </div>

            <div className="overflow-hidden border border-black">
              <table className="w-full border-collapse text-left">
                <thead className="invoice-dark-fill">
                  <tr>
                    <th className="w-[7%] border border-black px-2 py-2 text-center font-semibold">
                      SrNo
                    </th>
                    <th className="w-[39%] border border-black px-2 py-2 font-semibold">
                      Item Name
                    </th>
                    <th className="w-[14%] border border-black px-2 py-2 font-semibold">colour</th>
                    <th className="w-[17%] border border-black px-2 py-2 font-semibold">
                      Size/Qty
                    </th>
                    <th className="w-[8%] border border-black px-2 py-2 text-center font-semibold">
                      Qty
                    </th>
                    <th className="w-[7.5%] border border-black px-2 py-2 text-right font-semibold">
                      Price
                    </th>
                    <th className="w-[7.5%] border border-black px-2 py-2 text-right font-semibold">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceItems.length > 0 ? (
                    resolvedInvoiceItems.map((item, index) => (
                      <tr
                        key={item.id}
                        className={index % 2 === 0 ? 'invoice-lighter-fill' : 'invoice-light-fill'}
                      >
                        <td className="border border-black px-2 py-1.5 text-center align-top">
                          {index + 1}
                        </td>
                        <td className="border border-black px-2 py-1.5 align-top">
                          <div>{item.displayName}</div>
                        </td>
                        <td className="border border-black px-2 py-1.5 align-top">
                          {item.colorName || ''}
                        </td>
                        <td className="border border-black px-2 py-1.5 align-top">
                          {item.sizeQty || ''}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-center align-top">
                          {formatInvoiceNumberValue(item.deliveredQuantity)}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-right align-top">
                          {formatInvoiceNumberValue(item.unitPrice)}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-right align-top">
                          {formatInvoiceNumberValue(item.lineTotal)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="border border-black px-3 py-8 text-center">
                        No fulfillment line items were returned for this invoice.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="invoice-footer-grid grid grid-cols-[minmax(0,1.35fr)_minmax(240px,0.65fr)] gap-4 pt-2">
              <div className="invoice-footer-panel border border-black p-3">
                <div className="invoice-accent-red text-[13px] font-semibold">
                  Terms And Condition
                </div>
                <div className="mt-2 space-y-1">
                  {termsAndConditions.map((term) => (
                    <div key={term}>{term}</div>
                  ))}
                </div>
              </div>

              <div className="invoice-footer-panel border border-black">
                <table className="w-full border-collapse">
                  <thead className="invoice-dark-fill">
                    <tr>
                      <th className="border border-black px-2 py-2 text-left font-semibold">
                        Items
                      </th>
                      <th className="border border-black px-2 py-2 text-center font-semibold">
                        Qty
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItemSummary.map((item) => (
                      <tr key={item.label} className="invoice-light-fill">
                        <td className="border border-black px-2 py-1.5 font-semibold">
                          {item.label}
                        </td>
                        <td className="border border-black px-2 py-1.5 text-center">
                          {formatInvoiceNumberValue(item.quantity)}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td className="invoice-accent-green border border-black px-2 py-2 font-semibold">
                        Total Qty :
                      </td>
                      <td className="invoice-accent-green border border-black px-2 py-2 text-center font-semibold">
                        {formatInvoiceNumberValue(invoiceTotalQuantity)}
                      </td>
                    </tr>
                    <tr>
                      <td className="invoice-accent-green border border-black px-2 py-2 font-semibold">
                        Total Amount :
                      </td>
                      <td className="invoice-accent-green border border-black px-2 py-2 text-center font-semibold">
                        {formatInvoiceNumberValue(invoiceGrandTotal || invoiceSubtotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
