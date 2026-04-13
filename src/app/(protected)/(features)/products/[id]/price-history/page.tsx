import { PermissionGuard } from '@/core/auth';
import { ProductPriceHistoryView } from '../../components/product-price-history-view';

interface ProductPriceHistoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Product Price History',
};

export default async function ProductPriceHistoryPage({ params }: ProductPriceHistoryPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard
      requiredPermission="product:read"
      unauthorizedTitle="Access Denied to Product Price History"
      unauthorizedDescription="You don't have permission to view product price history."
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <ProductPriceHistoryView productId={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
