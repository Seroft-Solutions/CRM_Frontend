import { NextRequest, NextResponse } from 'next/server';
import { accessInviteService } from '@/server/access/service';
import type { AccessInviteType } from '@/server/access/types';
import { keycloakService } from '@/core/api/services/keycloak-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: AccessInviteType }> }
) {
  try {
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    const { type } = await params;
    if (type !== 'user' && type !== 'partner') {
      return NextResponse.json({ error: 'Unsupported invite type' }, { status: 400 });
    }
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const page = Number(searchParams.get('page') ?? '1');
    const size = Number(searchParams.get('size') ?? '20');
    const search = searchParams.get('search') ?? undefined;

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    const response = await accessInviteService.listInvites({
      type,
      organizationId,
      page,
      size,
      search,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Access invitations list error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch invitations',
      },
      { status: 500 }
    );
  }
}
