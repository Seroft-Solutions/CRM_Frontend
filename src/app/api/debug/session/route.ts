/**
 * Session Debug API Route
 * Shows what's available in the NextAuth session for debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({
        message: 'No session found',
        authenticated: false
      });
    }

    // Return session data for debugging (sanitized)
    const debugInfo = {
      authenticated: true,
      user: {
        id: session.user?.id,
        name: session.user?.name,
        email: session.user?.email,
        roles: session.user?.roles || [],
        organizations: session.user?.organizations || [],
      },
      sessionError: session.error || null,
      organizationContext: {
        hasOrganizations: (session.user?.organizations?.length || 0) > 0,
        organizationCount: session.user?.organizations?.length || 0,
        firstOrganization: session.user?.organizations?.[0] || null,
      }
    };

    return NextResponse.json(debugInfo);
  } catch (error: any) {
    console.error('Session debug error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get session debug info',
        details: error.message
      },
      { status: 500 }
    );
  }
}
