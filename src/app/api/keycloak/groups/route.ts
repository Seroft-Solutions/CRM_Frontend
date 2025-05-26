/**
 * Groups API Route
 * Handles groups retrieval using the unified Keycloak admin service
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import { getAdminRealmsRealmGroups } from '@/core/api/generated/keycloak';
import type { GroupRepresentation } from '@/core/api/generated/keycloak';

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

    // Get groups using generated endpoint
    const groups: GroupRepresentation[] = await getAdminRealmsRealmGroups(realm);

    return NextResponse.json(groups);
  } catch (error: any) {
    console.error('Groups API error:', error);
    
    // Enhanced error handling with proper status codes
    if (error.status === 403) {
      return NextResponse.json(
        { error: 'Access denied. Insufficient permissions.' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch groups' },
      { status: error.status || 500 }
    );
  }
}
