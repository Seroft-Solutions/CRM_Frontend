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

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ order, orderType }, ref) => {
  return (
    <div ref={ref} className="p-6 text-black bg-white min-h-[29.7cm]">
      <style type="text/css" media="print">
        {`
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 1.6cm;
            -webkit-print-color-adjust: exact;
          }
        `}
      </style>
      <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-slate-100">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900 mb-1">
            {orderType === 'purchase' ? 'Purchase Order' : 'Order Invoice'}
          </h1>
          <p className="text-slate-500 font-medium"># {order.id}</p>
        </div>
      </div>

      <div className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-100">
        <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Order Information</h2>
        <div className="flex flex-wrap gap-x-12 gap-y-4 text-sm text-slate-600">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Order ID</span>
            <span className="font-semibold text-slate-900 break-all">{order.id}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Date</span>
            <span className="font-semibold text-slate-900">{order.orderDate}</span>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Status</span>
            <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-200 text-slate-800">
              {order.orderStatus}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Payment Status
            </span>
            <span className="font-semibold text-slate-900">{order.paymentStatus || '—'}</span>
          </div>
          {order.shippingTrackingId && (
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Tracking ID
              </span>
              <span className="font-semibold text-slate-900 break-all">{order.shippingTrackingId}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-8">
        <div className="space-y-2 min-w-0">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">From</h2>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-slate-900 whitespace-nowrap">Organization Name:</span>
              <span className="text-slate-700 break-words">{order.organizationName || 'Organization'}</span>
            </div>
            {order.organizationEmail && (
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-slate-900 whitespace-nowrap">Email:</span>
                <span className="text-slate-700 break-all">{order.organizationEmail}</span>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-2 min-w-0">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {orderType === 'purchase' ? 'Supplier Details' : 'Billing To'}
          </h2>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-slate-900 whitespace-nowrap">Name:</span>
              <span className="text-slate-700 break-words">{order.customer.name}</span>
            </div>
            {order.customer.phone && (
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-slate-900 whitespace-nowrap">Phone:</span>
                <span className="text-slate-700">{order.customer.phone}</span>
              </div>
            )}
            {order.customer.email && (
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-slate-900 whitespace-nowrap">Email:</span>
                <span className="text-slate-700 break-all">{order.customer.email}</span>
              </div>
            )}
            {order.customer.billingAddress && (
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900 whitespace-nowrap">Address:</span>
                <span className="text-slate-700 leading-relaxed break-words">{order.customer.billingAddress}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-slate-900">
              <th className="py-3 font-bold uppercase tracking-wider text-xs text-slate-900">Item Details</th>
              <th className="py-3 font-bold uppercase tracking-wider text-xs text-slate-900 text-center">Qty</th>
              <th className="py-3 font-bold uppercase tracking-wider text-xs text-slate-900 text-right">Unit Price</th>
              <th className="py-3 font-bold uppercase tracking-wider text-xs text-slate-900 text-right">Tax</th>
              <th className="py-3 font-bold uppercase tracking-wider text-xs text-slate-900 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((item, index) => (
              <tr key={index}>
                <td className="py-3">
                  <div className="font-bold text-slate-900">{item.productName}</div>
                  <div className="text-xs text-slate-500 mt-1">SKU: {item.sku}</div>
                  {item.variantAttributes && (
                    <div className="text-xs text-slate-400 mt-0.5">{item.variantAttributes}</div>
                  )}
                </td>
                <td className="py-3 text-center font-medium text-slate-700">{item.quantity}</td>
                <td className="py-3 text-right font-medium text-slate-700">{formatCurrency(item.unitPrice)}</td>
                <td className="py-3 text-right font-medium text-slate-700">{formatCurrency(item.tax)}</td>
                <td className="py-3 text-right font-bold text-slate-900">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end pt-6 border-t-2 border-slate-900">
        <div className="w-80 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Subtotal:</span>
            <span className="font-semibold text-slate-900">{formatCurrency(order.subtotal)}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm text-rose-600 font-medium">
              <span>Discount:</span>
              <span>- {formatCurrency(order.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Shipping:</span>
            <span className="font-semibold text-slate-900">{formatCurrency(order.shipping)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Tax Total:</span>
            <span className="font-semibold text-slate-900">{formatCurrency(order.tax)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-200">
            <span className="text-lg font-black uppercase text-slate-900">Grand Total:</span>
            <span className="text-2xl font-black text-slate-900">{formatCurrency(order.grandTotal)}</span>
          </div>
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm font-bold text-slate-900 mb-1">Thank you for your business!</p>
        <p className="text-xs text-slate-400">Should you have any questions, please contact support.</p>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
