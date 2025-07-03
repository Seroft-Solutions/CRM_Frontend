/**
 * Updated NextAuth Configuration
 * Removes role parsing from JWT tokens to solve 431 error
 * Roles are now fetched from Spring Database after login
 */

import NextAuth from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';
import { springRoleService } from '../services/spring-role.service';
import { rolesManager } from '../session/roles-manager';
import type { JWT } from 'next-auth/jwt';

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    if (!token.refresh_token) return token;

    const tokenUrl = `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`;
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.AUTH_KEYCLOAK_ID!,
        client_secret: process.env.AUTH_KEYCLOAK_SECRET!,
        refresh_token: token.refresh_token as string,
      }),
    });

    if (!response.ok) {
      console.error('Failed to refresh token:', response.status);
      return { ...token, error: 'RefreshAccessTokenError' };
    }

    const data = await response.json();

    return {
      ...token,
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? token.refresh_token,
      id_token: data.id_token ?? token.id_token,
      expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      // Note: No longer parsing roles from token - they come from Spring
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID!,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET!,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === 'keycloak') {
        // Handle login with Keycloak
        token.id_token = account.id_token;
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token;
        token.expires_at = Math.floor(Date.now() / 1000) + (account.expires_in ?? 0);

        console.log('✅ Keycloak login successful');

        // Pre-fetch roles from Spring Database after login
        if (token.sub) {
          try {
            console.log('🔄 Fetching user roles from Spring Database...');
            await springRoleService.fetchUserRoles(token.sub);
            console.log('✅ User roles fetched from Spring Database');
          } catch (error) {
            console.error('❌ Failed to fetch user roles from Spring:', error);
            // Don't fail the login process if role fetch fails
          }
        }
      }

      // Refresh token if expired
      if (
        token.expires_at &&
        typeof token.expires_at === 'number' &&
        Date.now() / 1000 >= token.expires_at - 60
      ) {
        token = await refreshAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }

      // Note: roles and groups are no longer added to session here
      // They are fetched directly from Spring Database when needed
      // This eliminates the JWT size issue

      if (token.access_token && typeof token.access_token === 'string') {
        session.access_token = token.access_token;
      }

      if (token.refresh_token && typeof token.refresh_token === 'string') {
        session.refresh_token = token.refresh_token;
      }

      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isProtected =
        nextUrl.pathname.startsWith('/dashboard') ||
        nextUrl.pathname.startsWith('/areas') ||
        nextUrl.pathname.startsWith('/calls') ||
        nextUrl.pathname.startsWith('/parties') ||
        nextUrl.pathname.startsWith('/user-management') ||
        nextUrl.pathname.startsWith('/cities') ||
        nextUrl.pathname.startsWith('/districts') ||
        nextUrl.pathname.startsWith('/states') ||
        nextUrl.pathname.startsWith('/products') ||
        nextUrl.pathname.startsWith('/sources') ||
        nextUrl.pathname.startsWith('/priorities') ||
        nextUrl.pathname.startsWith('/call-types') ||
        nextUrl.pathname.startsWith('/sub-call-types') ||
        nextUrl.pathname.startsWith('/call-categories') ||
        nextUrl.pathname.startsWith('/call-statuses') ||
        nextUrl.pathname.startsWith('/call-remarks') ||
        nextUrl.pathname.startsWith('/channel-types') ||
        nextUrl.pathname.startsWith('/organizations');

      const isOrganizationFlow = nextUrl.pathname.startsWith('/organization');

      if (isProtected) {
        if (isLoggedIn) return true;
        return false;
      } else if (isOrganizationFlow) {
        // Allow access to organization flow if logged in
        if (isLoggedIn) return true;
        return false;
      } else if (isLoggedIn && nextUrl.pathname === '/') {
        return Response.redirect(new URL('/organization', nextUrl));
      }

      return true;
    },
  },
  events: {
    async signOut(params) {
      // Handle both token and session based signout
      const token = 'token' in params ? params.token : null;

      // Clear roles from Spring cache on signout
      if (token?.sub) {
        springRoleService.clearUserCache(token.sub);
        rolesManager.clearUserRoles(token.sub);
      }

      if (token?.id_token && typeof token.id_token === 'string') {
        try {
          const keycloakIssuer = process.env.AUTH_KEYCLOAK_ISSUER;
          const authUrl = process.env.AUTH_URL;

          if (!keycloakIssuer || !authUrl) {
            console.warn('Missing KEYCLOAK_ISSUER or AUTH_URL for logout');
            return;
          }

          const logoutUrl = new URL(`${keycloakIssuer}/protocol/openid-connect/logout`);
          logoutUrl.searchParams.set('id_token_hint', token.id_token as string);
          logoutUrl.searchParams.set('post_logout_redirect_uri', authUrl);

          const response = await fetch(logoutUrl.toString(), {
            method: 'GET',
            headers: {
              Accept: 'application/json',
            },
          });

          if (!response.ok) {
            console.warn(`Keycloak logout warning: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          console.error('Keycloak logout error:', error);
        }
      }
    },
    async signIn(params) {
      // Pre-fetch user roles from Spring when user signs in
      if (params.user?.id) {
        try {
          console.log('🔄 Pre-fetching user roles from Spring Database...');
          await springRoleService.fetchUserRoles(params.user.id);
          console.log('✅ User roles pre-fetched successfully');
        } catch (error) {
          console.error('❌ Failed to pre-fetch user roles:', error);
          // Don't prevent sign-in if role fetch fails
        }
      }
    },
  },
  trustHost: true,
});
