import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import { jwtDecode } from "jwt-decode";

// Extend the JWT interface to include token and role information
declare module "next-auth/jwt" {
  interface JWT {
    id_token?: string;
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    provider?: string;
    roles?: string[];
    organizations?: Record<string, { id: string }>;
  }
}

// Define organization type
interface Organization {
  name: string;
  id: string;
}

// Extend the Session interface to expose tokens, roles, and organizations
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string;
      email?: string;
      image?: string;
      roles?: string[];
      organizations?: Organization[];
      currentOrganization?: Organization;
    };
    accessToken?: string;
    idToken?: string;
    error?: "RefreshAccessTokenError";
  }
}

/**
 * Extract organizations from decoded token
 */
function extractOrganizations(decoded: any): Organization[] {
  const organizations: Organization[] = [];
  
  if (decoded.organizations && typeof decoded.organizations === 'object') {
    Object.entries(decoded.organizations).forEach(([name, orgData]: [string, any]) => {
      if (orgData && orgData.id) {
        organizations.push({
          name,
          id: orgData.id
        });
      }
    });
  }
  
  return organizations;
}

/**
 * Extract roles from decoded token (combining realm and resource roles)
 */
function extractRoles(decoded: any): string[] {
  const realmRoles = decoded.realm_access?.roles || [];
  const resourceRoles = [];
  
  if (decoded.resource_access) {
    Object.values(decoded.resource_access).forEach((resource: any) => {
      if (resource.roles && Array.isArray(resource.roles)) {
        resourceRoles.push(...resource.roles);
      }
    });
  }
  
  // Also include the direct roles array if it exists (as in your token)
  const directRoles = decoded.roles || [];
  
  return [...new Set([...realmRoles, ...resourceRoles, ...directRoles])];
}

/**
 * Refreshes the access token using the refresh token
 */
async function refreshAccessToken(token: any) {
  try {
    const url = `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`;
    
    const response = await fetch(url, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.AUTH_KEYCLOAK_ID || "",
        client_secret: process.env.AUTH_KEYCLOAK_SECRET || "",
        grant_type: "refresh_token",
        refresh_token: token.refresh_token || "",
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    const decoded = jwtDecode(refreshedTokens.access_token);
    
    // Extract roles and organizations from refreshed token
    const allRoles = extractRoles(decoded);
    const organizations = extractOrganizations(decoded);
    
    return {
      ...token,
      access_token: refreshedTokens.access_token,
      id_token: refreshedTokens.id_token,
      refresh_token: refreshedTokens.refresh_token ?? token.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + (refreshedTokens.expires_in || 3600),
      roles: allRoles,
      organizations: decoded.organizations || {}
    };
  } catch (error) {
    console.error("Token refresh failed:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Keycloak],
  callbacks: {
    async jwt({ token, account }) {
      // Initial sign in
      if (account && account.access_token) {
        try {
          // Decode the token to extract roles and organizations
          const decoded = jwtDecode(account.access_token);
          
          // Extract roles and organizations
          const allRoles = extractRoles(decoded);
          const organizations = extractOrganizations(decoded);
          
          return {
            ...token,
            id_token: account.id_token,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: Math.floor(Date.now() / 1000) + (account.expires_in || 3600),
            provider: account.provider,
            roles: allRoles,
            organizations: decoded.organizations || {}
          };
        } catch (error) {
          console.error("Error decoding JWT token:", error);
          return token;
        }
      }
      
      // Return previous token if the access token has not expired yet
      if (token.expires_at && Date.now() < token.expires_at * 1000) {
        return token;
      }
      
      // Access token has expired, try to refresh it
      return refreshAccessToken(token);
    },
    
    async session({ session, token }) {
      if (token) {
        // Add user info to session
        session.user.id = token.sub;
        session.user.roles = token.roles;
        
        // Add organizations to session
        const organizations = extractOrganizations({ organizations: token.organizations });
        session.user.organizations = organizations;
        
        // Set current organization (first one if multiple, or null if none)
        session.user.currentOrganization = organizations.length > 0 ? organizations[0] : undefined;
        
        // Add tokens to session
        session.accessToken = token.access_token;
        session.idToken = token.id_token;
        session.error = token.error;
      }
      
      return session;
    }
  },
  events: {
    async signOut({ token }) {
      if (token?.provider === "keycloak" && token?.id_token) {
        const issuer = process.env.AUTH_KEYCLOAK_ISSUER;
        if (!issuer) {
          return;
        }
        
        const logoutUrl = `${issuer}/protocol/openid-connect/logout?id_token_hint=${token.id_token}`;
        
        try {
          await fetch(logoutUrl);
        } catch (error) {
          console.error("Failed to logout from Keycloak", error);
        }
      }
    },
  },
  pages: {
    error: '/auth/error', // Custom error page
  },
  debug: process.env.NODE_ENV === 'development', // Enable debug in development
});