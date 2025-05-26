/**
 * Organization Members API Route
 * Uses unified Keycloak admin service with generated endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import { 
  getAdminRealmsRealmOrganizationsOrgIdMembers,
  postAdminRealmsRealmOrganizationsOrgIdMembersInviteUser,
} from '@/core/api/generated/keycloak';
import type { 
  GetAdminRealmsRealmOrganizationsOrgIdMembersParams,
  PostAdminRealmsRealmOrganizationsOrgIdMembersInviteUserBody,
  MemberRepresentation
} from '@/core/api/generated/keycloak';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    // Verify permissions using the unified service
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: 401 }
      );
    }

    // Await params in Next.js 15+
    const { organizationId } = await params;
    const { searchParams } = new URL(request.url);
    const realm = keycloakService.getRealm();
    
    // Extract and type-safe query parameters
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

    // Get organization members using generated endpoint
    const members: MemberRepresentation[] = await getAdminRealmsRealmOrganizationsOrgIdMembers(
      realm, 
      organizationId, 
      queryParams
    );

    return NextResponse.json(members);
  } catch (error: any) {
    console.error('Organization members API error:', error);
    
    // Enhanced error handling with proper status codes
    if (error.status === 404) {
      return NextResponse.json(
        { error: 'Organization not found' },
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
      { error: error.message || 'Failed to fetch organization members' },
      { status: error.status || 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string }> }
) {
  try {
    // Verify permissions using the unified service
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: 401 }
      );
    }

    // Await params in Next.js 15+
    const { organizationId } = await params;
    const body = await request.json();
    const realm = keycloakService.getRealm();

    // Type-safe body validation
    const inviteData: PostAdminRealmsRealmOrganizationsOrgIdMembersInviteUserBody = {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
    };

    // Validate required fields
    if (!inviteData.email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteData.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Invite user using generated endpoint
    await postAdminRealmsRealmOrganizationsOrgIdMembersInviteUser(
      realm,
      organizationId,
      inviteData
    );

    return NextResponse.json({ 
      success: true,
      message: 'User invited successfully',
      email: inviteData.email 
    });
  } catch (error: any) {
    console.error('Invite user API error:', error);
    
    // Enhanced error handling with specific status codes
    if (error.status === 404) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }
    
    if (error.status === 409) {
      return NextResponse.json(
        { error: 'User already exists in organization' },
        { status: 409 }
      );
    }
    
    if (error.status === 403) {
      return NextResponse.json(
        { error: 'Access denied. Insufficient permissions.' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to invite user to organization' },
      { status: error.status || 500 }
    );
  }
}
