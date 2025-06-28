import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { CustomerForm } from '../../components/customer-form';
import { PageHeader } from '@/components/page-header';
import { PageTitle } from '@/components/page-title';
import { PermissionGuard } from '@/core/auth';
import { ContextAwareBackButton } from '@/components/context-aware-back-button';

interface EditCustomerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Edit Customer',
};

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard
      requiredPermission="customer:update"
      unauthorizedTitle="Access Denied to Edit Customer"
      unauthorizedDescription="You don't have permission to edit customer records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <ContextAwareBackButton
              defaultRoute="/customers"
              defaultLabel="Back to Customers"
              entityName="Customer"
            />
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Customer</h1>
              <p className="text-sm text-gray-600 mt-1">Update the information for this customer</p>
            </div>
          </div>

          <CustomerForm id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
