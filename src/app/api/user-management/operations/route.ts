/**
 * User Management API Route with Sync Integration
 * 
 * This API route provides user management operations with automatic
 * sync to the Spring Boot User Profile application.
 */

import { NextRequest, NextResponse } from 'next/server';
import { userManagementService } from '@/services/user-management/user-management.service';
import { keycloakService } from '@/core/api/services/keycloak-service';

export async function POST(request: NextRequest) {
  try {
    // Verify admin permissions
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create_user':
        return await handleCreateUser(data);
      
      case 'update_user':
        return await handleUpdateUser(data);
      
      case 'set_user_enabled':
        return await handleSetUserEnabled(data);
      
      case 'assign_groups':
        return await handleAssignGroups(data);
      
      case 'assign_roles':
        return await handleAssignRoles(data);
      
      case 'invite_user':
        return await handleInviteUser(data);
      
      case 'bulk_import':
        return await handleBulkImport(data);
      
      case 'force_sync_user':
        return await handleForceSyncUser(data);
      
      case 'force_sync_organization':
        return await handleForceSyncOrganization(data);
      
      case 'get_sync_status':
        return await handleGetSyncStatus();
      
      case 'configure_sync':
        return await handleConfigureSync(data);
      
      default:
        return NextResponse.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Enhanced user management API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleCreateUser(data: {
  userData: any;
  organizationId?: string;
}) {
  try {
    const result = await userManagementService.createUser(
      data.userData,
      data.organizationId
    );

    return NextResponse.json({
      success: true,
      userId: result.userId,
      synced: result.sync.synced,
      message: result.sync.synced 
        ? 'User created and synced successfully'
        : 'User created but sync pending',
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to create user' 
      },
      { status: 500 }
    );
  }
}

async function handleUpdateUser(data: {
  userId: string;
  userData: any;
  organizationId?: string;
}) {
  try {
    const result = await userManagementService.updateUser(
      data.userId,
      data.userData,
      data.organizationId
    );

    return NextResponse.json({
      success: result.success,
      synced: result.sync.synced,
      message: result.sync.synced 
        ? 'User updated and synced successfully'
        : 'User updated but sync pending',
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update user' 
      },
      { status: 500 }
    );
  }
}

async function handleSetUserEnabled(data: {
  userId: string;
  enabled: boolean;
  organizationId?: string;
}) {
  try {
    const result = await userManagementService.setUserEnabled(
      data.userId,
      data.enabled,
      data.organizationId
    );

    return NextResponse.json({
      success: result.success,
      synced: result.sync.synced,
      message: result.sync.synced 
        ? `User ${data.enabled ? 'enabled' : 'disabled'} and synced successfully`
        : `User ${data.enabled ? 'enabled' : 'disabled'} but sync pending`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to update user status' 
      },
      { status: 500 }
    );
  }
}

async function handleAssignGroups(data: {
  userId: string;
  groupIds: string[];
  action?: 'assign' | 'unassign';
  groupAction?: 'assign' | 'unassign';
  organizationId?: string;
}) {
  try {
    const actionType = data.groupAction || data.action || 'assign';
    const result = await userManagementService.assignGroups(
      data.userId,
      data.groupIds,
      actionType,
      data.organizationId
    );

    return NextResponse.json({
      success: result.success,
      synced: result.sync.synced,
      message: result.sync.synced 
        ? `Groups ${actionType}ed and synced successfully`
        : `Groups ${actionType}ed but sync pending`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to assign groups' 
      },
      { status: 500 }
    );
  }
}

async function handleAssignRoles(data: {
  userId: string;
  roles: any[];
  action?: 'assign' | 'unassign';
  roleAction?: 'assign' | 'unassign';
  organizationId?: string;
}) {
  try {
    const actionType = data.roleAction || data.action || 'assign';
    const result = await userManagementService.assignRoles(
      data.userId,
      data.roles,
      actionType,
      data.organizationId
    );

    return NextResponse.json({
      success: result.success,
      synced: result.sync.synced,
      message: result.sync.synced 
        ? `Roles ${actionType}ed and synced successfully`
        : `Roles ${actionType}ed but sync pending`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to assign roles' 
      },
      { status: 500 }
    );
  }
}

async function handleInviteUser(data: {
  organizationId: string;
  invitationData: {
    email: string;
    firstName?: string;
    lastName?: string;
    selectedGroups?: string[];
    invitationNote?: string;
  };
}) {
  try {
    const result = await userManagementService.inviteUserToOrganization(
      data.organizationId,
      data.invitationData
    );

    return NextResponse.json({
      success: result.success,
      userId: result.userId,
      synced: result.synced,
      message: result.synced 
        ? 'User invited and synced successfully'
        : 'User invited but sync pending',
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to invite user' 
      },
      { status: 500 }
    );
  }
}

async function handleBulkImport(data: {
  organizationId: string;
  users: any[];
}) {
  try {
    const result = await userManagementService.bulkImportUsers(
      data.organizationId,
      data.users
    );

    return NextResponse.json({
      success: result.failed === 0,
      totalProcessed: result.totalProcessed,
      successful: result.successful,
      failed: result.failed,
      synced: result.synced,
      errors: result.errors,
      message: `Processed ${result.totalProcessed} users: ${result.successful} successful, ${result.failed} failed, ${result.synced} synced`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to bulk import users' 
      },
      { status: 500 }
    );
  }
}

async function handleForceSyncUser(data: {
  userId: string;
  organizationId?: string;
}) {
  try {
    const result = await userManagementService.forceSyncUser(
      data.userId,
      data.organizationId
    );

    return NextResponse.json({
      success: result.synced,
      error: result.error,
      message: result.synced 
        ? 'User sync completed successfully'
        : `User sync failed: ${result.error}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to force sync user' 
      },
      { status: 500 }
    );
  }
}

async function handleForceSyncOrganization(data: {
  organizationId: string;
}) {
  try {
    const result = await userManagementService.forceSyncOrganization(
      data.organizationId
    );

    return NextResponse.json({
      success: result.synced,
      error: result.error,
      message: result.synced 
        ? 'Organization sync completed successfully'
        : `Organization sync failed: ${result.error}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to force sync organization' 
      },
      { status: 500 }
    );
  }
}

async function handleGetSyncStatus() {
  try {
    const status = userManagementService.getSyncStatus();

    return NextResponse.json({
      success: true,
      status,
      message: 'Sync status retrieved successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to get sync status' 
      },
      { status: 500 }
    );
  }
}

async function handleConfigureSync(data: {
  options: any;
}) {
  try {
    userManagementService.configureSyncOptions(data.options);

    return NextResponse.json({
      success: true,
      message: 'Sync configuration updated successfully',
      configuration: userManagementService.getConfiguration(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to configure sync' 
      },
      { status: 500 }
    );
  }
}

// GET endpoint for sync status
export async function GET(request: NextRequest) {
  try {
    // Verify admin permissions
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'sync_status':
        return await handleGetSyncStatus();
      
      case 'configuration':
        const config = userManagementService.getConfiguration();
        return NextResponse.json({
          success: true,
          configuration: config,
          message: 'Configuration retrieved successfully',
        });
      
      default:
        return NextResponse.json({
          success: true,
          message: 'Enhanced User Management API with Sync Integration',
          availableActions: {
            POST: [
              'create_user',
              'update_user', 
              'set_user_enabled',
              'assign_groups',
              'assign_roles',
              'invite_user',
              'bulk_import',
              'force_sync_user',
              'force_sync_organization',
              'get_sync_status',
              'configure_sync'
            ],
            GET: [
              'sync_status',
              'configuration'
            ]
          },
        });
    }
  } catch (error: any) {
    console.error('Enhanced user management GET API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
