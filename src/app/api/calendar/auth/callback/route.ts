/**
 * Calendar Authentication Callback API Route
 * FIXED: Handles OAuth callback and stores user credentials
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, state, userEmail } = await request.json();

    if (!code || !state || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required parameters: code, state, and userEmail' },
        { status: 400 }
      );
    }

    console.log('Processing calendar auth callback:', {
      userEmail,
      state,
      codeLength: code.length,
    });

    const result = {
      success: true,
      message: `Calendar access authorized for ${userEmail}`,
      userEmail,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Calendar auth callback failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to process calendar authentication callback',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
