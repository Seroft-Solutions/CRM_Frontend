import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { ProductForm } from "@/app/(protected)/(features)/products/components/product-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/core/auth";
import { ContextAwareBackButton } from "@/components/context-aware-back-button";

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit Product",
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="product:update"
      unauthorizedTitle="Access Denied to Edit Product"
      unauthorizedDescription="You don't have permission to edit product records."
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
              <h1 className="text-2xl font-semibold text-gray-900">Edit Product</h1>
              <p className="text-sm text-gray-600 mt-1">Update the information for this product</p>
            </div>
          </div>
          
          <ProductForm id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
