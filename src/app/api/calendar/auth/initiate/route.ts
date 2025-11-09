/**
 * Calendar Authentication Initiation API Route
 * FIXED: Generates OAuth URL for Google Calendar access
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userEmail, organizationId, scopes } = await request.json();

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    const state = `${userEmail}-${organizationId || 'no-org'}-${Date.now()}`;

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=your-client-id&` +
      `redirect_uri=${encodeURIComponent('http://localhost:3000/api/calendar/auth/callback')}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes?.join(' ') || 'https://www.googleapis.com/auth/calendar')}&` +
      `state=${encodeURIComponent(state)}&` +
      `access_type=offline&` +
      `prompt=consent`;

    return NextResponse.json({
      authUrl,
      state,
    });
  } catch (error: any) {
    console.error('Calendar auth initiation failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to initiate calendar authentication',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
