import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import { getAdminRealmsRealmRoles } from '@/core/api/generated/keycloak';

export async function GET(request: NextRequest) {
  try {
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const realm = keycloakService.getRealm();

    const params = {
      search: searchParams.get('search') || undefined,
      first: searchParams.get('first') ? parseInt(searchParams.get('first')!) : 0,
      max: searchParams.get('max') ? parseInt(searchParams.get('max')!) : 100,
    };

    const roles = await getAdminRealmsRealmRoles(realm, params);
    return NextResponse.json(roles);
  } catch (error: any) {
    console.error('Roles API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch roles' },
      { status: error.status || 500 }
    );
  }
}
