import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import {
  getAdminRealmsRealmUsersUserId,
  postAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUser,
  type PostAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUserBody,
  putAdminRealmsRealmUsersUserIdExecuteActionsEmail,
} from '@/core/api/generated/keycloak';

interface ReinviteOptions {
  sendPasswordReset?: boolean;
  redirectUri?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ organizationId: string; userId: string }> }
) {
  try {
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    const { organizationId, userId } = await params;
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
      // Optional body, ignored when missing
    }

    const user = await getAdminRealmsRealmUsersUserId(realm, userId);
    if (!user?.id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (options.sendPasswordReset !== false) {
      await putAdminRealmsRealmUsersUserIdExecuteActionsEmail(realm, userId, ['UPDATE_PASSWORD'], {
        client_id: 'web_app',
        lifespan: 43200,
        redirect_uri: options.redirectUri,
      });

      return NextResponse.json({
        success: true,
        message: 'Invitation email sent. User can set their password again.',
        emailType: 'password_reset',
        userId,
        organizationId,
      });
    }

    const inviteBody: PostAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUserBody = {
      id: userId,
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
      userId,
      organizationId,
    });
  } catch (error: any) {
    console.error('Failed to resend user invitation:', error);
    const statusCode = error?.status || 500;
    const errorMessage = error?.message || 'Failed to resend user invitation';
    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
