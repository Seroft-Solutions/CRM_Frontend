import { PermissionGuard } from '@/core/auth';
import { SystemConfigAttributeEditFormPageClient } from '../../components/system-config-attribute-form-page-client';

export const metadata = {
  title: 'Edit Config Attribute',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSystemConfigAttributePage({ params }: PageProps) {
  const { id } = await params;

  return (
    <PermissionGuard
      requiredPermission="systemConfigAttribute:update"
      unauthorizedTitle="Access Denied to Edit Config Attribute"
      unauthorizedDescription="You don't have permission to edit config attribute records."
    >
      <SystemConfigAttributeEditFormPageClient id={parseInt(id, 10)} />
    </PermissionGuard>
  );
}
