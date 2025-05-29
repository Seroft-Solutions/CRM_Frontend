import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { jwtDecode } from "jwt-decode";

// Type declarations for NextAuth v5 - Override default interfaces
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      roles: string[];
      organizations: Array<{
        name: string;
        id: string;
      }>;
    };
    error?: "RefreshAccessTokenError";
  }

  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
    expiresAt?: number;
    roles?: string[];
    organizations?: Array<{ name: string; id: string }>;
    error?: "RefreshAccessTokenError";
  }
}

// Types for Keycloak token structure
interface KeycloakTokenPayload {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: Record<string, { roles: string[] }>;
  organizations?: Record<string, { id: string }>;
  exp: number;
  iat: number;
}

// Local JWT type that's compatible with NextAuth's JWT interface
interface JWTToken {
  // Standard JWT fields (matching NextAuth's JWT interface)
  sub?: string;
  name?: string | null;
  email?: string | null;
  picture?: string | null;
  iat?: number;
  exp?: number;
  jti?: string;
  
  // Our custom OAuth/Keycloak fields
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
  expiresAt?: number;
  roles?: string[];
  organizations?: Array<{ name: string; id: string }>;
  error?: "RefreshAccessTokenError";
  
  // Additional fields that might be present
  [key: string]: any;
}

/**
 * Extract essential roles only (limit to reduce session size)
 */
function extractEssentialRoles(tokenPayload: KeycloakTokenPayload): string[] {
  const realmRoles = tokenPayload.realm_access?.roles || [];
  const resourceRoles: string[] = [];
  
  // Extract roles from all resource access
  if (tokenPayload.resource_access) {
    Object.values(tokenPayload.resource_access).forEach((resource) => {
      resourceRoles.push(...(resource.roles || []));
    });
  }
  
  // Combine and dedupe roles, filter out default Keycloak roles
  const allRoles = [...new Set([...realmRoles, ...resourceRoles])];
  const filteredRoles = allRoles.filter(role => !role.startsWith('default-roles-'));
  
  // Keep only essential roles to reduce session size
  const essentialRoles = filteredRoles.filter(role => 
    role.includes('admin') || 
    role.includes('manager') || 
    role.includes('user') ||
    role.includes('create') ||
    role.includes('read') ||
    role.includes('update') ||
    role.includes('delete')
  );
  
  // Limit to maximum 5 roles to keep session small
  return essentialRoles.slice(0, 5);
}

/**
 * Extract limited organizations (to reduce session size)
 */
function extractLimitedOrganizations(tokenPayload: KeycloakTokenPayload): Array<{ name: string; id: string }> {
  if (!tokenPayload.organizations) return [];
  
  const orgs = Object.entries(tokenPayload.organizations).map(([name, data]) => ({
    name: name.length > 20 ? name.substring(0, 20) + '...' : name, // Limit name length
    id: data.id
  }));
  
  // Limit to maximum 3 organizations to keep session small
  return orgs.slice(0, 3);
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(token: JWTToken) {
  try {
    const url = `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`;
    
    const response = await fetch(url, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.AUTH_KEYCLOAK_ID!,
        client_secret: process.env.AUTH_KEYCLOAK_SECRET!,
        grant_type: "refresh_token",
        refresh_token: token.refreshToken!,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    // Decode the new access token
    const decodedToken = jwtDecode<KeycloakTokenPayload>(refreshedTokens.access_token);
    
    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
      idToken: refreshedTokens.id_token,
      expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
      roles: extractEssentialRoles(decodedToken),
      organizations: extractLimitedOrganizations(decodedToken),
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError" as const,
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  
  callbacks: {
    ...authConfig.callbacks,
    
    async jwt({ token, account }) {
      const jwtToken = token as JWTToken;
      
      // Initial sign in
      if (account) {
        const decodedToken = jwtDecode<KeycloakTokenPayload>(account.access_token!);
        
        return {
          ...jwtToken,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          idToken: account.id_token,
          expiresAt: account.expires_at,
          roles: extractEssentialRoles(decodedToken),
          organizations: extractLimitedOrganizations(decodedToken),
        };
      }
      
      // Return previous token if the access token has not expired yet
      if (jwtToken.expiresAt && typeof jwtToken.expiresAt === 'number' && Date.now() < jwtToken.expiresAt * 1000) {
        return jwtToken;
      }
      
      // Access token has expired, try to refresh it
      return refreshAccessToken(jwtToken);
    },
    
    async session({ session, token }) {
      const jwtToken = token as JWTToken;
      
      if (jwtToken) {
        // Only store essential data in session (not tokens to reduce size)
        session.user = {
          id: jwtToken.sub!,
          name: jwtToken.name ?? undefined,
          email: jwtToken.email ?? undefined,
          image: jwtToken.picture ?? undefined,
          roles: jwtToken.roles || [],
          organizations: jwtToken.organizations || [],
        } as any; // Type assertion to override NextAuth's strict session types
        
        // Only include error, not tokens
        session.error = jwtToken.error;
      }
      
      return session;
    },
  },
  
  events: {
    async signOut(params) {
      // Handle both possible parameter structures
      const token = 'token' in params ? params.token : null;
      const jwtToken = token as JWTToken | null;
      
      // Perform Keycloak logout
      if (jwtToken?.idToken) {
        try {
          const url = `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/logout`;
          const logoutUrl = new URL(url);
          logoutUrl.searchParams.append('id_token_hint', jwtToken.idToken);
          logoutUrl.searchParams.append('post_logout_redirect_uri', process.env.AUTH_URL!);
          
          await fetch(logoutUrl.toString(), { method: 'GET' });
        } catch (error) {
          console.error('Keycloak logout error:', error);
        }
      }
    },
  },
  
  debug: process.env.NODE_ENV === 'development',
});

/**
 * Utility function to get access token for API calls
 * Since we don't store tokens in session anymore, we need to get them from JWT
 */
export async function getAccessToken() {
  try {
    const session = await auth();
    if (!session) return null;
    
    // In production, you might want to store tokens in a secure database
    // and retrieve them here using the user ID
    return null; // Tokens not available in session for security
  } catch {
    return null;
  }
}
