/**
 * Send UPDATE_PASSWORD Required Action Email
 * Sends password reset email to newly created users
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import { putAdminRealmsRealmUsersUserIdExecuteActionsEmail } from '@/core/api/generated/keycloak';

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

    const { userId } = await params;
    const realm = keycloakService.getRealm();
    
    if (!realm) {
      throw new Error('Realm configuration missing');
    }

    // Parse request body for optional parameters
    const body = await request.json().catch(() => ({}));
    const {
      lifespan = 43200, // 12 hours default
      redirectUri
    } = body;

    // Prepare the required actions - UPDATE_PASSWORD for password reset
    const requiredActions = ['UPDATE_PASSWORD'];

    // Send the UPDATE_PASSWORD required action email using generated endpoint
    await putAdminRealmsRealmUsersUserIdExecuteActionsEmail(
      realm,
      userId,
      requiredActions,
      {
        client_id: 'web_app', // Using your specified client
        lifespan,
        redirect_uri: redirectUri
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully',
      userId,
      action: 'UPDATE_PASSWORD'
    });

  } catch (error: any) {
    console.error('Send password reset email error:', error);
    
    if (error.status === 404) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    if (error.status === 400) {
      return NextResponse.json(
        { error: 'Invalid request - check user email configuration' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: error.message || 'Failed to send password reset email',
        details: error.status ? `HTTP ${error.status}` : 'Unknown error'
      },
      { status: error.status || 500 }
    );
  }
}
