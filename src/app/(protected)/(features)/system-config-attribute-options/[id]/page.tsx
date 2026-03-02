import { PermissionGuard } from '@/core/auth';
import { notFound } from 'next/navigation';
import { SystemConfigAttributeOptionViewFormPageClient } from '../components/system-config-attribute-option-form-page-client';

interface SystemConfigAttributeOptionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Attribute Option Details',
};

export default async function SystemConfigAttributeOptionPage({
  params,
}: SystemConfigAttributeOptionPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  if (!Number.isFinite(id)) notFound();

  return (
    <PermissionGuard
      requiredPermission="systemConfigAttributeOption:read"
      unauthorizedTitle="Access Denied to View Attribute Option"
      unauthorizedDescription="You don't have permission to view attribute option details."
    >
      <SystemConfigAttributeOptionViewFormPageClient id={id} />
    </PermissionGuard>
  );
}
