import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { RoleForm } from '../components/role-form';
import { PageHeader } from '@/components/page-header';
import { PageTitle } from '@/components/page-title';
import { PermissionGuard } from '@/core/auth';
import { ContextAwareBackButton } from '@/components/context-aware-back-button';

export const metadata = {
  title: 'Create Role',
};

export default function CreateRolePage() {
  return (
    <PermissionGuard
      requiredPermission="role:create"
      unauthorizedTitle="Access Denied to Create Role"
      unauthorizedDescription="You don't have permission to create new role records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <ContextAwareBackButton
              defaultRoute="/roles"
              defaultLabel="Back to Roles"
              entityName="Role"
            />
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Create Role</h1>
              <p className="text-sm text-gray-600 mt-1">
                Enter the details below to create a new role
              </p>
            </div>
          </div>

          <RoleForm />
        </div>
      </div>
    </PermissionGuard>
  );
}
