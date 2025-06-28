import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { ProductDetails } from '../components/product-details';
import { PageHeader } from '@/components/page-header';
import { PageTitle } from '@/components/page-title';
import { PermissionGuard, InlinePermissionGuard } from '@/core/auth';
import { ContextAwareBackButton } from '@/components/context-aware-back-button';

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
        <div className="flex items-center justify-between">
          <PageHeader>
            <ContextAwareBackButton
              defaultRoute="/products"
              defaultLabel="Back to Products"
              entityName="Product"
            />
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Product Details</h1>
              <p className="text-sm text-gray-600 mt-1">
                View detailed information for this product
              </p>
            </div>
          </div>

          <ProductDetails id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
