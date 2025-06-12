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
  getAdminRealmsRealmUsers
} from '@/core/api/generated/keycloak';
import type { OrganizationRepresentation } from '@/core/api/generated/keycloak';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    // Get current user from session
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const realm = keycloakService.getRealm();
    if (!realm) {
      throw new Error('Realm configuration missing');
    }

    console.log('=== USER ORGANIZATIONS API ===');
    console.log('Session User ID (JWT sub):', session.user.id);
    console.log('Session User Email:', session.user.email);
    console.log('Realm:', realm);

    // Step 1: Get correct Keycloak user ID by email
    let keycloakUserId = session.user.id;
    
    if (session.user.email) {
      try {
        console.log('Looking up user by email:', session.user.email);
        const users = await getAdminRealmsRealmUsers(realm, {
          email: session.user.email,
          exact: true
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

    // Step 2: Try the user-specific organizations endpoint
    try {
      const organizations = await getAdminRealmsRealmOrganizationsMembersMemberIdOrganizations(
        realm,
        keycloakUserId
      );
      
      console.log('User-specific organizations from Keycloak:', JSON.stringify(organizations, null, 2));

      const userOrganizations = (organizations || [])
        .filter(org => org.enabled !== false)
        .map(org => ({
          id: org.id || '',
          name: org.name || org.alias || 'Unknown Organization',
          alias: org.alias,
          enabled: org.enabled,
          description: org.description
        }))
        .filter(org => org.id && org.name);

      console.log('Filtered user organizations:', JSON.stringify(userOrganizations, null, 2));
      console.log('Organizations count:', userOrganizations.length);
      console.log('=== END USER ORGANIZATIONS API ===');

      return NextResponse.json({
        organizations: userOrganizations,
        count: userOrganizations.length,
        userId: session.user.id,
        keycloakUserId: keycloakUserId,
        message: 'User organizations retrieved successfully'
      });
    } catch (error: any) {
      console.log('User-specific endpoint failed:', error.message);
      console.log('Trying alternative approach: check membership across all organizations');
      
      // Alternative approach: Get all organizations and check membership
      try {
        const allOrganizations = await getAdminRealmsRealmOrganizations(realm);
        console.log('All organizations:', allOrganizations?.length || 0);
        
        const userOrganizations = [];
        
        // Check each organization to see if user is a member
        for (const org of allOrganizations || []) {
          if (!org.id) continue;
          
          try {
            await getAdminRealmsRealmOrganizationsOrgIdMembersMemberId(
              realm,
              org.id,
              keycloakUserId
            );
            
            // If no error, user is a member
            userOrganizations.push({
              id: org.id,
              name: org.name || org.alias || 'Unknown Organization',
              alias: org.alias,
              enabled: org.enabled,
              description: org.description
            });
            
            console.log(`User is member of: ${org.name} (${org.id})`);
          } catch (memberError: any) {
            // 404 means user is not a member of this organization
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
          message: 'User organizations retrieved via membership check'
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
          error: fallbackError.message
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
          count: 0
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
        details: error.code || 'Unknown error'
      },
      { status: error.status || 500 }
    );
  }
}
