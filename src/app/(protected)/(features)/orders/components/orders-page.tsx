'use client';
import Link from 'next/link';
import { Plus, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InlinePermissionGuard } from '@/core/auth';
import { OrderTable } from './order-table';

export function OrdersPage() {
  return (
    <div className="space-y-4">
      {/* Modern Centered Header with Sidebar Theme */}
      <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
        <div className="flex items-center justify-center">
          {/* Left Section: Icon and Title */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
              <ArrowDownToLine className="w-4 h-4 text-sidebar-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-sidebar-foreground">Orders</h1>
              <p className="text-sm text-sidebar-foreground/80">Track orders and fulfillment</p>
            </div>
          </div>

          {/* Center Section: Prominent New Order Button */}
          <div className="flex-1 flex justify-center">
            <InlinePermissionGuard requiredPermission="order:create">
              <Button
                asChild
                size="sm"
                className="h-10 gap-2 bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90 hover:scale-105 text-sm font-semibold px-6 shadow-md transition-all duration-200 border-2 border-sidebar-accent/20"
              >
                <Link href="/orders/new">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Order</span>
                </Link>
              </Button>
            </InlinePermissionGuard>
          </div>

          {/* Right Section: Spacer for balance */}
          <div className="flex-1"></div>
        </div>
      </div>

      <OrderTable />
    </div>
  );
}
