'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InlinePermissionGuard } from '@/core/auth';
import { OrderTable } from './order-table';
import { mockOrders } from '../data/mock-orders';

export function OrdersPage() {
  return (
    <div className="space-y-4">
      <div className="feature-header bg-[oklch(0.45_0.06_243)] relative overflow-hidden rounded-lg p-6 shadow-lg">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        ></div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="feature-header-icon w-10 h-10 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 7l9 4 9-4m-9 13V11"
                />
              </svg>
            </div>

            <div className="text-white">
              <h1 className="text-2xl font-bold">Order Management</h1>
              <p className="text-blue-100">
                Track orders, line items, fulfillment, and address details.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <InlinePermissionGuard requiredPermission="order:create">
              <Button
                asChild
                size="sm"
                className="h-10 gap-2 bg-yellow-400 px-6 text-sm font-semibold text-black shadow-md hover:bg-yellow-500"
              >
                <Link href="/orders/new">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Create</span>
                </Link>
              </Button>
            </InlinePermissionGuard>
          </div>
        </div>
      </div>

      <OrderTable orders={mockOrders} />
    </div>
  );
}
