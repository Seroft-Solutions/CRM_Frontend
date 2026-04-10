import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { keycloakService } from '@/core/api/services/keycloak-service';
import {
  getAdminRealmsRealmOrganizations,
  getAdminRealmsRealmOrganizationsMembersMemberIdOrganizations,
  getAdminRealmsRealmOrganizationsOrgIdMembersMemberId,
  getAdminRealmsRealmUsers,
} from '@/core/api/generated/keycloak';

async function getSelectedOrganizationId(request: NextRequest): Promise<string | null> {
  return request.cookies.get('selectedOrganizationId')?.value || null;
}

export async function getVerifiedKeycloakOrganizationId(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    throw Object.assign(new Error('Authentication required'), { status: 401 });
  }

  const selectedOrganizationId = await getSelectedOrganizationId(request);

  if (!selectedOrganizationId) {
    throw Object.assign(new Error('No organization selected'), { status: 400 });
  }

  const realm = keycloakService.getRealm();

  if (!realm) {
    throw Object.assign(new Error('Realm configuration missing'), { status: 500 });
  }

  let keycloakUserId = session.user.id;

  if (session.user.email) {
    const users = await getAdminRealmsRealmUsers(realm, {
      email: session.user.email,
      exact: true,
    });

    if (users && users.length > 0 && users[0].id) {
      keycloakUserId = users[0].id;
    }
  }

  let organizations = [];

  try {
    organizations = await getAdminRealmsRealmOrganizationsMembersMemberIdOrganizations(
      realm,
      keycloakUserId
    );
  } catch {
    const allOrganizations = await getAdminRealmsRealmOrganizations(realm);
    const matchedOrganizations = [];

    for (const organization of allOrganizations || []) {
      if (!organization.id) {
        continue;
      }

      try {
        await getAdminRealmsRealmOrganizationsOrgIdMembersMemberId(
          realm,
          organization.id,
          keycloakUserId
        );
        matchedOrganizations.push(organization);
      } catch {
        // Ignore organizations where the user is not a member.
      }
    }

    organizations = matchedOrganizations;
  }

  const hasOrganization = (organizations || []).some(
    (organization) => organization.id === selectedOrganizationId
  );

  if (!hasOrganization) {
    throw Object.assign(new Error('Selected organization is not available for the current user'), {
      status: 403,
    });
  }

  const accessToken = session.access_token;

  if (!accessToken) {
    throw Object.assign(new Error('Missing access token in session'), { status: 401 });
  }

  return {
    accessToken,
    selectedOrganizationId,
  };
}

export function getErrorStatus(error: unknown) {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: unknown }).status;

    if (typeof status === 'number') {
      return status;
    }
  }

  return 500;
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
