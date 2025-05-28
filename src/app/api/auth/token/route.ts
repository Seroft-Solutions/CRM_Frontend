import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Server-side API endpoint to get access tokens
 * This keeps tokens out of the session cookie but makes them available when needed
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Note: In the current implementation, we don't store tokens in the session
    // to reduce cookie size. If you need access tokens for API calls, you have options:
    
    // Option 1: Use session cookies for authentication (recommended)
    // Most APIs should accept the session cookie for authentication
    
    // Option 2: Store tokens in a secure server-side cache/database
    // and retrieve them using the user ID
    
    // Option 3: Refresh tokens directly from Keycloak when needed
    // This requires storing refresh tokens securely server-side
    
    return NextResponse.json({ 
      message: 'Tokens not available in optimized session',
      recommendation: 'Use session cookies for authentication or implement server-side token storage',
      userId: session.user.id,
      hasValidSession: true
    });
  } catch (error) {
    console.error('Token API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
