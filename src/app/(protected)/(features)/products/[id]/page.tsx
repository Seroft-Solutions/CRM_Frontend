import { ProductViewForm } from '../components/product-view-form';
import { InlinePermissionGuard, PermissionGuard } from '@/core/auth';
import { Button } from '@/components/ui/button';
import { Eye, Pencil } from 'lucide-react';
import Link from 'next/link';

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Product Details',
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard
      requiredPermission="product:read"
      unauthorizedTitle="Access Denied to Product Details"
      unauthorizedDescription="You don't have permission to view this product."
    >
      <div className="space-y-6">
        {/* Modern Centered Header - Matching Edit/Create Pages */}
        <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-center">
            {/* Left Section: Icon and Title */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
                <Eye className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">Product Details</h1>
                <p className="text-sm text-sidebar-foreground/80">View product information</p>
              </div>
            </div>

            {/* Center Section: Prominent Edit Product Button */}
            <div className="flex-1 flex justify-center">
              <InlinePermissionGuard requiredPermission="product:update">
                <Button
                  asChild
                  size="sm"
                  className="h-10 gap-2 bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90 hover:scale-105 text-sm font-semibold px-6 shadow-md transition-all duration-200 border-2 border-sidebar-accent/20"
                >
                  <Link href={`/products/${id}/edit`}>
                    <Pencil className="h-4 w-4" />
                    <span className="hidden sm:inline">Edit Product</span>
                  </Link>
                </Button>
              </InlinePermissionGuard>
            </div>

            {/* Right Section: Spacer for balance */}
            <div className="flex-1"></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <ProductViewForm id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
