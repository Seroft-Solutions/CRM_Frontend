import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { CallStatusForm } from '../components/call-status-form';
import { PageHeader } from '@/components/page-header';
import { PageTitle } from '@/components/page-title';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { ContextAwareBackButton } from '@/components/context-aware-back-button';

export const metadata = {
  title: 'Create CallStatus',
};

export default function CreateCallStatusPage() {
  return (
    <PermissionGuard
      requiredPermission="callStatus:create"
      unauthorizedTitle="Access Denied to Create Call Status"
      unauthorizedDescription="You don't have permission to create new call status records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <ContextAwareBackButton
              defaultRoute="/call-statuses"
              defaultLabel="Back to Call Statuses"
              entityName="CallStatus"
            />
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Create Call Status</h1>
              <p className="text-sm text-gray-600 mt-1">
                Enter the details below to create a new call status
              </p>
            </div>
          </div>

          <CallStatusForm />
        </div>
      </div>
    </PermissionGuard>
  );
}
