import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionGuard } from '@/core/auth';
import { CustomerLedger } from '../../components/customer-ledger';

interface CustomerLedgerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Customer Ledger',
};

export default async function CustomerLedgerPage({ params }: CustomerLedgerPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard
      requiredPermission="customer:read"
      unauthorizedTitle="Access Denied to Customer Ledger"
      unauthorizedDescription="You don't have permission to view this customer ledger."
    >
      <div className="space-y-6">
        <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
                <BookOpen className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">Customer Ledger</h1>
                <p className="text-sm text-sidebar-foreground/80">
                  View sales order ledger entries for this customer
                </p>
              </div>
            </div>

            <div className="flex-1 flex justify-center gap-2">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="gap-2 bg-sidebar-accent/10 text-sidebar-accent-foreground border-sidebar-accent/20 hover:bg-sidebar-accent/20"
              >
                <Link href={`/customers/${id}`}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </Button>
            </div>

            <div className="flex-1"></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <CustomerLedger id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
