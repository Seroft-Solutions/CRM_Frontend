import { NextRequest, NextResponse } from 'next/server'
import { auth, getServerAccessToken } from '@/auth'

/**
 * API route to get access token for authenticated user
 * This endpoint provides access tokens for making API calls to the Spring backend
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the access token from database
    const accessToken = await getServerAccessToken()

    if (!accessToken) {
      return NextResponse.json(
        { error: 'No valid access token found' },
        { status: 401 }
      )
    }

    // Return the access token
    return NextResponse.json(
      { 
        accessToken,
        userId: session.user.id,
        userEmail: session.user.email,
        organizations: session.user.organizations,
        expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour from now
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache'
        }
      }
    )
  } catch (error) {
    console.error('Error getting access token:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Health check endpoint
 */
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 })
}
