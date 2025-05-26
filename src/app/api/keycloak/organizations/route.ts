/**
 * Quick Organizations Test API Route
 * Lists available organizations to help you find a real organization ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';

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

    // Get organizations from Keycloak
    const organizations = await keycloakService.adminGet('/organizations');

    return NextResponse.json({
      organizations,
      count: organizations?.length || 0,
      message: 'Available organizations in Keycloak'
    });
  } catch (error: any) {
    console.error('Organizations API error:', error);
    
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
