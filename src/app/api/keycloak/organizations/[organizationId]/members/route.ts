/**
 * Organization Members API Route
 * Proxies requests to Keycloak Admin API to avoid CORS issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakAdminClient, verifyAdminPermissions } from '@/lib/keycloak-admin-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    // Verify permissions
    const permissionCheck = await verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: 401 }
      );
    }

    const { organizationId } = params;
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const queryParams: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // Make request to Keycloak
    const members = await keycloakAdminClient.getOrganizationMembers(organizationId, queryParams);

    return NextResponse.json(members);
  } catch (error) {
    console.error('Organization members API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization members' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    // Verify permissions
    const permissionCheck = await verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: 401 }
      );
    }

    const { organizationId } = params;
    const body = await request.json();

    // Invite user to organization
    const result = await keycloakAdminClient.inviteUserToOrganization(organizationId, body);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Invite user API error:', error);
    return NextResponse.json(
      { error: 'Failed to invite user to organization' },
      { status: 500 }
    );
  }
}
