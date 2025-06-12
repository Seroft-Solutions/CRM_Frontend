/**
 * Current User Organizations API Route
 * Uses alternative approach since direct user-organizations endpoint may not be available
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import { 
  getAdminRealmsRealmOrganizations
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
    console.log('User ID:', session.user.id);
    console.log('Realm:', realm);

    // Alternative approach: Get all organizations and filter by user membership
    // This is a fallback since the direct endpoint might not be available
    const organizations = await getAdminRealmsRealmOrganizations(realm);
    
    console.log('Raw organizations from Keycloak:', JSON.stringify(organizations, null, 2));

    // Filter and map organizations for the user
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
      message: 'User organizations retrieved successfully (showing all available orgs)',
      note: 'Using fallback method - showing all organizations until proper filtering is implemented'
    });
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
