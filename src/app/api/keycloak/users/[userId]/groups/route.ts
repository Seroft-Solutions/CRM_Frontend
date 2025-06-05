/**
 * User Groups Assignment API Route
 * Handles assigning/removing users to/from groups
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import { 
  getAdminRealmsRealmUsersUserIdGroups,
  putAdminRealmsRealmUsersUserIdGroupsGroupId,
  deleteAdminRealmsRealmUsersUserIdGroupsGroupId,
  getAdminRealmsRealmGroups,
  getAdminRealmsRealmUsersUserId
} from '@/core/api/generated/keycloak';
import type { 
  GroupRepresentation,
  UserRepresentation
} from '@/core/api/generated/keycloak';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: 401 }
      );
    }

    const { userId } = await params;
    const realm = keycloakService.getRealm();

    // Get user's current groups
    const userGroups = await getAdminRealmsRealmUsersUserIdGroups(realm, userId);
    
    // Get all available groups
    const allGroups = await getAdminRealmsRealmGroups(realm);
    
    // Get user details
    const user = await getAdminRealmsRealmUsersUserId(realm, userId);

    return NextResponse.json({
      user,
      assignedGroups: userGroups,
      availableGroups: allGroups,
      success: true
    });
  } catch (error: any) {
    console.error('Get user groups API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get user groups' },
      { status: error.status || 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: 401 }
      );
    }

    const { userId } = await params;
    const body = await request.json();
    const realm = keycloakService.getRealm();

    const { action, groupIds } = body;

    if (!action || !groupIds || !Array.isArray(groupIds)) {
      return NextResponse.json(
        { error: 'Invalid request. action and groupIds array are required' },
        { status: 400 }
      );
    }

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const groupId of groupIds) {
      try {
        if (action === 'assign') {
          await putAdminRealmsRealmUsersUserIdGroupsGroupId(realm, userId, groupId);
          results.push({ groupId, success: true, action: 'assigned' });
          successCount++;
        } else if (action === 'unassign') {
          await deleteAdminRealmsRealmUsersUserIdGroupsGroupId(realm, userId, groupId);
          results.push({ groupId, success: true, action: 'unassigned' });
          successCount++;
        } else {
          results.push({ groupId, success: false, error: 'Invalid action' });
          errorCount++;
        }
      } catch (error: any) {
        console.error(`Failed to ${action} group ${groupId} for user ${userId}:`, error);
        results.push({ 
          groupId, 
          success: false, 
          error: error.message || `Failed to ${action} group`
        });
        errorCount++;
      }
    }

    return NextResponse.json({
      success: errorCount === 0,
      message: `${successCount} group(s) ${action}ed successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      results,
      successCount,
      errorCount
    });
  } catch (error: any) {
    console.error('User groups assignment API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to assign/unassign groups' },
      { status: error.status || 500 }
    );
  }
}
