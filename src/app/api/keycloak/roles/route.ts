/**
 * Roles API Route
 * Handles realm roles retrieval using the unified Keycloak admin service
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import { getAdminRealmsRealmRoles } from '@/core/api/generated/keycloak';
import type { RoleRepresentation } from '@/core/api/generated/keycloak';

export async function GET(request: NextRequest) {
  try {
    // Verify permissions using the unified service
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        { error: permissionCheck.error },
        { status: 401 }
      );
    }

    const realm = keycloakService.getRealm();

    // Get realm roles using generated endpoint
    const roles: RoleRepresentation[] = await getAdminRealmsRealmRoles(realm);

    return NextResponse.json(roles);
  } catch (error: any) {
    console.error('Roles API error:', error);
    
    // Enhanced error handling with proper status codes
    if (error.status === 403) {
      return NextResponse.json(
        { error: 'Access denied. Insufficient permissions.' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch roles' },
      { status: error.status || 500 }
    );
  }
}
