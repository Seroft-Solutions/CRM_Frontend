/**
 * Authentication Check API Route
 * Simple endpoint to verify if user is authenticated
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Return simple success response
    return NextResponse.json({ 
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
      }
    });
  } catch (error: any) {
    console.error('Authentication check error:', error);
    
    return NextResponse.json(
      { error: 'Authentication check failed' },
      { status: 500 }
    );
  }
}