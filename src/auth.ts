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
      realmRoles: decoded.realm_access?.roles || [],
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
    logger.info(`Successfully parsed ${uniqueRoles.length} unique roles`, { roles: uniqueRoles });
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
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
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

          // Handle login with Keycloak
          token.id_token = account.id_token;
          token.access_token = account.access_token;
          token.refresh_token = account.refresh_token;
          token.expires_at = Math.floor(Date.now() / 1000) + (account.expires_in ?? 0);

          logger.debug(`Token expiration set [${callbackId}]`, {
            expiresIn: account.expires_in,
            expiresAt: token.expires_at,
            expiresAtISO: new Date(token.expires_at * 1000).toISOString()
          });

          if (account.access_token && token.sub) {
            logger.debug(`Processing user data from access token [${callbackId}]`, { userSub: token.sub });
            
            token.organizations = parseOrganizations(account.access_token);
            
            // Store roles in JWT token for client access
            const roles = parseRoles(account.access_token);
            token.roles = roles;
            rolesManager.setUserRoles(token.sub, roles);
            
            logger.info(`User roles set in roles manager [${callbackId}]`, { 
              userSub: token.sub,
              rolesCount: roles.length 
            });
          }
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
          tokenError: token.error
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
        tokenError: token.error
      });

      try {
        if (token.sub) {
          session.user.id = token.sub;
        }
        
        if (token.organizations) {
          session.user.organizations = token.organizations;
        }
        
        if (token.roles) {
          session.user.roles = token.roles;
        }
        
        if (token.access_token) {
          session.access_token = token.access_token;
        }

        if (token.refresh_token) {
          session.refresh_token = token.refresh_token;
        }

        const sessionDuration = Date.now() - sessionStartTime;
        logger.debug(`Session callback completed in ${sessionDuration}ms`, {
          userId: session.user.id,
          organizationsCount: session.user.organizations?.length || 0,
          rolesCount: session.user.roles?.length || 0,
          hasAccessToken: !!session.access_token
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
        userRoles: auth?.user?.roles
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
        hasIdToken: !!token?.id_token 
      });

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