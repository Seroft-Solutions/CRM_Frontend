/**
 * Organization Members API Route
 * GET: Fetch organization members (excluding business partners)
 * POST: DEPRECATED - Use /api/access/invite instead
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import {
  getAdminRealmsRealmOrganizationsOrgIdMembers,
  getAdminRealmsRealmUsersUserIdGroups,
  getAdminRealmsRealmUsersUserIdRoleMappingsRealm,
} from '@/core/api/generated/keycloak';
import type { GetAdminRealmsRealmOrganizationsOrgIdMembersParams } from '@/core/api/generated/keycloak';

/**
 * GET /api/keycloak/organizations/[organizationId]/members
 * Fetches all organization members (excluding business partners)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    const { organizationId } = await params;
    const { searchParams } = new URL(request.url);
    const realm = keycloakService.getRealm();

    // Extract query parameters
    const queryParams: GetAdminRealmsRealmOrganizationsOrgIdMembersParams = {};
    if (searchParams.has('search')) {
      queryParams.search = searchParams.get('search') || undefined;
    }
    if (searchParams.has('first')) {
      queryParams.first = parseInt(searchParams.get('first') || '0', 10);
    }
    if (searchParams.has('max')) {
      queryParams.max = parseInt(searchParams.get('max') || '20', 10);
    }

    // Get organization members
    const members = await getAdminRealmsRealmOrganizationsOrgIdMembers(
      realm,
      organizationId,
      queryParams
    );

    // Parallel processing to fetch groups and roles for all members
    const enhancedMembers = await Promise.all(
      members.map(async (member) => {
        try {
          if (!member.id) return member;

          const [memberGroups, memberRoles] = await Promise.all([
            getAdminRealmsRealmUsersUserIdGroups(realm, member.id).catch((error) => {
              console.warn(`Failed to fetch groups for user ${member.id}:`, error);
              return [];
            }),
            getAdminRealmsRealmUsersUserIdRoleMappingsRealm(realm, member.id).catch((error) => {
              console.warn(`Failed to fetch roles for user ${member.id}:`, error);
              return [];
            }),
          ]);

          return {
            ...member,
            groups: memberGroups.map((g) => g.name).filter(Boolean),
            groupDetails: memberGroups,
            realmRoles: memberRoles.map((r) => r.name).filter(Boolean),
            roleDetails: memberRoles,
          };
        } catch (error) {
          console.warn(`Failed to enhance member data for ${member.id}:`, error);
          return member;
        }
      })
    );

    // Filter out business partner users
    const filteredMembers = enhancedMembers.filter((member) => {
      const memberGroups = member.groups || [];
      const isBusinessPartner = memberGroups.includes('Business Partners');
      return !isBusinessPartner;
    });

    console.log(
      `Members API: ${members.length} total members, ${filteredMembers.length} after filtering`
    );

    return NextResponse.json(filteredMembers);
  } catch (error: any) {
    console.error('Failed to fetch organization members:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch organization members' },
      { status: error.status || 500 }
    );
  }
}

/**
 * POST /api/keycloak/organizations/[organizationId]/members
 * DEPRECATED: This endpoint is deprecated. Use the new unified access management API instead.
 *
 * @deprecated Use POST /api/access/invite with type: "user" instead
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  console.warn('DEPRECATED: POST /api/keycloak/organizations/[organizationId]/members is deprecated');
  console.warn('Please use POST /api/access/invite with type: "user" instead');

  return NextResponse.json(
    {
      error: 'This endpoint is deprecated',
      message: 'Please use the new unified access management API',
      migrationGuide: {
        oldEndpoint: 'POST /api/keycloak/organizations/[organizationId]/members',
        newEndpoint: 'POST /api/access/invite',
        requiredFields: {
          type: 'user',
          organizationId: 'string',
          email: 'string',
          firstName: 'string',
          lastName: 'string',
          metadata: {
            groups: 'AccessGroupDescriptor[] (optional)',
            note: 'string (optional)',
          },
        },
        example: {
          type: 'user',
          organizationId: '123',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
          metadata: {
            groups: [],
            note: 'Welcome to the team',
          },
        },
      },
    },
    { status: 410 } // 410 Gone - indicates the resource is no longer available
  );
}
