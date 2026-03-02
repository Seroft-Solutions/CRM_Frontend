import { PermissionGuard } from '@/core/auth';
import { SystemConfigCreateFormPageClient } from '../components/system-config-form-page-client';

export const metadata = {
  title: 'Create System Config',
};

export default function CreateSystemConfigPage() {
  return (
    <PermissionGuard
      requiredPermission="systemConfig:create"
      unauthorizedTitle="Access Denied to Create System Config"
      unauthorizedDescription="You don't have permission to create new system config records."
    >
      <SystemConfigCreateFormPageClient />
    </PermissionGuard>
  );
}
