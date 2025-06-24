import Link from 'next/link';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { CallTypeDetails } from '../components/call-type-details';
import { PageHeader } from '@/components/page-header';
import { PageTitle } from '@/components/page-title';
import { PermissionGuard, InlinePermissionGuard } from '@/components/auth/permission-guard';
import { ContextAwareBackButton } from '@/components/context-aware-back-button';

interface CallTypePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'CallType Details',
};

export default async function CallTypePage({ params }: CallTypePageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard
      requiredPermission="callType:read"
      unauthorizedTitle="Access Denied to Call Type Details"
      unauthorizedDescription="You don't have permission to view this call type."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <ContextAwareBackButton
              defaultRoute="/call-types"
              defaultLabel="Back to Call Types"
              entityName="CallType"
            />
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Call Type Details</h1>
              <p className="text-sm text-gray-600 mt-1">
                View detailed information for this call type
              </p>
            </div>
          </div>

          <CallTypeDetails id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
