import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import {
  getAdminRealmsRealmUsersUserId,
  putAdminRealmsRealmUsersUserIdExecuteActionsEmail,
  postAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUser,
  type PostAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUserBody,
} from '@/core/api/generated/keycloak';

interface ReinviteOptions {
  sendPasswordReset?: boolean;
  redirectUri?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; partnerId: string }> }
) {
  try {
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    const { organizationId, partnerId } = await params;
    const realm = keycloakService.getRealm();

    let options: ReinviteOptions = { sendPasswordReset: true };

    try {
      const body = await request.json();
      options = {
        sendPasswordReset:
          body.sendPasswordReset !== undefined ? Boolean(body.sendPasswordReset) : true,
        redirectUri: body.redirectUri,
      };
    } catch (_error) {
      // No body provided is fine – fall back to defaults
    }

    const user = await getAdminRealmsRealmUsersUserId(realm, partnerId);
    if (!user?.id) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    if (options.sendPasswordReset !== false) {
      await putAdminRealmsRealmUsersUserIdExecuteActionsEmail(
        realm,
        partnerId,
        ['UPDATE_PASSWORD'],
        {
          client_id: 'web_app',
          lifespan: 43200, // 12 hours
          redirect_uri: options.redirectUri,
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Invitation email sent. Partner can set their password again.',
        emailType: 'password_reset',
        partnerId,
        organizationId,
      });
    }

    const inviteBody: PostAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUserBody = {
      id: partnerId,
    };

    await postAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUser(
      realm,
      organizationId,
      inviteBody
    );

    return NextResponse.json({
      success: true,
      message: 'Organization invitation email sent again.',
      emailType: 'organization_invite',
      partnerId,
      organizationId,
    });
  } catch (error: any) {
    console.error('Failed to resend partner invitation:', error);
    const statusCode = error?.status || 500;
    const errorMessage = error?.message || 'Failed to resend partner invitation';
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
