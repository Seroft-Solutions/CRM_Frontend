import type { NextAuthConfig } from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

/**
 * Edge-compatible auth configuration
 * This configuration is used by middleware and other edge runtime environments
 * where database adapters and complex operations are not available
 */
export const authConfig = {
  pages: {
    error: '/auth/error',
  },
  
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID!,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET!,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER!,
    }),
  ],
  
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtectedRoute = !nextUrl.pathname.startsWith('/auth/error') &&
                                nextUrl.pathname !== '/'; // Allow home page to be public
      
      if (isOnProtectedRoute) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to Keycloak
      } else if (isLoggedIn && nextUrl.pathname === '/') {
        // If logged in user visits home page, redirect to dashboard
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      
      return true;
    },
  },
} satisfies NextAuthConfig;
