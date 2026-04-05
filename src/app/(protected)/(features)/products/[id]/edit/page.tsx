import { ProductForm } from '../../components/product-form';
import { PermissionGuard } from '@/core/auth';
import { Button } from '@/components/ui/button';
import { Edit, Save } from 'lucide-react';

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Edit Product',
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
        {/* Modern Centered Header for Edit Page */}
        <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            {/* Left Section: Icon and Title */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
                <Edit className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">Edit Product</h1>
                <p className="text-sm text-sidebar-foreground/80">
                  Update product information and details
                </p>
              </div>
            </div>

            <div className="shrink-0">
              <Button type="submit" form="product-form" size="sm" className="h-8 px-3 text-sm">
                <Save className="mr-1.5 h-4 w-4" />
                Save Product
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <ProductForm id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
