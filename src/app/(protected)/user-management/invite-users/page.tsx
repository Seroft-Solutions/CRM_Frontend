'use client';

import { AccessInviteForm, AccessInvitesTable } from '@/features/access-management';
import { useOrganizationContext } from '@/features/user-management/hooks/client';
import { PermissionGuard } from '@/core/auth';

function InviteUsersContent() {
  const { organizationId } = useOrganizationContext();

  if (!organizationId) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Select an organization to send invitations.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <AccessInviteForm type="user" organizationId={organizationId} />
      <AccessInvitesTable type="user" organizationId={organizationId} />
    </div>
  );
}

export default function InviteUsersPage() {
  return (
    <PermissionGuard requiredPermission="manage:users">
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <InviteUsersContent />
      </div>
    </PermissionGuard>
  );
}
