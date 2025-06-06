import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

import { ProductDetails } from "../components/product-details";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/components/auth/permission-guard";

interface ProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Product Details",
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
            <Button variant="ghost" size="sm" asChild>
              <Link href="/products">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Products
              </Link>
            </Button>
          </PageHeader>
        </div>

        <div className="max-w-4xl">
          <PageTitle>Product Details</PageTitle>
          
          <div className="mt-6">
            <ProductDetails id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
