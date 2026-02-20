import { SystemConfigAttributeOptionsTableClient } from './components/system-config-attribute-options-table-client';
import { PermissionGuard } from '@/core/auth';

export const metadata = {
  title: 'Attribute Options',
};

export default function SystemConfigAttributeOptionPage() {
  return (
    <PermissionGuard
      requiredPermission="systemConfigAttributeOption:read"
      unauthorizedTitle="Access Denied to Attribute Options"
      unauthorizedDescription="You don't have permission to view attribute options."
    >
      <SystemConfigAttributeOptionsTableClient />
    </PermissionGuard>
  );
}
