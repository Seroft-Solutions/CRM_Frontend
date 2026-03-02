import { PermissionGuard } from '@/core/auth';
import { SystemConfigAttributeOptionCreateFormPageClient } from '../components/system-config-attribute-option-form-page-client';

export const metadata = {
  title: 'Create Attribute Option',
};

export default function CreateSystemConfigAttributeOptionPage() {
  return (
    <PermissionGuard
      requiredPermission="systemConfigAttributeOption:create"
      unauthorizedTitle="Access Denied to Create Attribute Option"
      unauthorizedDescription="You don't have permission to create new attribute option records."
    >
      <SystemConfigAttributeOptionCreateFormPageClient />
    </PermissionGuard>
  );
}
