import { auth } from "./auth"
import { NextRequest, NextResponse } from "next/server"

console.log('🚀 MIDDLEWARE: Initializing authentication middleware')

async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const { pathname, search, origin } = request.nextUrl
  const fullUrl = `${pathname}${search}`
  
  console.log('🌐 MIDDLEWARE: Processing request', {
    method: request.method,
    url: fullUrl,
    pathname,
    search,
    origin,
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get('user-agent')?.substring(0, 100),
    referer: request.headers.get('referer')
  })

  // Special logging for Keycloak callback
  if (pathname.includes('/api/auth/callback/keycloak')) {
    console.log('🔄 MIDDLEWARE: Keycloak callback detected!', {
      fullUrl,
      searchParams: Object.fromEntries(request.nextUrl.searchParams),
      method: request.method,
      headers: {
        'content-type': request.headers.get('content-type'),
        'authorization': request.headers.get('authorization') ? '***PRESENT***' : 'NOT_PRESENT',
        'cookie': request.headers.get('cookie') ? '***PRESENT***' : 'NOT_PRESENT'
      }
    })
    
    // Check for common callback parameters
    const code = request.nextUrl.searchParams.get('code')
    const state = request.nextUrl.searchParams.get('state')
    const error = request.nextUrl.searchParams.get('error')
    const errorDescription = request.nextUrl.searchParams.get('error_description')
    
    if (error) {
      console.error('❌ MIDDLEWARE: Keycloak callback error detected', {
        error,
        errorDescription,
        state
      })
    } else if (code) {
      console.log('✅ MIDDLEWARE: Keycloak callback with authorization code', {
        hasCode: !!code,
        codeLength: code?.length,
        hasState: !!state,
        state
      })
    } else {
      console.warn('⚠️ MIDDLEWARE: Keycloak callback without code or error', {
        searchParams: Object.fromEntries(request.nextUrl.searchParams)
      })
    }
  }

  // Log API route requests
  if (pathname.startsWith('/api/')) {
    console.log('🔧 MIDDLEWARE: API route request', {
      endpoint: pathname,
      method: request.method,
      hasBody: request.headers.get('content-length') !== '0'
    })
  }

  try {
    // Call the NextAuth middleware
    console.log('🔐 MIDDLEWARE: Calling NextAuth middleware')
    const response = await auth(request)
    
    const processingTime = Date.now() - startTime
    
    if (response) {
      console.log('📤 MIDDLEWARE: NextAuth returned response', {
        status: response.status,
        statusText: response.statusText,
        type: response.headers.get('content-type'),
        location: response.headers.get('location'),
        processingTime: `${processingTime}ms`
      })
      
      // Log redirects
      if (response.status >= 300 && response.status < 400) {
        console.log('🔄 MIDDLEWARE: Redirect response', {
          from: fullUrl,
          to: response.headers.get('location'),
          status: response.status
        })
      }
    } else {
      console.log('✅ MIDDLEWARE: Request allowed through', {
        url: fullUrl,
        processingTime: `${processingTime}ms`
      })
    }
    
    return response
  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('❌ MIDDLEWARE: Error in authentication middleware', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: fullUrl,
      processingTime: `${processingTime}ms`
    })
    
    // Return a proper error response instead of throwing
    return NextResponse.json(
      { error: 'Authentication middleware error' },
      { status: 500 }
    )
  }
}

export default middleware

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

console.log('✅ MIDDLEWARE: Authentication middleware configuration loaded', {
  matcher: config.matcher
})
