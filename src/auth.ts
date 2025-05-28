import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma, userUtils } from "@/lib/prisma";
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
      keycloakId?: string;
    };
    accessToken?: string;
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
    keycloakId?: string;
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
  
  // Limit to maximum 10 roles
  return essentialRoles.slice(0, 10);
}

/**
 * Extract limited organizations (to reduce session size)
 */
function extractLimitedOrganizations(tokenPayload: KeycloakTokenPayload): Array<{ name: string; id: string }> {
  if (!tokenPayload.organizations) return [];
  
  const orgs = Object.entries(tokenPayload.organizations).map(([name, data]) => ({
    name: name.length > 50 ? name.substring(0, 50) + '...' : name, // Limit name length
    id: data.id
  }));
  
  // Limit to maximum 5 organizations
  return orgs.slice(0, 5);
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
  
  // Use Prisma adapter for database session strategy
  adapter: PrismaAdapter(prisma),
  
  session: {
    strategy: "database", // Changed from "jwt" to "database"
    maxAge: 8 * 60 * 60, // 8 hours (shorter for better security)
    updateAge: 60 * 60, // 1 hour (update session every hour)
  },
  
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  
  callbacks: {
    ...authConfig.callbacks,
    
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === 'keycloak' && account.access_token) {
          // Decode the Keycloak token to get additional information
          const decodedToken = jwtDecode<KeycloakTokenPayload>(account.access_token);
          
          // Update user with Keycloak information
          if (user.id) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                keycloak_id: decodedToken.sub,
                preferred_username: decodedToken.preferred_username,
                last_login: new Date(),
                updated_at: new Date(),
              }
            });

            // Sync user roles and organizations
            const roles = extractEssentialRoles(decodedToken);
            const organizations = extractLimitedOrganizations(decodedToken);
            
            await userUtils.syncUserRoles(user.id, roles);
            await userUtils.syncUserOrganizations(user.id, organizations);
          }
        }
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return true; // Still allow sign in even if sync fails
      }
    },

    async session({ session, user, token }) {
      try {
        if (user) {
          // Get user with roles and organizations from database
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
              roles: true,
              organizations: true,
              accounts: {
                where: { provider: 'keycloak' },
                select: { access_token: true, refresh_token: true, expires_at: true }
              }
            }
          });

          if (dbUser) {
            session.user = {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              keycloakId: dbUser.keycloak_id || undefined,
              roles: dbUser.roles.map(r => r.role),
              organizations: dbUser.organizations.map(o => ({
                id: o.organizationId,
                name: o.organizationName
              }))
            };

            // Check if we have a valid access token
            const account = dbUser.accounts[0];
            if (account?.access_token && account.expires_at) {
              const now = Math.floor(Date.now() / 1000);
              if (account.expires_at > now) {
                session.accessToken = account.access_token;
              }
            }
          }
        }
        
        return session;
      } catch (error) {
        console.error("Error in session callback:", error);
        return session;
      }
    },

    async jwt({ token, account, user }) {
      // This callback is still used for token refresh even with database sessions
      if (account) {
        const decodedToken = jwtDecode<KeycloakTokenPayload>(account.access_token!);
        
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          idToken: account.id_token,
          expiresAt: account.expires_at,
          keycloakId: decodedToken.sub,
          roles: extractEssentialRoles(decodedToken),
          organizations: extractLimitedOrganizations(decodedToken),
        };
      }
      
      // Return previous token if the access token has not expired yet
      if (token.expiresAt && Date.now() < token.expiresAt * 1000) {
        return token;
      }
      
      // Access token has expired, try to refresh it
      const refreshedToken = await refreshAccessToken(token);
      
      // Update the database with the new token
      if (refreshedToken.accessToken && user?.id) {
        try {
          await prisma.account.updateMany({
            where: {
              userId: user.id,
              provider: 'keycloak'
            },
            data: {
              access_token: refreshedToken.accessToken,
              refresh_token: refreshedToken.refreshToken,
              expires_at: refreshedToken.expiresAt,
              updated_at: new Date()
            }
          });
        } catch (error) {
          console.error("Error updating token in database:", error);
        }
      }
      
      return refreshedToken;
    },
  },
  
  events: {
    async signOut({ session }) {
      try {
        // Clean up expired sessions when user signs out
        await prisma.session.deleteMany({
          where: {
            expires: {
              lt: new Date()
            }
          }
        });

        // Perform Keycloak logout if we have the necessary information
        if (session?.user?.id) {
          const account = await prisma.account.findFirst({
            where: {
              userId: session.user.id,
              provider: 'keycloak'
            },
            select: { id_token: true }
          });

          if (account?.id_token) {
            try {
              const url = `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/logout`;
              const logoutUrl = new URL(url);
              logoutUrl.searchParams.append('id_token_hint', account.id_token);
              logoutUrl.searchParams.append('post_logout_redirect_uri', process.env.AUTH_URL!);
              
              await fetch(logoutUrl.toString(), { method: 'GET' });
            } catch (error) {
              console.error('Keycloak logout error:', error);
            }
          }
        }
      } catch (error) {
        console.error("Error in signOut event:", error);
      }
    },

    async createUser({ user }) {
      console.log(`New user created: ${user.email}`);
    },

    async linkAccount({ user, account, profile }) {
      console.log(`Account linked for user: ${user.email}, provider: ${account.provider}`);
    }
  },
  
  debug: process.env.NODE_ENV === 'development',
});

/**
 * Utility function to get access token for API calls
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;

    // Get the latest access token from database
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'keycloak'
      },
      select: {
        access_token: true,
        expires_at: true,
        refresh_token: true
      }
    });

    if (!account?.access_token) return null;

    // Check if token is still valid
    const now = Math.floor(Date.now() / 1000);
    if (account.expires_at && account.expires_at > now) {
      return account.access_token;
    }

    // Token expired, try to refresh
    if (account.refresh_token) {
      try {
        const url = `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`;
        
        const response = await fetch(url, {
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          method: "POST",
          body: new URLSearchParams({
            client_id: process.env.AUTH_KEYCLOAK_ID!,
            client_secret: process.env.AUTH_KEYCLOAK_SECRET!,
            grant_type: "refresh_token",
            refresh_token: account.refresh_token,
          }),
        });

        if (response.ok) {
          const refreshedTokens = await response.json();
          
          // Update the database with new tokens
          await prisma.account.updateMany({
            where: {
              userId: session.user.id,
              provider: 'keycloak'
            },
            data: {
              access_token: refreshedTokens.access_token,
              refresh_token: refreshedTokens.refresh_token,
              expires_at: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
              updated_at: new Date()
            }
          });

          return refreshedTokens.access_token;
        }
      } catch (error) {
        console.error("Error refreshing token:", error);
      }
    }

    return null;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
}

/**
 * Server-side utility to get access token
 */
export async function getServerAccessToken(): Promise<string | null> {
  return await getAccessToken();
}
