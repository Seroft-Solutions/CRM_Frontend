/**
 * Organizations API Route
 * Uses the unified Keycloak admin service with generated endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import {
  getAdminRealmsRealmOrganizations,
  OrganizationRepresentationAttributes,
  postAdminRealmsRealmOrganizations,
} from '@/core/api/generated/keycloak';
import type { OrganizationRepresentation } from '@/core/api/generated/keycloak';

export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    const realm = keycloakService.getRealm();
    if (!realm) {
      throw new Error('Realm configuration missing');
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const params = search ? { search } : undefined;

    const organizations = await getAdminRealmsRealmOrganizations(realm, params);

    return NextResponse.json({
      organizations,
      count: Array.isArray(organizations) ? organizations.length : 0,
      message: 'Available organizations in Keycloak',
    });
  } catch (error: any) {
    console.error('Organizations GET API error:', error);

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch organizations',
        organizations: [],
        count: 0,
      },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    const realm = keycloakService.getRealm();
    if (!realm) {
      throw new Error('Realm configuration missing');
    }

    const requestData = await request.json();
    console.log('Raw request data:', JSON.stringify(requestData, null, 2));

    if (!requestData.organizationName && !requestData.name) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }
    const attributes: OrganizationRepresentationAttributes = {};
    if (requestData.organizationCode) {
      attributes.organizationCode = [requestData.organizationCode.toString()];
    }
    if (requestData.organizationEmail) {
      attributes.organizationEmail = [requestData.organizationEmail.toString()];
    }

    const organizationData: OrganizationRepresentation = {
      name: requestData.organizationName || requestData.name,
      attributes,
      enabled: true,
    };

    if (requestData.displayName && requestData.displayName.trim()) {
      organizationData.alias = requestData.displayName.trim();
    }

    if (requestData.description && requestData.description.trim()) {
      organizationData.description = requestData.description.trim();
    }

    if (requestData.domain && requestData.domain.trim()) {
      const domain = requestData.domain.trim().replace(/^@/, '');
      if (domain && domain.includes('.')) {
        organizationData.domains = [
          {
            name: domain,
            verified: false,
          },
        ];
      }
    }

    console.log('Sending to Keycloak:', JSON.stringify(organizationData, null, 2));

    await postAdminRealmsRealmOrganizations(realm, organizationData);

    return NextResponse.json(
      {
        message: 'Organization created successfully',
        name: organizationData.name,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Organizations POST API detailed error:', {
      message: error.message,
      status: error.status,
      responseData: error.response?.data,
      responseStatus: error.response?.status,
      requestUrl: error.config?.url,
      requestData: error.config?.data,
    });

    if (error.status === 409) {
      return NextResponse.json({ error: 'Organization already exists' }, { status: 409 });
    }

    if (error.status === 400) {
      return NextResponse.json(
        {
          error: 'Invalid organization data',
          details: error.response?.data || error.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to create organization',
      },
      { status: error.status || 500 }
    );
  }
}
