import { PermissionGuard } from '@/core/auth';
import { notFound } from 'next/navigation';
import { SystemConfigAttributesViewClient } from '../components/system-config-attributes-view-client';

interface SystemConfigAttributePageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    scope?: string;
  }>;
}

export const metadata = {
  title: 'Config Attribute Details',
};

export default async function SystemConfigAttributePage({
  params,
  searchParams,
}: SystemConfigAttributePageProps) {
  const { id: idParam } = await params;
  const { scope } = await searchParams;
  const id = parseInt(idParam, 10);

  if (!Number.isFinite(id)) notFound();

  return (
    <PermissionGuard
      requiredPermission="systemConfigAttribute:read"
      unauthorizedTitle="Access Denied to View Config Attribute"
      unauthorizedDescription="You don't have permission to view config attribute details."
    >
      <SystemConfigAttributesViewClient id={id} scope={scope} />
    </PermissionGuard>
  );
}
