/**
 * User Groups API Route
 * Handles user group assignment and management using generated endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import { 
  getAdminRealmsRealmUsersUserIdGroups,
  putAdminRealmsRealmUsersUserIdGroupsGroupId,
  deleteAdminRealmsRealmUsersUserIdGroupsGroupId,
} from '@/core/api/generated/keycloak';
import type { GroupRepresentation } from '@/core/api/generated/keycloak';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify admin permissions
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: 401 }
      );
    }

    // Await params in Next.js 15+
    const { userId } = await params;
    const realm = keycloakService.getRealm();

    // Get user's current groups using generated endpoint
    const userGroups: GroupRepresentation[] = await getAdminRealmsRealmUsersUserIdGroups(
      realm,
      userId
    );

    return NextResponse.json(userGroups);
  } catch (error: any) {
    console.error('Get user groups API error:', error);
    
    if (error.status === 404) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user groups' },
      { status: error.status || 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Verify admin permissions
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: 401 }
      );
    }

    // Await params in Next.js 15+
    const { userId } = await params;
    const body = await request.json();
    const { groups, action } = body;
    const realm = keycloakService.getRealm();

    // Validate input
    if (!Array.isArray(groups) || groups.length === 0) {
      return NextResponse.json(
        { error: 'Groups array is required and cannot be empty' },
        { status: 400 }
      );
    }

    if (!['assign', 'unassign'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "assign" or "unassign"' },
        { status: 400 }
      );
    }

    // Type-safe group validation
    const validatedGroups: GroupRepresentation[] = groups.map((group: any) => {
      if (!group.id) {
        throw new Error('Each group must have an id property');
      }
      return {
        id: group.id,
        name: group.name,
        path: group.path,
        subGroups: group.subGroups,
        attributes: group.attributes,
        realmRoles: group.realmRoles,
        clientRoles: group.clientRoles,
        access: group.access,
      };
    });

    // Process each group assignment/unassignment
    const results = await Promise.allSettled(
      validatedGroups.map(async (group) => {
        if (action === 'assign') {
          return await putAdminRealmsRealmUsersUserIdGroupsGroupId(
            realm,
            userId,
            group.id!
          );
        } else {
          return await deleteAdminRealmsRealmUsersUserIdGroupsGroupId(
            realm,
            userId,
            group.id!
          );
        }
      })
    );

    // Check for any failures
    const failures = results.filter(result => result.status === 'rejected');
    
    if (failures.length > 0) {
      console.error('Some group operations failed:', failures);
      return NextResponse.json(
        { 
          error: `${failures.length} out of ${validatedGroups.length} group operations failed`,
          details: failures.map(f => (f as PromiseRejectedResult).reason.message)
        },
        { status: 207 } // Multi-status
      );
    }

    return NextResponse.json({ 
      success: true,
      message: `Groups ${action === 'assign' ? 'assigned' : 'unassigned'} successfully`,
      groupsCount: validatedGroups.length
    });
  } catch (error: any) {
    console.error('User groups assignment API error:', error);
    
    if (error.status === 404) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    if (error.status === 409) {
      return NextResponse.json(
        { error: 'Group assignment conflict. Some groups may already be assigned.' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to assign/unassign groups' },
      { status: error.status || 500 }
    );
  }
}
