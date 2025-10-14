import { NextRequest, NextResponse } from 'next/server';
import { accessInviteService } from '@/server/access/service';
import type { AccessInviteType } from '@/server/access/types';
import { keycloakService } from '@/core/api/services/keycloak-service';

const DEFAULT_EXPIRY_MINUTES = 60 * 24;

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const permissionCheck = await keycloakService.verifyAdminPermissions();
    if (!permissionCheck.authorized) {
      console.warn('[Access/Invite] Unauthorized access attempt');
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    const body = await request.json();
    const { type, firstName, lastName, email, metadata, organizationId } = body as {
      type: AccessInviteType;
      firstName: string;
      lastName: string;
      email: string;
      metadata: any;
      organizationId: string;
    };

    console.log('[Access/Invite] Creating invitation', {
      type,
      email,
      organizationId,
    });

    if (!organizationId) {
      console.warn('[Access/Invite] Missing organizationId in request');
      return NextResponse.json({ error: 'organizationId is required' }, { status: 400 });
    }

    if (type !== 'user' && type !== 'partner') {
      console.warn('[Access/Invite] Unsupported invite type:', type);
      return NextResponse.json({ error: 'Unsupported invite type' }, { status: 400 });
    }

    const { record, token } = await accessInviteService.createInvite({
      type,
      firstName,
      lastName,
      email,
      metadata,
      organizationId,
    });

    const duration = Date.now() - startTime;
    console.log('[Access/Invite] ✓ Invitation created successfully', {
      inviteId: record.inviteId,
      type: record.type,
      email: record.email,
      organizationId: record.organizationId,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      invitation: record,
      token,
      expiresInMinutes: DEFAULT_EXPIRY_MINUTES,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[Access/Invite] ✗ Failed to create invitation', {
      error: error.message,
      duration: `${duration}ms`,
    });

    return NextResponse.json(
      {
        error: error.message || 'Failed to create access invitation',
      },
      { status: 500 }
    );
  }
}
