'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Plus, ShoppingBag } from 'lucide-react';
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
    <div className="order-list-page flex flex-col h-[100vh] overflow-hidden bg-slate-100">
      <style dangerouslySetInnerHTML={{ __html: `
        header:has(nav) { display: none !important; }
        .flex.flex-1.min-w-0.flex-col { overflow: hidden !important; padding: 0 !important; gap: 0 !important; }
        .container.mx-auto { max-width: 100% !important; padding: 0 !important; height: 100% !important; }
        div.flex.min-h-screen:has(.order-list-page) { min-height: 0 !important; height: 100% !important; }
        main:has(.order-list-page) { overflow: hidden !important; min-height: 0 !important; }
      `}} />

      {/* Dark header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white shrink-0">
        <div className="flex items-center gap-2.5 mr-auto">
          <div className="w-7 h-7 rounded-md bg-sidebar-accent flex items-center justify-center">
            <ShoppingBag className="h-3.5 w-3.5 text-sidebar-accent-foreground" />
          </div>
          <span className="text-sm font-bold">
            {draftOnly ? 'SO Drafts' : 'Sale Orders'}
          </span>
        </div>

        {!draftOnly && (
          <>
            <div className="flex items-center gap-1.5 text-[11px] bg-slate-800/60 rounded-md px-2 py-1">
              <span className="text-slate-300 font-medium">From</span>
              <Input
                type="date"
                value={draftDateFrom}
                onChange={(e) => setDraftDateFrom(e.target.value)}
                className="h-6 w-[130px] bg-slate-700 border-slate-600 text-white text-[11px] px-2 rounded"
              />
              <span className="text-slate-300 font-medium">To</span>
              <Input
                type="date"
                value={draftDateTo}
                onChange={(e) => setDraftDateTo(e.target.value)}
                className="h-6 w-[130px] bg-slate-700 border-slate-600 text-white text-[11px] px-2 rounded"
              />
              {hasAppliedDateFilter && !hasPendingDateChanges ? (
                <Button variant="ghost" size="sm" onClick={handleClearDateFilter} className="h-6 px-2 text-[11px] text-slate-300 hover:text-white hover:bg-slate-700 rounded">
                  Clear
                </Button>
              ) : (
                <Button size="sm" onClick={handleApplyDateFilter} disabled={!hasPendingDateChanges} className="h-6 px-3 text-[11px] bg-sidebar-accent hover:bg-sidebar-accent/90 text-sidebar-accent-foreground rounded font-semibold">
                  Apply
                </Button>
              )}
            </div>

            <InlinePermissionGuard requiredPermission="order:create">
              <Button asChild size="sm" className="h-7 px-3 text-[11px] gap-1.5 bg-sidebar-accent hover:bg-sidebar-accent/90 text-sidebar-accent-foreground border-0 font-semibold rounded-md">
                <Link href="/orders/new">
                  <Plus className="h-3 w-3" />
                  New Order
                </Link>
              </Button>
            </InlinePermissionGuard>
          </>
        )}
      </div>

      {/* Table area with padding for floating card */}
      <div className="flex-1 overflow-hidden p-3">
        <OrderTable
          entityStatus={draftOnly ? 'DRAFT' : 'ACTIVE'}
          title={draftOnly ? 'Draft Sale Orders' : 'All Orders'}
          subtitle="order"
          searchPlaceholder={draftOnly ? 'Search draft orders...' : 'Search orders...'}
          allTabLabel={draftOnly ? 'All Draft Orders' : 'All Orders'}
          showStatusTabs={true}
          dateFrom={appliedDateFrom}
          dateTo={appliedDateTo}
        />
      </div>
    </div>
  );
}
