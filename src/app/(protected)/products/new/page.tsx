import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { ProductForm } from "../components/product-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";

export const metadata = {
  title: "Create Product",
};

export default function CreateProductPage() {
  return (
    <PermissionGuard 
      requiredPermission="product:create"
      unauthorizedTitle="Access Denied to Create Product"
      unauthorizedDescription="You don't have permission to create new product records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/products">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Products
              </Link>
            </Button>
          </PageHeader>
        </div>

        <div className="max-w-2xl">
          <PageTitle>Create Product</PageTitle>
          
          <div className="mt-6">
            <ProductForm />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
