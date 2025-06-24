import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { CallRemarkForm } from '../components/call-remark-form';
import { PageHeader } from '@/components/page-header';
import { PageTitle } from '@/components/page-title';
import { PermissionGuard } from '@/components/auth/permission-guard';
import { ContextAwareBackButton } from '@/components/context-aware-back-button';

export const metadata = {
  title: 'Create CallRemark',
};

export default function CreateCallRemarkPage() {
  return (
    <PermissionGuard
      requiredPermission="callRemark:create"
      unauthorizedTitle="Access Denied to Create Call Remark"
      unauthorizedDescription="You don't have permission to create new call remark records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <ContextAwareBackButton
              defaultRoute="/call-remarks"
              defaultLabel="Back to Call Remarks"
              entityName="CallRemark"
            />
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Create Call Remark</h1>
              <p className="text-sm text-gray-600 mt-1">
                Enter the details below to create a new call remark
              </p>
            </div>
          </div>

          <CallRemarkForm />
        </div>
      </div>
    </PermissionGuard>
  );
}
