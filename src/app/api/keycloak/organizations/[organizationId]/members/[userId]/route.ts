/**
 * Remove User from Organization API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import { deleteAdminRealmsRealmOrganizationsOrgIdMembersMemberId } from '@/core/api/generated/keycloak';

export async function DELETE(
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

    await deleteAdminRealmsRealmOrganizationsOrgIdMembersMemberId(realm, organizationId, userId);

    return NextResponse.json({
      success: true,
      message: 'User removed from organization successfully',
    });
  } catch (error: any) {
    console.error('Remove user from organization error:', error);

    if (error.status === 404) {
      return NextResponse.json({ error: 'User not found in organization' }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to remove user from organization' },
      { status: error.status || 500 }
    );
  }
}
