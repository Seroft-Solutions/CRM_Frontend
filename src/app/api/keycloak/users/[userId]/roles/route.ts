/**
 * User Roles API Route
 * Handles user role assignment and management using generated endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import type { RoleRepresentation } from '@/core/api/generated/keycloak';
import {
  deleteAdminRealmsRealmUsersUserIdRoleMappingsRealm,
  getAdminRealmsRealmUsersUserIdRoleMappingsRealm,
  postAdminRealmsRealmUsersUserIdRoleMappingsRealm,
} from '@/core/api/generated/keycloak';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    const { userId } = await params;
    const realm = 'crm';

    console.log('API Debug:', { userId, realm, baseURL: process.env.AUTH_KEYCLOAK_ISSUER });

    if (!realm) {
      throw new Error('Realm configuration missing');
    }

    const userRoles = await getAdminRealmsRealmUsersUserIdRoleMappingsRealm(realm, userId);

    return NextResponse.json(userRoles);
  } catch (error: any) {
    console.error('Get user roles API error:', error);

    if (error.status === 404) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch user roles' },
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
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    const { userId } = await params;
    const body = await request.json();
    const { roles, action } = body;
    const realm = 'crm';

    if (!Array.isArray(roles) || roles.length === 0) {
      return NextResponse.json(
        { error: 'Roles array is required and cannot be empty' },
        { status: 400 }
      );
    }

    if (!['assign', 'unassign'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "assign" or "unassign"' },
        { status: 400 }
      );
    }

    const validatedRoles: RoleRepresentation[] = roles.map((role: any) => {
      if (!role.id || !role.name) {
        throw new Error('Each role must have both id and name properties');
      }
      return {
        id: role.id,
        name: role.name,
        description: role.description,
        composite: role.composite,
        clientRole: role.clientRole,
        containerId: role.containerId,
      };
    });

    if (action === 'assign') {
      await postAdminRealmsRealmUsersUserIdRoleMappingsRealm(realm, userId, validatedRoles);
    } else {
      console.log(
        'Deleting roles:',
        validatedRoles.map((r) => r.name)
      );
      await deleteAdminRealmsRealmUsersUserIdRoleMappingsRealm(realm, userId, validatedRoles);
    }

    return NextResponse.json({
      success: true,
      message: `Roles ${action === 'assign' ? 'assigned' : 'unassigned'} successfully`,
      rolesCount: validatedRoles.length,
    });
  } catch (error: any) {
    console.error('User roles assignment API error:', error);

    if (error.status === 404) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (error.status === 409) {
      return NextResponse.json(
        { error: 'Role assignment conflict. Some roles may already be assigned.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to assign/unassign roles' },
      { status: error.status || 500 }
    );
  }
}
