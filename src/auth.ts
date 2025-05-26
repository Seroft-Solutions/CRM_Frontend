import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { jwtDecode } from "jwt-decode";

// Type declarations for NextAuth v5
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string;
      email?: string;
      image?: string;
      roles: string[];
      organizations: Array<{
        name: string;
        id: string;
      }>;
    };
    error?: "RefreshAccessTokenError";
  }
}

declare module "next-auth/jwt" {
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
async function refreshAccessToken(token: JWT) {
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
      // Initial sign in
      if (account) {
        const decodedToken = jwtDecode<KeycloakTokenPayload>(account.access_token!);
        
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          idToken: account.id_token,
          expiresAt: account.expires_at,
          roles: extractEssentialRoles(decodedToken),
          organizations: extractLimitedOrganizations(decodedToken),
        };
      }
      
      // Return previous token if the access token has not expired yet
      if (token.expiresAt && Date.now() < token.expiresAt * 1000) {
        return token;
      }
      
      // Access token has expired, try to refresh it
      return refreshAccessToken(token);
    },
    
    async session({ session, token }) {
      if (token) {
        // Only store essential data in session (not tokens to reduce size)
        session.user = {
          id: token.sub!,
          name: token.name,
          email: token.email,
          image: token.picture,
          roles: token.roles || [],
          organizations: token.organizations || [],
        };
        
        // Only include error, not tokens
        session.error = token.error;
      }
      
      return session;
    },
  },
  
  events: {
    async signOut({ token }) {
      // Perform Keycloak logout
      if (token?.idToken) {
        try {
          const url = `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/logout`;
          const logoutUrl = new URL(url);
          logoutUrl.searchParams.append('id_token_hint', token.idToken);
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
