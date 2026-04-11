'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Plus, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InlinePermissionGuard } from '@/core/auth';
import { OrderTable } from './order-table';

type OrdersPageProps = {
  draftOnly?: boolean;
};

export function OrdersPage({ draftOnly = false }: OrdersPageProps) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  return (
    <div className="space-y-4">
      {/* Modern Centered Header with Sidebar Theme */}
      <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          {/* Left Section: Icon and Title */}
          <div className="flex items-center gap-3 lg:flex-1">
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

          {!draftOnly ? (
            <>
              <div className="lg:flex-1 lg:flex lg:justify-center">
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
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:flex-1 lg:justify-end">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-sidebar-foreground/70"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => setDateFrom(event.target.value)}
                    className="h-10 w-full min-w-[150px] border-sidebar-border bg-background text-sm sm:w-[170px]"
                  />
                  <span className="text-sm text-sidebar-foreground/80">to</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(event) => setDateTo(event.target.value)}
                    className="h-10 w-full min-w-[150px] border-sidebar-border bg-background text-sm sm:w-[170px]"
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                    }}
                    className="h-10 px-3 text-sidebar-foreground/80 hover:bg-sidebar-accent/10 hover:text-sidebar-foreground"
                  >
                    Clear dates
                  </Button>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <OrderTable
        entityStatus={draftOnly ? 'DRAFT' : 'ACTIVE'}
        title={draftOnly ? 'Draft Purchase Orders' : 'All Purchase Orders'}
        subtitle="purchase order"
        searchPlaceholder={draftOnly ? 'Search draft purchase orders...' : 'Search purchase orders...'}
        allTabLabel={draftOnly ? 'All Draft Purchase Orders' : 'All Purchase Orders'}
        showStatusTabs={!draftOnly}
        dateFrom={dateFrom}
        dateTo={dateTo}
      />
    </div>
  );
}
