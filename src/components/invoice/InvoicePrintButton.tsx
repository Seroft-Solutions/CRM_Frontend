'use client';

import { Button } from '@/components/ui/button';
import { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { InvoiceTemplate } from './InvoiceTemplate';
import { Printer } from 'lucide-react';

// This is the data structure expected by the InvoiceTemplate
export interface InvoiceOrderRecord {
  id: string;
  orderDate: string;
  orderStatus: string;
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

function mapOrderRecordToInvoiceOrderRecord(order: any): InvoiceOrderRecord {
  const customerName = `${order.address?.shipTo?.firstName || ''} ${order.address?.shipTo?.lastName || ''}`.trim();
  const billingAddress = `${order.address?.billTo?.addrLine1 || ''}, ${order.address?.billTo?.city || ''}, ${order.address?.billTo?.state || ''} ${order.address?.billTo?.zipcode || ''}`.trim();

  return {
    id: String(order.orderId),
    orderDate: order.createdDate,
    orderStatus: order.orderStatus,
    customer: {
      name: customerName || order.sundryCreditor?.name || order.customer?.name || 'N/A',
      phone: order.phone,
      email: order.email,
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

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  const invoiceOrder = mapOrderRecordToInvoiceOrderRecord(order);

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