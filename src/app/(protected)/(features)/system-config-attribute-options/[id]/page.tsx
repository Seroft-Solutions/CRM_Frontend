import { PermissionGuard } from '@/core/auth';
import { notFound } from 'next/navigation';
import { SystemConfigAttributeOptionsViewClient } from '../components/system-config-attribute-options-view-client';

interface SystemConfigAttributeOptionPageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    scope?: string;
  }>;
}

export const metadata = {
  title: 'Attribute Option Details',
};

export default async function SystemConfigAttributeOptionPage({
  params,
  searchParams,
}: SystemConfigAttributeOptionPageProps) {
  const { id: idParam } = await params;
  const { scope } = await searchParams;
  const id = parseInt(idParam, 10);

  if (!Number.isFinite(id)) notFound();

  return (
    <PermissionGuard
      requiredPermission="systemConfigAttributeOption:read"
      unauthorizedTitle="Access Denied to View Attribute Option"
      unauthorizedDescription="You don't have permission to view attribute option details."
    >
      <SystemConfigAttributeOptionsViewClient id={id} scope={scope} />
    </PermissionGuard>
  );
}
