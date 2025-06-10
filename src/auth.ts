import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"
import { rolesManager } from "@/components/auth/roles-manager"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      organizations?: Array<{ name: string; id: string }>
      roles?: string[]
    }
    access_token?: string
    refresh_token?: string
  }
  
  interface JWT {
    id_token?: string
    access_token?: string
    refresh_token?: string
    expires_at?: number
    error?: string
    organizations?: Array<{ name: string; id: string }>
    roles?: string[]
    // Add session size tracking and server-side storage
    sessionSize?: number
    sessionId?: string
  }
}

interface KeycloakTokenPayload {
  sub: string
  organizations?: Record<string, { id: string }>
  realm_access?: { roles?: string[] }
  resource_access?: Record<string, { roles?: string[] }>
  [key: string]: any
}

// Enhanced logging utility
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[AUTH][INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[AUTH][WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[AUTH][ERROR] ${message}`, error);
    if (error instanceof Error) {
      console.error(`[AUTH][ERROR] Stack:`, error.stack);
    }
  },
  debug: (message: string, data?: any) => {
    if (process.env.AUTH_DEBUG === 'true') {
      console.log(`[AUTH][DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
};

// Add code reuse prevention tracking
const processedCodes = new Set<string>();
const codeProcessingAttempts = new Map<string, number>();

// Server-side session storage for large data (global to persist across requests)
const serverSideSessionData = globalThis.serverSideSessionData || new Map<string, {
  roles: string[];
  organizations: Array<{ name: string; id: string }>;
  accessToken: string;
  refreshToken: string;
  lastUpdated: number;
}>();

// Ensure global persistence
if (typeof globalThis !== 'undefined') {
  globalThis.serverSideSessionData = serverSideSessionData;
}

// Clean up old server-side sessions (every 30 minutes)
if (typeof globalThis !== 'undefined' && !globalThis.sessionCleanupInterval) {
  globalThis.sessionCleanupInterval = setInterval(() => {
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;
    
    for (const [sessionId, data] of serverSideSessionData.entries()) {
      if (now - data.lastUpdated > thirtyMinutes) {
        serverSideSessionData.delete(sessionId);
        logger.debug('Cleaned up expired server-side session', { sessionId });
      }
    }
  }, 30 * 60 * 1000);
}

function generateSessionId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

function storeServerSideData(sessionId: string, data: {
  roles: string[];
  organizations: Array<{ name: string; id: string }>;
  accessToken: string;
  refreshToken: string;
}) {
  serverSideSessionData.set(sessionId, {
    ...data,
    lastUpdated: Date.now()
  });
  
  logger.info('Stored server-side session data', {
    sessionId,
    rolesCount: data.roles.length,
    organizationsCount: data.organizations.length,
    hasAccessToken: !!data.accessToken,
    hasRefreshToken: !!data.refreshToken,
    totalStoredSessions: serverSideSessionData.size
  });
  
  // Verify storage immediately
  const verified = serverSideSessionData.get(sessionId);
  if (verified) {
    logger.debug('Session storage verified successfully', { sessionId });
  } else {
    logger.error('Session storage verification failed', { sessionId });
  }
}

function getServerSideData(sessionId: string) {
  const data = serverSideSessionData.get(sessionId);
  if (data) {
    data.lastUpdated = Date.now(); // Update access time
    logger.debug('Retrieved server-side session data', {
      sessionId,
      rolesCount: data.roles.length,
      organizationsCount: data.organizations.length
    });
  } else {
    logger.warn('Server-side session data not found', { 
      sessionId,
      availableSessions: Array.from(serverSideSessionData.keys()),
      totalSessions: serverSideSessionData.size
    });
  }
  return data;
}

function isCodeAlreadyProcessed(code: string): boolean {
  return processedCodes.has(code);
}

function markCodeAsProcessed(code: string): void {
  processedCodes.add(code);
  // Clean up old codes after 10 minutes
  setTimeout(() => {
    processedCodes.delete(code);
    codeProcessingAttempts.delete(code);
  }, 10 * 60 * 1000);
}

function incrementCodeAttempt(code: string): number {
  const attempts = (codeProcessingAttempts.get(code) || 0) + 1;
  codeProcessingAttempts.set(code, attempts);
  return attempts;
}

function parseOrganizations(accessToken: string): Array<{ name: string; id: string }> {
  try {
    logger.debug('Parsing organizations from access token');
    
    const [, payload] = accessToken.split('.')
    if (!payload) {
      logger.warn('No payload found in access token for organizations parsing');
      return []
    }
    
    const decoded: KeycloakTokenPayload = JSON.parse(atob(payload))
    logger.debug('Decoded token payload for organizations', { 
      hasOrganizations: !!decoded.organizations,
      organizationsKeys: decoded.organizations ? Object.keys(decoded.organizations) : []
    });
    
    const organizations = decoded.organizations || {}
    
    const parsedOrgs = Object.entries(organizations).map(([name, data]) => ({
      name,
      id: data?.id || name
    }))
    
    logger.info(`Successfully parsed ${parsedOrgs.length} organizations`, { organizations: parsedOrgs });
    return parsedOrgs
  } catch (error) {
    logger.error('Failed to parse organizations from token', error)
    return []
  }
}

function parseRoles(accessToken: string): string[] {
  try {
    logger.debug('Parsing roles from access token');
    
    const [, payload] = accessToken.split('.')
    if (!payload) {
      logger.warn('No payload found in access token for roles parsing');
      return []
    }
    
    const decoded: KeycloakTokenPayload = JSON.parse(atob(payload))
    logger.debug('Decoded token payload for roles', {
      hasRealmAccess: !!decoded.realm_access,
      hasResourceAccess: !!decoded.resource_access,
      realmRolesCount: decoded.realm_access?.roles?.length || 0,
      resourceAccessKeys: decoded.resource_access ? Object.keys(decoded.resource_access) : []
    });
    
    const roles: string[] = []
    
    // Get realm roles
    if (decoded.realm_access?.roles) {
      roles.push(...decoded.realm_access.roles)
      logger.debug(`Added ${decoded.realm_access.roles.length} realm roles`);
    }
    
    // Get client roles (resource_access)
    if (decoded.resource_access) {
      Object.entries(decoded.resource_access).forEach(([clientId, client]) => {
        if (client.roles) {
          roles.push(...client.roles)
          logger.debug(`Added ${client.roles.length} roles from client: ${clientId}`);
        }
      })
    }
    
    const uniqueRoles = [...new Set(roles)] // Remove duplicates
    logger.info(`Successfully parsed ${uniqueRoles.length} unique roles`);
    
    // Don't log all roles in production due to size, just count and sample
    if (process.env.AUTH_DEBUG === 'true' && uniqueRoles.length <= 10) {
      logger.debug('Parsed roles sample', { roles: uniqueRoles });
    } else if (uniqueRoles.length > 10) {
      logger.debug('Large role set detected', { 
        totalRoles: uniqueRoles.length, 
        sampleRoles: uniqueRoles.slice(0, 5),
        estimatedSize: `${JSON.stringify(uniqueRoles).length} bytes`
      });
    }
    
    return uniqueRoles
  } catch (error) {
    logger.error('Failed to parse roles from token', error)
    return []
  }
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  const refreshStartTime = Date.now();
  logger.info('Starting token refresh process', { 
    hasRefreshToken: !!token.refresh_token,
    tokenExpiresAt: token.expires_at ? new Date(token.expires_at * 1000).toISOString() : 'unknown',
    currentTime: new Date().toISOString()
  });

  try {
    if (!token.refresh_token) {
      logger.warn('No refresh token available for token refresh');
      return token;
    }

    const tokenUrl = `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`;
    logger.debug('Token refresh URL', { url: tokenUrl });

    const requestBody = {
      grant_type: 'refresh_token',
      client_id: process.env.AUTH_KEYCLOAK_ID!,
      client_secret: process.env.AUTH_KEYCLOAK_SECRET!,
      refresh_token: token.refresh_token
    };

    logger.debug('Token refresh request', { 
      grant_type: requestBody.grant_type,
      client_id: requestBody.client_id,
      hasClientSecret: !!requestBody.client_secret,
      hasRefreshToken: !!requestBody.refresh_token
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'NextAuth-CRM-Frontend'
      },
      body: new URLSearchParams(requestBody)
    });

    const responseTime = Date.now() - refreshStartTime;
    logger.info(`Token refresh response received in ${responseTime}ms`, { 
      status: response.status,
      statusText: response.statusText
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Token refresh failed', { 
        status: response.status,
        statusText: response.statusText,
        errorResponse: errorText
      });
      return { ...token, error: 'RefreshAccessTokenError' };
    }

    const data = await response.json();
    logger.debug('Token refresh successful', {
      hasAccessToken: !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
      hasIdToken: !!data.id_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type
    });

    const refreshedToken = {
      ...token,
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? token.refresh_token,
      id_token: data.id_token ?? token.id_token,
      expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      organizations: parseOrganizations(data.access_token),
      roles: parseRoles(data.access_token)
    };

    logger.info('Token refresh completed successfully', {
      newExpiresAt: new Date(refreshedToken.expires_at! * 1000).toISOString(),
      organizationsCount: refreshedToken.organizations?.length || 0,
      rolesCount: refreshedToken.roles?.length || 0
    });

    return refreshedToken;
  } catch (error) {
    const responseTime = Date.now() - refreshStartTime;
    logger.error(`Token refresh failed after ${responseTime}ms`, error);
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID!,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET!,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER!,
      // Enhanced PKCE and security configuration
      checks: ["pkce", "state"],
      allowDangerousEmailAccountLinking: false,
      // Add authorization URL parameters to prevent caching
      authorization: {
        params: {
          prompt: "select_account",
          max_age: "0", // Force fresh authentication
        }
      }
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, account, user, trigger }) {
      const callbackStartTime = Date.now();
      const callbackId = Math.random().toString(36).substring(7);
      
      logger.info(`JWT callback triggered [${callbackId}]`, { 
        trigger,
        hasAccount: !!account,
        hasUser: !!user,
        hasToken: !!token,
        accountProvider: account?.provider,
        tokenSub: token.sub
      });

      try {
        if (account?.provider === "keycloak") {
          // Enhanced code reuse prevention
          const authCode = account.access_token?.substring(0, 10) || 'unknown';
          const attempts = incrementCodeAttempt(authCode);
          
          logger.info(`Processing Keycloak login [${callbackId}]`, {
            accountType: account.type,
            providerAccountId: account.providerAccountId,
            hasAccessToken: !!account.access_token,
            hasRefreshToken: !!account.refresh_token,
            hasIdToken: !!account.id_token,
            expiresIn: account.expires_in,
            scope: account.scope,
            codeAttempts: attempts,
            authCodePrefix: authCode
          });

          // Check for code reuse
          if (isCodeAlreadyProcessed(authCode)) {
            logger.error(`CODE REUSE DETECTED [${callbackId}]`, {
              authCodePrefix: authCode,
              attempts,
              message: 'This authorization code has already been processed'
            });
            return { ...token, error: 'CodeAlreadyUsed' };
          }

          // Check for too many attempts
          if (attempts > 2) {
            logger.error(`TOO MANY CODE ATTEMPTS [${callbackId}]`, {
              authCodePrefix: authCode,
              attempts,
              message: 'Too many attempts with this authorization code'
            });
            return { ...token, error: 'TooManyAttempts' };
          }

          // Mark code as processed
          markCodeAsProcessed(authCode);

          // Parse roles and organizations
          const organizations = parseOrganizations(account.access_token);
          const roles = parseRoles(account.access_token);

          // Calculate session size before storing
          const sessionData = {
            id: token.sub || user?.id || '',
            organizations,
            roles,
            access_token: account.access_token,
            refresh_token: account.refresh_token
          };
          
          const estimatedSize = JSON.stringify(sessionData).length;
          logger.info(`Session data size estimate [${callbackId}]`, {
            estimatedBytes: estimatedSize,
            rolesCount: roles.length,
            organizationsCount: organizations.length,
            willExceedLimit: estimatedSize > 3000 // Conservative limit
          });

          // Use server-side storage for large sessions
          if (estimatedSize > 3000 || roles.length > 20) {
            logger.warn(`Large session detected, using server-side storage [${callbackId}]`, {
              estimatedBytes: estimatedSize,
              rolesCount: roles.length
            });

            // Generate session ID and store data server-side
            const sessionId = generateSessionId();
            storeServerSideData(sessionId, {
              roles,
              organizations,
              accessToken: account.access_token,
              refreshToken: account.refresh_token
            });

            // Store minimal data in JWT
            token.id_token = account.id_token;
            token.expires_at = Math.floor(Date.now() / 1000) + (account.expires_in ?? 0);
            token.sessionId = sessionId; // Reference to server-side data
            token.sessionSize = estimatedSize;
            
            // Also store access_token and refresh_token for token refresh
            token.access_token = account.access_token;
            token.refresh_token = account.refresh_token;
            
            // Store critical role information as backup (first 10 roles to fit in token)
            token.roles = roles.slice(0, 10);
            token.organizations = organizations;
            
            // Store roles in roles manager
            if (token.sub) {
              rolesManager.setUserRoles(token.sub, roles);
              logger.info(`User roles set in roles manager [${callbackId}]`, { 
                userSub: token.sub,
                rolesCount: roles.length 
              });
            }
          } else {
            logger.info(`Normal session size, using JWT storage [${callbackId}]`, {
              estimatedBytes: estimatedSize,
              rolesCount: roles.length
            });

            // Store data normally in JWT
            token.id_token = account.id_token;
            token.access_token = account.access_token;
            token.refresh_token = account.refresh_token;
            token.expires_at = Math.floor(Date.now() / 1000) + (account.expires_in ?? 0);
            token.organizations = organizations;
            token.roles = roles;
            token.sessionSize = estimatedSize;

            if (token.sub) {
              rolesManager.setUserRoles(token.sub, roles);
              logger.info(`User roles set in roles manager [${callbackId}]`, { 
                userSub: token.sub,
                rolesCount: roles.length 
              });
            }
          }

          logger.debug(`Token expiration set [${callbackId}]`, {
            expiresIn: account.expires_in,
            expiresAt: token.expires_at,
            expiresAtISO: new Date(token.expires_at * 1000).toISOString()
          });
        }

        // Check if token needs refresh
        const currentTime = Date.now() / 1000;
        const shouldRefresh = token.expires_at && currentTime >= (token.expires_at - 60); // 60 seconds buffer
        
        logger.debug(`Token expiration check [${callbackId}]`, {
          currentTime: new Date(currentTime * 1000).toISOString(),
          expiresAt: token.expires_at ? new Date(token.expires_at * 1000).toISOString() : 'unknown',
          timeUntilExpiry: token.expires_at ? token.expires_at - currentTime : 'unknown',
          shouldRefresh
        });

        // Refresh token if expired
        if (shouldRefresh) {
          logger.info(`Token is expiring soon, attempting refresh [${callbackId}]`);
          token = await refreshAccessToken(token);
        }

        const callbackDuration = Date.now() - callbackStartTime;
        logger.info(`JWT callback completed in ${callbackDuration}ms [${callbackId}]`, {
          hasError: !!token.error,
          tokenError: token.error,
          sessionSize: token.sessionSize,
          usingServerSideStorage: !!token.sessionId
        });

        return token;
      } catch (error) {
        const callbackDuration = Date.now() - callbackStartTime;
        logger.error(`JWT callback failed after ${callbackDuration}ms [${callbackId}]`, error);
        return { ...token, error: 'JWTCallbackError' };
      }
    },
    
    async session({ session, token }) {
      const sessionStartTime = Date.now();
      logger.debug('Session callback triggered', {
        hasToken: !!token,
        tokenSub: token.sub,
        tokenError: token.error,
        usingServerSideStorage: !!token.sessionId,
        sessionSize: token.sessionSize
      });

      try {
        if (token.sub) {
          session.user.id = token.sub;
        }
        
        let rolesFound = false;
        let organizationsFound = false;
        
        // Get data from server-side storage if using it
        if (token.sessionId) {
          const serverData = getServerSideData(token.sessionId as string);
          if (serverData) {
            session.user.organizations = serverData.organizations;
            session.user.roles = serverData.roles;
            session.access_token = serverData.accessToken;
            session.refresh_token = serverData.refreshToken;
            rolesFound = true;
            organizationsFound = true;
            logger.debug('Loaded session data from server-side storage', {
              sessionId: token.sessionId,
              rolesCount: serverData.roles.length,
              organizationsCount: serverData.organizations.length
            });
          } else {
            logger.error('Server-side session data not found - trying fallback methods', { 
              sessionId: token.sessionId,
              hasJwtRoles: !!token.roles,
              hasJwtOrganizations: !!token.organizations,
              hasJwtAccessToken: !!token.access_token
            });
          }
        }
        
        // Fallback 1: Get data from JWT if not found in server storage
        if (!rolesFound && token.roles) {
          session.user.roles = token.roles;
          rolesFound = true;
          logger.warn('Using fallback roles from JWT', { 
            rolesCount: token.roles.length,
            isPartialRoles: token.roles.length === 10 // Indicates truncated roles
          });
        }
        
        if (!organizationsFound && token.organizations) {
          session.user.organizations = token.organizations;
          organizationsFound = true;
          logger.debug('Using fallback organizations from JWT', {
            organizationsCount: token.organizations.length
          });
        }
        
        // Fallback 2: Get roles from rolesManager if still not found
        if (!rolesFound && token.sub) {
          const rolesFromManager = rolesManager.getUserRoles(token.sub);
          if (rolesFromManager && rolesFromManager.length > 0) {
            session.user.roles = rolesFromManager;
            rolesFound = true;
            logger.info('Retrieved roles from rolesManager', {
              userSub: token.sub,
              rolesCount: rolesFromManager.length
            });
          } else {
            logger.warn('No roles found in rolesManager either', {
              userSub: token.sub,
              rolesManagerHasUser: rolesManager.hasUser(token.sub)
            });
          }
        }
        
        // Fallback 3: Parse roles from access token if available
        if (!rolesFound && token.access_token) {
          logger.warn('Attempting to re-parse roles from access token');
          const rolesFromToken = parseRoles(token.access_token);
          if (rolesFromToken.length > 0) {
            session.user.roles = rolesFromToken;
            rolesFound = true;
            // Store back in rolesManager for future use
            if (token.sub) {
              rolesManager.setUserRoles(token.sub, rolesFromToken);
            }
            logger.info('Re-parsed roles from access token', {
              rolesCount: rolesFromToken.length
            });
          }
        }
        
        // Set access and refresh tokens
        if (token.access_token) {
          session.access_token = token.access_token;
        }
        if (token.refresh_token) {
          session.refresh_token = token.refresh_token;
        }
        
        // Final check and warning
        if (!rolesFound) {
          logger.error('CRITICAL: No roles found for user session', {
            userSub: token.sub,
            hasServerSideStorage: !!token.sessionId,
            hasJwtRoles: !!token.roles,
            hasAccessToken: !!token.access_token,
            rolesManagerStatus: token.sub ? rolesManager.hasUser(token.sub) : false
          });
          // Set empty array to prevent undefined
          session.user.roles = [];
        }

        const sessionDuration = Date.now() - sessionStartTime;
        logger.debug(`Session callback completed in ${sessionDuration}ms`, {
          userId: session.user.id,
          organizationsCount: session.user.organizations?.length || 0,
          rolesCount: session.user.roles?.length || 0,
          hasAccessToken: !!session.access_token,
          sessionSize: token.sessionSize,
          rolesSource: rolesFound ? 'found' : 'empty'
        });
        
        return session;
      } catch (error) {
        const sessionDuration = Date.now() - sessionStartTime;
        logger.error(`Session callback failed after ${sessionDuration}ms`, error);
        return session;
      }
    },
    
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      
      logger.debug('Authorization check', {
        pathname,
        isLoggedIn,
        userId: auth?.user?.id,
        userRolesCount: auth?.user?.roles?.length || 0
      });

      const isProtected = pathname.startsWith('/dashboard') || 
                         pathname.startsWith('/areas') ||
                         pathname.startsWith('/calls') ||
                         pathname.startsWith('/parties') ||
                         pathname.startsWith('/user-management') ||
                         pathname.startsWith('/cities') ||
                         pathname.startsWith('/districts') ||
                         pathname.startsWith('/states') ||
                         pathname.startsWith('/products') ||
                         pathname.startsWith('/sources') ||
                         pathname.startsWith('/priorities') ||
                         pathname.startsWith('/call-types') ||
                         pathname.startsWith('/sub-call-types') ||
                         pathname.startsWith('/call-categories') ||
                         pathname.startsWith('/call-statuses') ||
                         pathname.startsWith('/call-remarks') ||
                         pathname.startsWith('/channel-types') ||
                         pathname.startsWith('/organizations');
      
      const isOrganizationSetup = pathname.startsWith('/organization-setup');
      
      if (isProtected) {
        if (isLoggedIn) {
          logger.debug('Access granted to protected route', { pathname, userId: auth.user.id });
          return true;
        }
        logger.info('Access denied to protected route - not logged in', { pathname });
        return false;
      } else if (isOrganizationSetup) {
        // Allow access to organization setup if logged in
        if (isLoggedIn) {
          logger.debug('Access granted to organization setup', { pathname, userId: auth.user.id });
          return true;
        }
        logger.info('Access denied to organization setup - not logged in', { pathname });
        return false;
      } else if (isLoggedIn && pathname === '/') {
        logger.info('Redirecting logged in user from root to dashboard', { userId: auth.user.id });
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      
      logger.debug('Access granted to public route', { pathname });
      return true;
    },
  },
  events: {
    async signOut({ token }) {
      logger.info('Sign out event triggered', { 
        userSub: token?.sub,
        hasIdToken: !!token?.id_token,
        sessionId: token?.sessionId
      });

      // Clear server-side session data
      if (token?.sessionId) {
        serverSideSessionData.delete(token.sessionId as string);
        logger.info('Cleared server-side session data', { sessionId: token.sessionId });
      }

      // Clear roles from roles manager on signout
      if (token?.sub) {
        rolesManager.clearUserRoles(token.sub);
        logger.info('Cleared user roles from roles manager', { userSub: token.sub });
      }
      
      if (token?.id_token) {
        try {
          const keycloakIssuer = process.env.AUTH_KEYCLOAK_ISSUER;
          const authUrl = process.env.AUTH_URL;
          
          if (!keycloakIssuer || !authUrl) {
            logger.warn('Missing KEYCLOAK_ISSUER or AUTH_URL for logout', {
              hasKeycloakIssuer: !!keycloakIssuer,
              hasAuthUrl: !!authUrl
            });
            return;
          }
          
          const logoutUrl = new URL(`${keycloakIssuer}/protocol/openid-connect/logout`);
          logoutUrl.searchParams.set('id_token_hint', token.id_token as string);
          logoutUrl.searchParams.set('post_logout_redirect_uri', authUrl);
          
          logger.info('Attempting Keycloak logout', { 
            logoutUrl: logoutUrl.toString(),
            postLogoutRedirectUri: authUrl
          });
          
          const response = await fetch(logoutUrl.toString(), {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'NextAuth-CRM-Frontend'
            },
          });
          
          if (!response.ok) {
            logger.warn(`Keycloak logout warning: ${response.status} ${response.statusText}`, {
              status: response.status,
              statusText: response.statusText
            });
          } else {
            logger.info('Keycloak logout successful');
          }
        } catch (error) {
          logger.error('Keycloak logout error', error);
        }
      }
    },
    async signIn({ user, account, profile }) {
      logger.info('Sign in event triggered', {
        userId: user?.id,
        userEmail: user?.email,
        accountProvider: account?.provider,
        accountType: account?.type,
        hasProfile: !!profile
      });
      return true;
    }
  },
  pages: {
    error: '/auth/error',
  },
  debug: process.env.AUTH_DEBUG === 'true',
  trustHost: true,
  // Additional configuration for better error handling
  logger: {
    error(code, metadata) {
      logger.error(`NextAuth Error [${code}]`, metadata);
    },
    warn(code) {
      logger.warn(`NextAuth Warning [${code}]`);
    },
    debug(code, metadata) {
      logger.debug(`NextAuth Debug [${code}]`, metadata);
    },
  },
});