import { auth } from "./auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Enhanced logging for middleware
const middlewareLogger = {
  info: (message: string, data?: any) => {
    console.log(`[MIDDLEWARE][INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[MIDDLEWARE][WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[MIDDLEWARE][ERROR] ${message}`, error);
  },
  debug: (message: string, data?: any) => {
    if (process.env.AUTH_DEBUG === 'true') {
      console.log(`[MIDDLEWARE][DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
};

export default async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const { pathname, search, origin } = request.nextUrl;
  const fullUrl = `${pathname}${search}`;
  
  middlewareLogger.debug('Middleware execution started', {
    url: fullUrl,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    origin,
    timestamp: new Date().toISOString()
  });

  try {
    // Get auth session
    const session = await auth();
    const duration = Date.now() - startTime;
    
    middlewareLogger.debug(`Auth session retrieved in ${duration}ms`, {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      rolesCount: session?.user?.roles?.length || 0,
      organizationsCount: session?.user?.organizations?.length || 0,
      hasAccessToken: !!session?.access_token
    });

    // Log authentication state for debugging
    if (session) {
      middlewareLogger.info('Authenticated request', {
        url: fullUrl,
        userId: session.user.id,
        roles: session.user.roles,
        organizations: session.user.organizations?.map(org => org.name)
      });
    } else {
      middlewareLogger.info('Unauthenticated request', {
        url: fullUrl,
        isAuthPath: pathname.startsWith('/api/auth'),
        isPublicPath: pathname === '/' || pathname.startsWith('/auth')
      });
    }

    // Check for auth errors in URL
    const error = request.nextUrl.searchParams.get('error');
    if (error) {
      middlewareLogger.error('Auth error detected in URL', {
        error,
        url: fullUrl,
        hasSession: !!session
      });
    }

    // Log redirect scenarios
    if (pathname === '/' && session) {
      middlewareLogger.info('Redirecting authenticated user from root to dashboard', {
        userId: session.user.id
      });
    }

    const totalDuration = Date.now() - startTime;
    middlewareLogger.debug(`Middleware execution completed in ${totalDuration}ms`, {
      url: fullUrl,
      authenticated: !!session
    });

    return NextResponse.next();
  } catch (error) {
    const duration = Date.now() - startTime;
    middlewareLogger.error(`Middleware execution failed after ${duration}ms`, {
      url: fullUrl,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Continue with the request even if middleware fails
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}