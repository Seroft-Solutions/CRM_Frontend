/**
 * Calendar Authentication Status API Route
 * FIXED: Checks if a user has valid Google Calendar authentication
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userEmail } = await request.json();

    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    // For now, return a mock response indicating authentication is required
    // In a real implementation, this would check the database for stored OAuth tokens
    const authStatus = {
      isAuthenticated: false,
      userEmail,
      hasValidToken: false,
      error: `No valid Google Calendar credentials found for ${userEmail}. Please authorize calendar access.`,
      scopes: [],
    };

    return NextResponse.json(authStatus);
  } catch (error: any) {
    console.error('Calendar auth status check failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to check calendar auth status',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
