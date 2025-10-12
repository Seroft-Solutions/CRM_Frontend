/**
 * Organization Partners API Route
 * GET: Fetch business partners in an organization
 * POST: DEPRECATED - Use /api/access/invite instead
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import {
  getAdminRealmsRealmOrganizationsOrgIdMembers,
  getAdminRealmsRealmUsersUserIdGroups,
  getAdminRealmsRealmUsersUserIdRoleMappingsRealm,
} from '@/core/api/generated/keycloak';

/**
 * GET /api/keycloak/organizations/[organizationId]/partners
 * Fetches all business partners (users with "Business Partners" group) in an organization
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
    const realm = keycloakService.getRealm();

    // Get organization members
    const members = await getAdminRealmsRealmOrganizationsOrgIdMembers(realm, organizationId);

    // Parallel processing to fetch groups and roles for all members
    const enhancedMembers = await Promise.all(
      members.map(async (member) => {
        try {
          if (!member.id) return member;

          // Fetch groups and roles in parallel
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

    // Filter for business partners only
    const businessPartners = enhancedMembers.filter((member) => {
      const memberGroups = member.groups || [];
      return memberGroups.includes('Business Partners');
    });

    console.log(
      `Partners API: ${members.length} total members, ${businessPartners.length} business partners`
    );

    return NextResponse.json(businessPartners);
  } catch (error: any) {
    console.error('Failed to fetch business partners:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch business partners' },
      { status: error.status || 500 }
    );
  }
}

/**
 * POST /api/keycloak/organizations/[organizationId]/partners
 * DEPRECATED: This endpoint is deprecated. Use the new unified access management API instead.
 *
 * @deprecated Use POST /api/access/invite with type: "partner" instead
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  console.warn('DEPRECATED: POST /api/keycloak/organizations/[organizationId]/partners is deprecated');
  console.warn('Please use POST /api/access/invite with type: "partner" instead');

  return NextResponse.json(
    {
      error: 'This endpoint is deprecated',
      message: 'Please use the new unified access management API',
      migrationGuide: {
        oldEndpoint: 'POST /api/keycloak/organizations/[organizationId]/partners',
        newEndpoint: 'POST /api/access/invite',
        requiredFields: {
          type: 'partner',
          organizationId: 'string',
          email: 'string',
          firstName: 'string',
          lastName: 'string',
          metadata: {
            channelType: {
              id: 'number',
              name: 'string (optional)',
            },
            groups: 'AccessGroupDescriptor[] (optional)',
            note: 'string (optional)',
          },
        },
        example: {
          type: 'partner',
          organizationId: '123',
          email: 'partner@example.com',
          firstName: 'John',
          lastName: 'Doe',
          metadata: {
            channelType: {
              id: 1,
              name: 'Direct Sales',
            },
            groups: [],
          },
        },
      },
    },
    { status: 410 } // 410 Gone - indicates the resource is no longer available
  );
}
