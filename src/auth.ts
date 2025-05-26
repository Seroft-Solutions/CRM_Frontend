/**
 * Session Configuration Fix
 * Reduces session cookie size by storing only essential data in cookies
 * and implementing a more efficient session strategy
 */

import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import { jwtDecode } from "jwt-decode";

// Extend the JWT interface to include minimal token information
declare module "next-auth/jwt" {
  interface JWT {
    id_token?: string;
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    provider?: string;
    roles?: string[];
    organizations?: Record<string, { id: string }>;
    // Add a flag to indicate if we've already processed this token
    processed?: boolean;
  }
}

// Define organization type
interface Organization {
  name: string;
  id: string;
}

// Extend the Session interface with minimal data
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
    // Remove large tokens from session - we'll store them separately if needed
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
 * Limit to most important roles to reduce session size
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
  
  // Also include the direct roles array if it exists
  const directRoles = decoded.roles || [];
  
  const allRoles = [...new Set([...realmRoles, ...resourceRoles, ...directRoles])];
  
  // Filter to keep only essential roles (you can customize this based on your needs)
  const essentialRoles = allRoles.filter(role => 
    role.includes('admin') || 
    role.includes('manager') || 
    role.includes('user') ||
    role.includes('manage-users') ||
    !role.startsWith('default-roles-') // Remove default Keycloak roles
  );
  
  return essentialRoles.slice(0, 10); // Limit to 10 most important roles
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
    
    // Extract minimal data
    const essentialRoles = extractRoles(decoded);
    const organizations = extractOrganizations(decoded);
    
    return {
      ...token,
      access_token: refreshedTokens.access_token,
      refresh_token: refreshedTokens.refresh_token ?? token.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + (refreshedTokens.expires_in || 3600),
      roles: essentialRoles,
      organizations: decoded.organizations || {},
      processed: true
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
  
  // Configure session strategy
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  
  // Configure JWT settings
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  
  callbacks: {
    async jwt({ token, account }) {
      // Initial sign in
      if (account && account.access_token) {
        try {
          // Decode the token to extract roles and organizations
          const decoded = jwtDecode(account.access_token);
          
          // Extract minimal essential data
          const essentialRoles = extractRoles(decoded);
          const organizations = extractOrganizations(decoded);
          
          return {
            ...token,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: Math.floor(Date.now() / 1000) + (account.expires_in || 3600),
            provider: account.provider,
            roles: essentialRoles,
            organizations: decoded.organizations || {},
            processed: true
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
        // Add minimal user info to session
        session.user.id = token.sub;
        session.user.roles = token.roles;
        
        // Add organizations to session (limit to first 5 to reduce size)
        const organizations = extractOrganizations({ organizations: token.organizations });
        session.user.organizations = organizations.slice(0, 5); // Limit organizations
        
        // Set current organization (first one if multiple, or null if none)
        session.user.currentOrganization = organizations.length > 0 ? organizations[0] : undefined;
        
        // Don't store large tokens in session - they'll be available in the JWT callback if needed
        session.error = token.error;
      }
      
      return session;
    }
  },
  
  events: {
    async signOut({ token }) {
      if (token?.provider === "keycloak" && token?.access_token) {
        const issuer = process.env.AUTH_KEYCLOAK_ISSUER;
        if (!issuer) {
          return;
        }
        
        // Use access token to construct logout URL instead of id_token
        const logoutUrl = `${issuer}/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(process.env.NEXTAUTH_URL || '')}`;
        
        try {
          await fetch(logoutUrl, {
            headers: {
              'Authorization': `Bearer ${token.access_token}`
            }
          });
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

/**
 * Utility function to get access token if needed for API calls
 * This can be used in API routes or server actions where you need the full token
 */
export async function getAccessToken() {
  const session = await auth();
  
  if (!session) {
    return null;
  }
  
  // In a real implementation, you might want to store tokens in a database
  // and retrieve them here, or implement a token refresh mechanism
  return null; // Token not available in session anymore for security
}
