import { PermissionGuard } from '@/core/auth';
import { SystemConfigsTableClient } from './components/system-configs-table-client';

export const metadata = {
  title: 'System Configs',
};

export default function SystemConfigPage() {
  return (
    <PermissionGuard
      requiredPermission="systemConfig:read"
      unauthorizedTitle="Access Denied to System Configs"
      unauthorizedDescription="You don't have permission to view system configs."
    >
      <SystemConfigsTableClient />
    </PermissionGuard>
  );
}
