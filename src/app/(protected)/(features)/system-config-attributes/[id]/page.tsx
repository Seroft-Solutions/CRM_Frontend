import { PermissionGuard } from '@/core/auth';
import { notFound } from 'next/navigation';
import { SystemConfigAttributeViewFormPageClient } from '../components/system-config-attribute-form-page-client';

interface SystemConfigAttributePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Config Attribute Details',
};

export default async function SystemConfigAttributePage({
  params,
}: SystemConfigAttributePageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  if (!Number.isFinite(id)) notFound();

  return (
    <PermissionGuard
      requiredPermission="systemConfigAttribute:read"
      unauthorizedTitle="Access Denied to View Config Attribute"
      unauthorizedDescription="You don't have permission to view config attribute details."
    >
      <SystemConfigAttributeViewFormPageClient id={id} />
    </PermissionGuard>
  );
}
