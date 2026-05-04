import { Suspense } from 'react';
import { AlertTriangle } from 'lucide-react';

import { DamageTable } from './components/table/damage-table';

export const metadata = {
  title: 'Damages',
};

export default function DamagesPage() {
  return (
      <div className="space-y-4">
        {/* Modern Centered Header with Sidebar Theme */}
        <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-center">
            {/* Left Section: Icon and Title */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
                <AlertTriangle className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">Product Damages</h1>
                <p className="text-sm text-sidebar-foreground/80">Inventory damage records and stock loss value.</p>
              </div>
            </div>

            {/* Right Section: Spacer for balance */}
            <div className="flex-1"></div>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <DamageTable />
        </Suspense>
      </div>
  );
}
