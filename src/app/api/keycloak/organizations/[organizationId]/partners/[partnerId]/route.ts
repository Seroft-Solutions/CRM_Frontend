/**
 * Remove Business Partner API Route
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import { deleteAdminRealmsRealmOrganizationsOrgIdMembersMemberId } from '@/core/api/generated/keycloak';

export async function DELETE(
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

    // Remove partner from organization
    await deleteAdminRealmsRealmOrganizationsOrgIdMembersMemberId(realm, organizationId, partnerId);

    return NextResponse.json({
      success: true,
      message: 'Business partner removed from organization successfully',
    });
  } catch (error: any) {
    console.error('Remove partner from organization error:', error);

    if (error.status === 404) {
      return NextResponse.json({ error: 'Partner not found in organization' }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to remove partner from organization' },
      { status: error.status || 500 }
    );
  }
}
