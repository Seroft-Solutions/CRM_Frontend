import { SystemConfigAttributesTableClient } from './components/system-config-attributes-table-client';
import { PermissionGuard } from '@/core/auth';

export const metadata = {
  title: 'System Config Attributes',
};

export default function SystemConfigAttributePage() {
  return (
    <PermissionGuard
      requiredPermission="systemConfigAttribute:read"
      unauthorizedTitle="Access Denied to System Config Attributes"
      unauthorizedDescription="You don't have permission to view system config attributes."
    >
      <SystemConfigAttributesTableClient />
    </PermissionGuard>
  );
}
