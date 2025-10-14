import { NextRequest, NextResponse } from 'next/server';
import { accessInviteService } from '@/server/access/service';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      console.warn('[Onboard/Accept] Missing token in request');
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    console.log('[Onboard/Accept] Validating invitation token');
    const result = await accessInviteService.acceptInvite(token);

    const duration = Date.now() - startTime;
    console.log('[Onboard/Accept] ✓ Invitation accepted successfully', {
      userId: result.userId,
      email: result.email,
      organizationId: result.organizationId,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      message: 'Invitation accepted successfully',
      result,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[Onboard/Accept] ✗ Invitation acceptance failed', {
      error: error.message,
      duration: `${duration}ms`,
    });

    return NextResponse.json(
      {
        error: error.message || 'Failed to accept invitation',
      },
      { status: 500 }
    );
  }
}
