import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Optimized Session API Endpoint
 * Provides session information without sensitive tokens
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json(null, { status: 401 });
    }

    // Return clean session data without tokens
    const cleanSession = {
      user: {
        id: session.user?.id,
        name: session.user?.name,
        email: session.user?.email,
        image: session.user?.image,
        roles: session.user?.roles || [],
        organizations: session.user?.organizations || []
      },
      expires: session.expires,
      error: session.error
    };

    return NextResponse.json(cleanSession, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    );
  }
}
