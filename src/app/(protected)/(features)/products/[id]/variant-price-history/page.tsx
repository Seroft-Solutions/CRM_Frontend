import { PermissionGuard } from '@/core/auth';
import { VariantPriceHistoryView } from '../../components/variant-price-history-view';

interface VariantPriceHistoryPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Variant Price History',
};

export default async function VariantPriceHistoryPage({ params }: VariantPriceHistoryPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard
      requiredPermission="product:read"
      unauthorizedTitle="Access Denied to Variant Price History"
      unauthorizedDescription="You don't have permission to view variant price history."
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <VariantPriceHistoryView productId={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
