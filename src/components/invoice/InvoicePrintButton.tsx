'use client';

import { Button } from '@/components/ui/button';
import { useUserOrganizations } from '@/hooks/useUserOrganizations';
import { useMemo, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { InvoiceTemplate } from './InvoiceTemplate';
import { Printer } from 'lucide-react';

// This is the data structure expected by the InvoiceTemplate
export interface InvoiceOrderRecord {
  id: string;
  orderDate: string;
  orderStatus: string;
  organizationName: string;
  recipientAddressLine1: string;
  recipientAddressLine2: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    billingAddress: string;
  };
  items: {
    productName: string;
    sku: string;
    variantAttributes: string;
    quantity: number;
    unitPrice: number;
    tax: number;
    total: number;
  }[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  grandTotal: number;
}


interface InvoicePrintButtonProps {
  order: any; // Using any for now to handle both PurchaseOrderRecord and OrderRecord
  orderType: 'purchase' | 'sales';
}

const compactJoin = (parts: Array<string | undefined>, separator = ', ') =>
  parts
    .map((part) => (part ?? '').trim())
    .filter((part) => part.length > 0)
    .join(separator);

const formatAddressFromFields = (fields?: {
  addrLine1?: string;
  addrLine2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
}) => {
  if (!fields) {
    return { line1: '', line2: '', full: '' };
  }

  const line1 = compactJoin([fields.addrLine1, fields.addrLine2]);
  const cityState = compactJoin([fields.city, fields.state]);
  const line2 = compactJoin([cityState, fields.zipcode], ' ');
  const full = compactJoin([line1, line2]);

  return { line1, line2, full };
};

const resolveOrganizationName = (
  organizations?: Array<{ id: string; name: string }>,
) => {
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

function mapOrderRecordToInvoiceOrderRecord(
  order: any,
  orderType: 'purchase' | 'sales',
  organizationName: string,
): InvoiceOrderRecord {
  const isPurchase = orderType === 'purchase';
  const shipToName = compactJoin(
    [order.address?.shipTo?.firstName, order.address?.shipTo?.lastName],
    ' ',
  );

  const customerName = isPurchase
    ? order.sundryCreditor?.creditorName || order.sundryCreditor?.name || 'N/A'
    : shipToName || order.customer?.customerBusinessName || order.customer?.name || 'N/A';

  const customerPhone = isPurchase
    ? order.sundryCreditor?.mobile || order.phone || ''
    : order.customer?.mobile || order.phone || '';

  const customerEmail = isPurchase
    ? order.sundryCreditor?.email || order.email || ''
    : order.customer?.email || order.email || '';

  const addressFromOrder = formatAddressFromFields(order.address?.billTo);
  const addressFromEntity = isPurchase
    ? order.sundryCreditor?.defaultAddress?.completeAddress || order.sundryCreditor?.completeAddress
    : order.customer?.defaultAddress?.completeAddress || order.customer?.completeAddress;

  const addressFromEntityValue = (addressFromEntity ?? '').trim();
  const resolvedAddress = isPurchase
    ? addressFromEntityValue
      ? { line1: addressFromEntityValue, line2: '', full: addressFromEntityValue }
      : addressFromOrder
    : addressFromOrder.full
      ? addressFromOrder
      : addressFromEntityValue
        ? { line1: addressFromEntityValue, line2: '', full: addressFromEntityValue }
        : addressFromOrder;

  const billingAddress = resolvedAddress.full;

  return {
    id: String(order.orderId),
    orderDate: formatInvoiceDate(order.createdDate),
    orderStatus: order.orderStatus,
    organizationName,
    recipientAddressLine1: resolvedAddress.line1,
    recipientAddressLine2: resolvedAddress.line2,
    customer: {
      name: customerName,
      phone: customerPhone,
      email: customerEmail,
      billingAddress: billingAddress,
    },
    items: (order.items || []).map((item: any) => ({
      productName: item.productName || 'N/A',
      sku: item.sku || 'N/A',
      variantAttributes: item.variantAttributes || 'N/A',
      quantity: item.quantity,
      unitPrice: item.itemPrice,
      tax: item.itemTaxAmount,
      total: item.itemTotalAmount,
    })),
    subtotal: order.orderBaseAmount,
    discount: 0, // No discount field in OrderRecord
    shipping: order.shipping?.shippingAmount || 0,
    tax: (order.orderTotalAmount || 0) - (order.orderBaseAmount || 0) - (order.shipping?.shippingAmount || 0),
    grandTotal: order.orderTotalAmount,
  };
}


export function InvoicePrintButton({ order, orderType }: InvoicePrintButtonProps) {
  const componentRef = useRef<HTMLDivElement>(null);
  const { data: organizations } = useUserOrganizations();
  const organizationName = useMemo(
    () => resolveOrganizationName(organizations),
    [organizations],
  );

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  const invoiceOrder = mapOrderRecordToInvoiceOrderRecord(order, orderType, organizationName);

  return (
    <>
      <Button size="sm" variant="outline" className="gap-2" onClick={() => handlePrint()}>
        <Printer className="w-4 h-4" />
        <span>Print Invoice</span>
      </Button>
      <div style={{ display: 'none' }}>
        <InvoiceTemplate ref={componentRef} order={invoiceOrder} orderType={orderType} />
      </div>
    </>
  );
}
