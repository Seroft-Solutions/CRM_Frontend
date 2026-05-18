import { OrderHistoryTable } from '@/app/(protected)/(features)/orders/components/table/order-history-table';
import { History } from 'lucide-react';

export const metadata = {
  title: 'Sale Order History',
};

export default function OrderHistoryPage() {
  return (
    <div className="so-history-page -m-4 flex flex-col min-h-[calc(100vh-12px)]">
      <style dangerouslySetInnerHTML={{ __html: `
        .so-history-page { margin: -16px; }
        header:has(nav) { display: none !important; }
        .so-history-page ~ *, .so-history-page { max-width: 100% !important; }
      `}} />

      <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-sidebar-accent flex items-center justify-center">
            <History className="h-3.5 w-3.5 text-sidebar-accent-foreground" />
          </div>
          <span className="text-sm font-bold">Sale Order History</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white">
        <OrderHistoryTable />
      </div>
    </div>
  );
}
