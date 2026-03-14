'use client';
import Link from 'next/link';
import { Plus, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InlinePermissionGuard } from '@/core/auth';
import { OrderTable } from './order-table';

type OrdersPageProps = {
  draftOnly?: boolean;
};

export function OrdersPage({ draftOnly = false }: OrdersPageProps) {
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
              <h1 className="text-xl font-semibold text-sidebar-foreground">
                {draftOnly ? 'Purchase Order Drafts' : 'Purchase Orders'}
              </h1>
              <p className="text-sm text-sidebar-foreground/80">
                {draftOnly
                  ? 'Review and finalize saved draft purchase orders'
                  : 'Track warehouse inventory intake'}
              </p>
            </div>
          </div>

          {/* Center Section: Prominent New Order Button */}
          <div className="flex-1 flex justify-center">
            {!draftOnly ? (
              <InlinePermissionGuard requiredPermission="purchase-order:create">
                <Button
                  asChild
                  size="sm"
                  className="h-10 gap-2 bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90 hover:scale-105 text-sm font-semibold px-6 shadow-md transition-all duration-200 border-2 border-sidebar-accent/20"
                >
                  <Link href="/purchase-orders/new">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">New Purchase Order</span>
                  </Link>
                </Button>
              </InlinePermissionGuard>
            ) : null}
          </div>

          {/* Right Section: Spacer for balance */}
          <div className="flex-1"></div>
        </div>
      </div>

      <OrderTable
        entityStatus={draftOnly ? 'DRAFT' : 'ACTIVE'}
        title={draftOnly ? 'Draft Purchase Orders' : 'All Purchase Orders'}
        subtitle="purchase order"
        searchPlaceholder={draftOnly ? 'Search draft purchase orders...' : 'Search purchase orders...'}
        allTabLabel={draftOnly ? 'All Draft Purchase Orders' : 'All Purchase Orders'}
        showStatusTabs={!draftOnly}
      />
    </div>
  );
}
