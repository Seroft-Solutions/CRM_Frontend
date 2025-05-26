/**
 * Session API Route
 * 
 * This route provides session information for client-side components
 * and API services, reducing the need for multiple session calls.
 */

import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(null, { status: 401 })
    }

    // Return session data with tokens for API calls
    return NextResponse.json({
      user: {
        id: session.user?.id,
        name: session.user?.name,
        email: session.user?.email,
        image: session.user?.image,
        roles: session.user?.roles || []
      },
      accessToken: session.accessToken,
      idToken: session.idToken,
      expires: session.expires
    })
  } catch (error) {
    console.error('Session API error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve session' },
      { status: 500 }
    )
  }
}
