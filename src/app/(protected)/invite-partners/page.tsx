'use client';

import { AccessInviteForm, AccessInvitesTable } from '@/features/access-management';
import { useOrganizationContext } from '@/features/user-management/hooks/client';
import { PermissionGuard } from '@/core/auth';

function InvitePartnersContent() {
  const { organizationId, organizationName } = useOrganizationContext();

  if (!organizationId) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Select an organization before inviting partners.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <AccessInviteForm
        type="partner"
        organizationId={organizationId}
        organizationName={organizationName}
      />
      <AccessInvitesTable type="partner" organizationId={organizationId} />
    </div>
  );
}

export default function InvitePartnersPage() {
  return (
    <PermissionGuard
      requiredPermission="partner:create"
      unauthorizedTitle="Access Denied to Invite Partners"
      unauthorizedDescription="You don't have permission to invite business partners."
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <InvitePartnersContent />
      </div>
    </PermissionGuard>
  );
}
