import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { keycloakService } from '@/core/api/services/keycloak-service';
import {
  getAdminRealmsRealmOrganizations,
  getAdminRealmsRealmOrganizationsMembersMemberIdOrganizations,
  getAdminRealmsRealmOrganizationsOrgIdMembersMemberId,
  getAdminRealmsRealmUsers,
} from '@/core/api/generated/keycloak';
import { SPRING_API_URL } from '@/core/api/config/constants';

async function getSelectedOrganizationId(request: NextRequest): Promise<string | null> {
  return request.cookies.get('selectedOrganizationId')?.value || null;
}

async function getVerifiedKeycloakOrganizationId(request: NextRequest) {
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

function getErrorStatus(error: unknown) {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: unknown }).status;

    if (typeof status === 'number') {
      return status;
    }
  }

  return 500;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export async function GET(request: NextRequest) {
  try {
    const { accessToken, selectedOrganizationId } =
      await getVerifiedKeycloakOrganizationId(request);

    const response = await fetch(
      `${SPRING_API_URL}/api/organization-settings/keycloak/${encodeURIComponent(selectedOrganizationId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: payload.message || payload.error || 'Failed to fetch organization settings' },
        { status: response.status }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to fetch organization settings') },
      { status: getErrorStatus(error) }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { accessToken, selectedOrganizationId } =
      await getVerifiedKeycloakOrganizationId(request);
    const body = await request.json();

    const response = await fetch(
      `${SPRING_API_URL}/api/organization-settings/keycloak/${encodeURIComponent(selectedOrganizationId)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: payload.message || payload.error || 'Failed to update organization settings' },
        { status: response.status }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to update organization settings') },
      { status: getErrorStatus(error) }
    );
  }
}
