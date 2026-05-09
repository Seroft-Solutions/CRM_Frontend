import React from 'react';
import { InvoiceOrderRecord } from './InvoicePrintButton';

interface InvoiceTemplateProps {
  order: InvoiceOrderRecord;
  orderType: 'purchase' | 'sales';
}

const formatCurrency = (amount: number) => {
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  });
};

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ order, orderType }, ref) => {
    return (
      <div
        ref={ref}
        className="box-border min-h-[297mm] bg-white p-[7mm] text-[10px] leading-tight text-slate-900"
      >
        <style type="text/css" media="print">
          {`
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .invoice-table {
            border-collapse: collapse;
            table-layout: fixed;
            width: 100%;
          }
          .invoice-table th,
          .invoice-table td {
            border: 1px solid #334155;
          }
          .invoice-avoid-break {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        `}
        </style>

        <div className="mb-2 flex items-start justify-between border-b-2 border-slate-900 pb-1">
          <h1 className="text-xl font-black uppercase text-slate-950">
            {orderType === 'purchase' ? 'Purchase Order' : 'Order Invoice'}
          </h1>
          <div className="text-right text-[9px] font-semibold uppercase text-slate-700">
            <div>Order ID: {order.id}</div>
            <div>Date: {order.orderDate || '-'}</div>
          </div>
        </div>

        <table className="invoice-table mb-2">
          <tbody>
            <tr>
              <th className="w-[13%] bg-slate-100 px-1 py-1 text-left font-bold uppercase">
                Status
              </th>
              <td className="w-[20%] px-1 py-1 font-semibold uppercase">
                {order.orderStatus || '-'}
              </td>
              <th className="w-[14%] bg-slate-100 px-1 py-1 text-left font-bold uppercase">
                Payment
              </th>
              <td className="w-[18%] px-1 py-1 font-semibold">{order.paymentStatus || '-'}</td>
              <th className="w-[14%] bg-slate-100 px-1 py-1 text-left font-bold uppercase">
                Tracking ID
              </th>
              <td className="w-[21%] break-all px-1 py-1 font-semibold">
                {order.shippingTrackingId || '-'}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="invoice-table mb-2">
          <thead>
            <tr>
              <th className="w-1/2 bg-slate-100 px-1 py-1 text-left text-[10px] font-bold uppercase">
                Billing From
              </th>
              <th className="w-1/2 bg-slate-100 px-1 py-1 text-left text-[10px] font-bold uppercase">
                Billing To
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="align-top">
              <td className="px-1.5 py-1">
                <div className="break-words font-bold">
                  {order.organizationName || 'Organization'}
                </div>
                <div className="break-all">{order.organizationEmail || '-'}</div>
              </td>
              <td className="px-1.5 py-1">
                <div className="break-words font-bold">{order.customer.name}</div>
                <div className="grid grid-cols-[42px_1fr] gap-x-1">
                  <span className="font-semibold">Phone:</span>
                  <span className="break-all">{order.customer.phone || '-'}</span>
                  <span className="font-semibold">Email:</span>
                  <span className="break-all">{order.customer.email || '-'}</span>
                  <span className="font-semibold">Address:</span>
                  <span className="break-words">{order.customer.billingAddress || '-'}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="mb-2">
          <table className="invoice-table text-left text-[9px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="w-[4%] px-1 py-1 text-center font-bold uppercase">#</th>
                <th className="w-[28%] px-1 py-1 font-bold uppercase">Product</th>
                <th className="w-[13%] px-1 py-1 font-bold uppercase">SKU</th>
                <th className="w-[19%] px-1 py-1 font-bold uppercase">Variant</th>
                <th className="w-[6%] px-1 py-1 text-center font-bold uppercase">Qty</th>
                <th className="w-[10%] px-1 py-1 text-right font-bold uppercase">Unit</th>
                <th className="w-[9%] px-1 py-1 text-right font-bold uppercase">Tax</th>
                <th className="w-[11%] px-1 py-1 text-right font-bold uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={index} className="invoice-avoid-break align-top">
                  <td className="px-1 py-0.5 text-center font-semibold">{index + 1}</td>
                  <td className="break-words px-1 py-0.5 font-semibold">{item.productName}</td>
                  <td className="break-all px-1 py-0.5">{item.sku || '-'}</td>
                  <td className="break-words px-1 py-0.5">{item.variantAttributes || '-'}</td>
                  <td className="px-1 py-0.5 text-center font-semibold">{item.quantity}</td>
                  <td className="px-1 py-0.5 text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="px-1 py-0.5 text-right">{formatCurrency(item.tax)}</td>
                  <td className="px-1 py-0.5 text-right font-bold">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="invoice-avoid-break flex justify-end">
          <table className="invoice-table w-[45%] text-[10px]">
            <tbody>
              <tr>
                <th className="bg-slate-100 px-1 py-1 text-left font-bold uppercase">Subtotal</th>
                <td className="px-1 py-1 text-right font-semibold">
                  {formatCurrency(order.subtotal)}
                </td>
              </tr>
              {order.discount > 0 && (
                <tr>
                  <th className="bg-slate-100 px-1 py-1 text-left font-bold uppercase text-rose-700">
                    Discount
                  </th>
                  <td className="px-1 py-1 text-right font-semibold text-rose-700">
                    - {formatCurrency(order.discount)}
                  </td>
                </tr>
              )}
              <tr>
                <th className="bg-slate-100 px-1 py-1 text-left font-bold uppercase">Shipping</th>
                <td className="px-1 py-1 text-right font-semibold">
                  {formatCurrency(order.shipping)}
                </td>
              </tr>
              <tr>
                <th className="bg-slate-100 px-1 py-1 text-left font-bold uppercase">Tax Total</th>
                <td className="px-1 py-1 text-right font-semibold">{formatCurrency(order.tax)}</td>
              </tr>
              <tr>
                <th className="bg-slate-200 px-1 py-1 text-left text-xs font-black uppercase">
                  Grand Total
                </th>
                <td className="bg-slate-200 px-1 py-1 text-right text-xs font-black">
                  {formatCurrency(order.grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }
);

InvoiceTemplate.displayName = 'InvoiceTemplate';
