import { NextRequest, NextResponse } from 'next/server'
import { sessionUtils } from '@/lib/prisma'

/**
 * API route for session cleanup
 * This endpoint cleans up expired sessions and provides session statistics
 */
export async function POST(request: NextRequest) {
  try {
    // Clean up expired sessions
    const cleanedCount = await sessionUtils.cleanExpiredSessions()
    
    // Get session statistics
    const stats = await sessionUtils.getSessionStats()

    return NextResponse.json(
      { 
        message: 'Session cleanup completed',
        cleanedSessions: cleanedCount,
        sessionStats: stats
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error during session cleanup:', error)
    
    return NextResponse.json(
      { error: 'Session cleanup failed' },
      { status: 500 }
    )
  }
}

/**
 * Get session statistics
 */
export async function GET(request: NextRequest) {
  try {
    const stats = await sessionUtils.getSessionStats()

    return NextResponse.json(
      { 
        sessionStats: stats
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error getting session stats:', error)
    
    return NextResponse.json(
      { error: 'Failed to get session statistics' },
      { status: 500 }
    )
  }
}
