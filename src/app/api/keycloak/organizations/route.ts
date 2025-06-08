/**
 * Organizations API Route
 * Uses the unified Keycloak admin service with generated endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import { 
  getAdminRealmsRealmOrganizations,
  postAdminRealmsRealmOrganizations
} from '@/core/api/generated/keycloak';
import type { OrganizationRepresentation } from '@/core/api/generated/keycloak';

export async function GET(request: NextRequest) {
  try {
    // Verify admin permissions
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: 401 }
      );
    }

    const realm = keycloakService.getRealm();
    if (!realm) {
      throw new Error('Realm configuration missing');
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const params = search ? { search } : undefined;

    // Get organizations using generated endpoint
    const organizations = await getAdminRealmsRealmOrganizations(realm, params);

    return NextResponse.json({
      organizations,
      count: Array.isArray(organizations) ? organizations.length : 0,
      message: 'Available organizations in Keycloak'
    });
  } catch (error: any) {
    console.error('Organizations GET API error:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to fetch organizations',
        organizations: [],
        count: 0
      },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin permissions
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: 401 }
      );
    }

    const realm = keycloakService.getRealm();
    if (!realm) {
      throw new Error('Realm configuration missing');
    }

    // Parse request body
    const requestData = await request.json();
    console.log('Raw request data:', JSON.stringify(requestData, null, 2));

    // Validate required fields
    if (!requestData.organizationName && !requestData.name) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    // Create minimal valid organization data structure for Keycloak
    const organizationData: OrganizationRepresentation = {
      name: requestData.organizationName || requestData.name,
      enabled: true
    };

    // Only add optional fields if they have meaningful values
    if (requestData.displayName && requestData.displayName.trim()) {
      organizationData.alias = requestData.displayName.trim();
    }
    
    if (requestData.description && requestData.description.trim()) {
      organizationData.description = requestData.description.trim();
    }

    // Handle domains properly - must be valid domain format (no @ symbol)
    if (requestData.domain && requestData.domain.trim()) {
      const domain = requestData.domain.trim().replace(/^@/, ''); // Remove @ if present
      if (domain && domain.includes('.')) { // Basic domain validation
        organizationData.domains = [{
          name: domain,
          verified: false
        }];
      }
    }

    console.log('Sending to Keycloak:', JSON.stringify(organizationData, null, 2));

    // Create organization using generated endpoint
    await postAdminRealmsRealmOrganizations(realm, organizationData);

    return NextResponse.json({
      message: 'Organization created successfully',
      name: organizationData.name
    }, { status: 201 });

  } catch (error: any) {
    console.error('Organizations POST API detailed error:', {
      message: error.message,
      status: error.status,
      responseData: error.response?.data,
      responseStatus: error.response?.status,
      requestUrl: error.config?.url,
      requestData: error.config?.data
    });
    
    if (error.status === 409) {
      return NextResponse.json(
        { error: 'Organization already exists' },
        { status: 409 }
      );
    }
    
    if (error.status === 400) {
      return NextResponse.json(
        { 
          error: 'Invalid organization data',
          details: error.response?.data || error.message
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create organization'
      },
      { status: error.status || 500 }
    );
  }
}
