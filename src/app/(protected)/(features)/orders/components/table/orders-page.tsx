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
    <div className="order-list-page -m-4 flex flex-col h-[calc(100vh-12px)] overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: `
        .order-list-page { margin: -16px; }
        header:has(nav) { display: none !important; }
        .order-list-page ~ *, .order-list-page { max-width: 100% !important; }
        .order-list-page { overflow: hidden !important; }
        .order-list-page ~ *, .order-list-page { max-width: 100% !important; }
        /* Kill all ancestor overflow/height that prevents containment */
        .order-list-page,
        .order-list-page > *,
        main:has(.order-list-page),
        div:has(> main:has(.order-list-page)),
        .container:has(.order-list-page) {
          overflow: hidden !important;
          min-height: 0 !important;
          max-height: 100% !important;
        }
        .flex.min-w-0.flex-col:has(.order-list-page) {
          overflow: hidden !important;
          padding: 0 !important;
          gap: 0 !important;
        }
        .container.mx-auto:has(.order-list-page) {
          max-width: 100% !important;
          padding: 0 !important;
          height: 100% !important;
        }
      `}} />

      {/* Dark header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white">
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

            <InlinePermissionGuard requiredPermission="order:create">
              <Button asChild size="sm" className="h-7 px-2.5 text-[11px] gap-1.5 bg-sidebar-accent hover:bg-sidebar-accent/90 text-sidebar-accent-foreground border-0">
                <Link href="/orders/new">
                  <Plus className="h-3 w-3" />
                  New Order
                </Link>
              </Button>
            </InlinePermissionGuard>
          </>
        )}
      </div>

      <div className="flex-1 overflow-hidden bg-slate-100">
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
