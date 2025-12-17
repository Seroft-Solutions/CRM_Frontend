import { PermissionGuard } from '@/core/auth';
import { SystemConfigEditFormPageClient } from '../../components/system-config-form-page-client';

export const metadata = {
  title: 'Edit System Config',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSystemConfigPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <PermissionGuard
      requiredPermission="systemConfig:update"
      unauthorizedTitle="Access Denied to Edit System Config"
      unauthorizedDescription="You don't have permission to edit system config records."
    >
      <SystemConfigEditFormPageClient id={parseInt(id, 10)} />
    </PermissionGuard>
  );
}
