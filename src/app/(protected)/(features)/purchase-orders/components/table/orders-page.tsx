'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InlinePermissionGuard } from '@/core/auth';
import { OrderTable } from './order-table';

type OrdersPageProps = {
  draftOnly?: boolean;
};

export function OrdersPage({ draftOnly = false }: OrdersPageProps) {
  const [draftDateFrom, setDraftDateFrom] = useState('');
  const [draftDateTo, setDraftDateTo] = useState('');
  const [appliedDateFrom, setAppliedDateFrom] = useState('');
  const [appliedDateTo, setAppliedDateTo] = useState('');

  const hasPendingDateChanges = draftDateFrom !== appliedDateFrom || draftDateTo !== appliedDateTo;
  const hasAppliedDateFilter = Boolean(appliedDateFrom) || Boolean(appliedDateTo);

  const handleApplyDateFilter = () => {
    setAppliedDateFrom(draftDateFrom);
    setAppliedDateTo(draftDateTo);
  };

  const handleClearDateFilter = () => {
    setDraftDateFrom('');
    setDraftDateTo('');
    setAppliedDateFrom('');
    setAppliedDateTo('');
  };

  return (
    <div className="order-list-page -m-4 flex flex-col h-[calc(100vh-12px)] overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        .order-list-page { margin: -16px; }
        header:has(nav) { display: none !important; }
        .order-list-page ~ *, .order-list-page { max-width: 100% !important; }
        .order-list-page { overflow: hidden !important; }
        [data-slot="sidebar-inset"] > div:last-child { overflow: hidden !important; padding: 0 !important; gap: 0 !important; }
        [data-slot="sidebar-inset"] > div:last-child > div { max-width: 100% !important; padding: 0 !important; }
      `}} />

      {/* Dark header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white">
        <div className="flex items-center gap-2.5 mr-auto">
          <div className="w-7 h-7 rounded-md bg-sidebar-accent flex items-center justify-center">
            <ShoppingCart className="h-3.5 w-3.5 text-sidebar-accent-foreground" />
          </div>
          <span className="text-sm font-bold">
            {draftOnly ? 'PO Drafts' : 'Purchase Orders'}
          </span>
        </div>

        {!draftOnly && (
          <>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="text-slate-400">From</span>
              <Input
                type="date"
                value={draftDateFrom}
                onChange={(e) => setDraftDateFrom(e.target.value)}
                className="h-7 w-[140px] bg-slate-800 border-slate-700 text-white text-[11px] px-2"
              />
              <span className="text-slate-400">To</span>
              <Input
                type="date"
                value={draftDateTo}
                onChange={(e) => setDraftDateTo(e.target.value)}
                className="h-7 w-[140px] bg-slate-800 border-slate-700 text-white text-[11px] px-2"
              />
              {hasAppliedDateFilter && !hasPendingDateChanges ? (
                <Button variant="ghost" size="sm" onClick={handleClearDateFilter} className="h-7 px-2 text-[11px] text-slate-300 hover:text-white hover:bg-slate-800">
                  Clear
                </Button>
              ) : (
                <Button size="sm" onClick={handleApplyDateFilter} disabled={!hasPendingDateChanges} className="h-7 px-2 text-[11px] bg-sidebar-accent hover:bg-sidebar-accent/90 text-sidebar-accent-foreground">
                  Apply
                </Button>
              )}
            </div>

            <InlinePermissionGuard requiredPermission="purchase-order:create">
              <Button asChild size="sm" className="h-7 px-2.5 text-[11px] gap-1.5 bg-sidebar-accent hover:bg-sidebar-accent/90 text-sidebar-accent-foreground border-0">
                <Link href="/purchase-orders/new">
                  <Plus className="h-3 w-3" />
                  New PO
                </Link>
              </Button>
            </InlinePermissionGuard>
          </>
        )}
      </div>

      <div className="flex-1 overflow-hidden bg-slate-100">
        <OrderTable
          entityStatus={draftOnly ? 'DRAFT' : 'ACTIVE'}
          title={draftOnly ? 'Draft Purchase Orders' : 'All Purchase Orders'}
          subtitle="purchase order"
          searchPlaceholder={draftOnly ? 'Search draft purchase orders...' : 'Search purchase orders...'}
          allTabLabel={draftOnly ? 'All Draft Purchase Orders' : 'All Purchase Orders'}
          showStatusTabs={true}
          dateFrom={appliedDateFrom}
          dateTo={appliedDateTo}
        />
      </div>
    </div>
  );
}
