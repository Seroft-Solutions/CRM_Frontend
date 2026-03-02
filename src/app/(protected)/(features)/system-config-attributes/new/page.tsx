import { PermissionGuard } from '@/core/auth';
import { SystemConfigAttributeCreateFormPageClient } from '../components/system-config-attribute-form-page-client';

export const metadata = {
  title: 'Create Config Attribute',
};

export default function CreateSystemConfigAttributePage() {
  return (
    <PermissionGuard
      requiredPermission="systemConfigAttribute:create"
      unauthorizedTitle="Access Denied to Create Config Attribute"
      unauthorizedDescription="You don't have permission to create new config attribute records."
    >
      <SystemConfigAttributeCreateFormPageClient />
    </PermissionGuard>
  );
}
