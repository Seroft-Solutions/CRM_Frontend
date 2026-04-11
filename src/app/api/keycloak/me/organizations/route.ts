/**
 * Current User Organizations API Route
 * Uses alternative approach since direct user-organizations endpoint may not be available
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import {
  getAdminRealmsRealmOrganizations,
  getAdminRealmsRealmOrganizationsMembersMemberIdOrganizations,
  getAdminRealmsRealmOrganizationsOrgIdMembersMemberId,
  getAdminRealmsRealmOrganizationsOrgId,
  getAdminRealmsRealmUsers,
} from '@/core/api/generated/keycloak';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const realm = keycloakService.getRealm();
    if (!realm) {
      throw new Error('Realm configuration missing');
    }

    console.log('=== USER ORGANIZATIONS API ===');
    console.log('Session User ID (JWT sub):', session.user.id);
    console.log('Session User Email:', session.user.email);
    console.log('Realm:', realm);

    let keycloakUserId = session.user.id;

    if (session.user.email) {
      try {
        console.log('Looking up user by email:', session.user.email);
        const users = await getAdminRealmsRealmUsers(realm, {
          email: session.user.email,
          exact: true,
        });

        if (users && users.length > 0) {
          keycloakUserId = users[0].id!;
          console.log('Found correct Keycloak user ID:', keycloakUserId);
        } else {
          console.log('No user found with email, using JWT sub');
        }
      } catch (emailLookupError: any) {
        console.log('Email lookup failed, using JWT sub:', emailLookupError.message);
      }
    }

    try {
      const orgMemberships = await getAdminRealmsRealmOrganizationsMembersMemberIdOrganizations(
        realm,
        keycloakUserId
      );

      console.log(
        'User organization memberships from Keycloak:',
        JSON.stringify(orgMemberships, null, 2)
      );

      const userOrganizations = [];

      for (const orgRef of orgMemberships || []) {
        if (!orgRef.id) continue;

        try {
          const fullOrg = await getAdminRealmsRealmOrganizationsOrgId(realm, orgRef.id);

          console.log(`Full org details for ${orgRef.id}:`, JSON.stringify(fullOrg, null, 2));

          if (fullOrg.enabled !== false) {
            userOrganizations.push({
              id: fullOrg.id || '',
              name: fullOrg.name || fullOrg.alias || 'Unknown Organization',
              alias: fullOrg.alias,
              enabled: fullOrg.enabled,
              description: fullOrg.description,
              email: fullOrg.attributes?.organizationEmail?.[0] || '',
            });
          }
        } catch (orgError: any) {
          console.log(`Failed to fetch org ${orgRef.id}:`, orgError.message);
        }
      }

      console.log('Filtered user organizations:', JSON.stringify(userOrganizations, null, 2));
      console.log('Organizations count:', userOrganizations.length);
      console.log('=== END USER ORGANIZATIONS API ===');

      return NextResponse.json({
        organizations: userOrganizations,
        count: userOrganizations.length,
        userId: session.user.id,
        keycloakUserId: keycloakUserId,
        message: 'User organizations retrieved successfully',
      });
    } catch (error: any) {
      console.log('User-specific endpoint failed:', error.message);
      console.log('Trying alternative approach: check membership across all organizations');

      try {
        const allOrganizations = await getAdminRealmsRealmOrganizations(realm);
        console.log('All organizations:', allOrganizations?.length || 0);

        const userOrganizations = [];

        for (const org of allOrganizations || []) {
          if (!org.id) continue;

          try {
            await getAdminRealmsRealmOrganizationsOrgIdMembersMemberId(
              realm,
              org.id,
              keycloakUserId
            );

            const fullOrg = await getAdminRealmsRealmOrganizationsOrgId(realm, org.id);

            userOrganizations.push({
              id: fullOrg.id || '',
              name: fullOrg.name || fullOrg.alias || 'Unknown Organization',
              alias: fullOrg.alias,
              enabled: fullOrg.enabled,
              description: fullOrg.description,
              email: fullOrg.attributes?.organizationEmail?.[0] || '',
            });

            console.log(`User is member of: ${org.name} (${org.id})`);
          } catch (memberError: any) {
            if (memberError.status === 404) {
              console.log(`User is NOT member of: ${org.name} (${org.id})`);
            }
          }
        }

        console.log('User organizations found:', JSON.stringify(userOrganizations, null, 2));
        console.log('Organizations count:', userOrganizations.length);
        console.log('=== END USER ORGANIZATIONS API ===');

        return NextResponse.json({
          organizations: userOrganizations,
          count: userOrganizations.length,
          userId: session.user.id,
          keycloakUserId: keycloakUserId,
          message: 'User organizations retrieved via membership check',
        });
      } catch (fallbackError: any) {
        console.log('Fallback approach also failed:', fallbackError.message);
        console.log('=== END USER ORGANIZATIONS API ===');

        return NextResponse.json({
          organizations: [],
          count: 0,
          userId: session.user.id,
          keycloakUserId: keycloakUserId,
          message: 'Failed to retrieve user organizations',
          error: fallbackError.message,
        });
      }
    }
  } catch (error: any) {
    console.error('User organizations GET API error:', error);

    if (error.status === 404) {
      return NextResponse.json(
        {
          error: 'Endpoint not found - Organizations feature may not be available',
          organizations: [],
          count: 0,
        },
        { status: 404 }
      );
    }

    if (error.status === 403) {
      return NextResponse.json(
        { error: 'Access denied. Insufficient permissions.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch user organizations',
        organizations: [],
        count: 0,
        details: error.code || 'Unknown error',
      },
      { status: error.status || 500 }
    );
  }
}
