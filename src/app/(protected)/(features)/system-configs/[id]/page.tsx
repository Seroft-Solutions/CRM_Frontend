import { PermissionGuard } from '@/core/auth';
import { SystemConfigViewFormPageClient } from '../components/system-config-form-page-client';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SystemConfigViewPage({ params }: PageProps) {
  const { id: idParam } = await params;
  const id = Number(idParam);

  if (!Number.isFinite(id)) {
    notFound();
  }

  return (
    <PermissionGuard
      requiredPermission="systemConfig:read"
      unauthorizedTitle="Access Denied to System Configs"
      unauthorizedDescription="You don't have permission to view system configs."
    >
      <SystemConfigViewFormPageClient id={id} />
    </PermissionGuard>
  );
}
