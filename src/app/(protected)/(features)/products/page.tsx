import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Box } from 'lucide-react';

import { ProductTable } from './components/product-table';
import { InlinePermissionGuard, PermissionGuard } from '@/core/auth';
import Link from 'next/link';

export const metadata = {
  title: 'Products',
};

export default function ProductPage() {
  return (
    <PermissionGuard
      requiredPermission="product:read"
      unauthorizedTitle="Access Denied to Products"
      unauthorizedDescription="You don't have permission to view products."
    >
      <div className="space-y-4">
        {/* Modern Centered Header with Sidebar Theme */}
        <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-center">
            {/* Left Section: Icon and Title */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
                <Box className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">Products</h1>
                <p className="text-sm text-sidebar-foreground/80">Manage your product catalog</p>
              </div>
            </div>

            {/* Center Section: Prominent New Product Button */}
            <div className="flex-1 flex justify-center">
              <InlinePermissionGuard requiredPermission="product:create">
                <Button
                  asChild
                  size="sm"
                  className="h-10 gap-2 bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90 hover:scale-105 text-sm font-semibold px-6 shadow-md transition-all duration-200 border-2 border-sidebar-accent/20"
                >
                  <Link href="/products/new">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">New Product</span>
                  </Link>
                </Button>
              </InlinePermissionGuard>
            </div>

            {/* Right Section: Spacer for balance */}
            <div className="flex-1"></div>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <ProductTable />
        </Suspense>
      </div>
    </PermissionGuard>
  );
}
