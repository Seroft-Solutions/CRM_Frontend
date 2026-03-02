import { PermissionGuard } from '@/core/auth';
import { SystemConfigAttributeOptionEditFormPageClient } from '../../components/system-config-attribute-option-form-page-client';

export const metadata = {
  title: 'Edit Attribute Option',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSystemConfigAttributeOptionPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <PermissionGuard
      requiredPermission="systemConfigAttributeOption:update"
      unauthorizedTitle="Access Denied to Edit Attribute Option"
      unauthorizedDescription="You don't have permission to edit attribute option records."
    >
      <SystemConfigAttributeOptionEditFormPageClient id={parseInt(id, 10)} />
    </PermissionGuard>
  );
}
