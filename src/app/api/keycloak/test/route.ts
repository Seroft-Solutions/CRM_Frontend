import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';

export async function GET(request: NextRequest) {
  try {
    const authTest = await keycloakService.testAdminAuth();

    if (!authTest.success) {
      return NextResponse.json(
        {
          error: 'Admin authentication failed',
          details: authTest.error,
          debugInfo: keycloakService.getDebugInfo(),
        },
        { status: 401 }
      );
    }

    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json(
        {
          error: 'Permission verification failed',
          details: permissionCheck.error,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Authentication and permissions working',
      debugInfo: keycloakService.getDebugInfo(),
    });
  } catch (error: any) {
    console.error('Auth test error:', error);
    return NextResponse.json(
      {
        error: 'Authentication test failed',
        details: error.message,
        debugInfo: keycloakService.getDebugInfo(),
      },
      { status: 500 }
    );
  }
}
