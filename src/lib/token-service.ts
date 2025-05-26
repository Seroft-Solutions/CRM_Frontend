/**
 * Token Management Service
 * Handles access token retrieval and management for API calls
 */

import { auth } from "@/auth";
import { jwtDecode } from "jwt-decode";

interface TokenInfo {
  accessToken: string;
  expiresAt: number;
  isExpired: boolean;
}

class TokenService {
  private tokenCache = new Map<string, TokenInfo>();

  /**
   * Get access token from server-side session
   * This should be used in API routes and server actions
   */
  async getServerAccessToken(): Promise<string | null> {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        return null;
      }

      // In a production environment, you would retrieve the token from a secure store
      // For now, we'll need to implement token storage in database or secure cache
      return null;
    } catch (error) {
      console.error("Failed to get server access token:", error);
      return null;
    }
  }

  /**
   * Get access token for client-side API calls
   * This uses the session to make an API call to get the token
   */
  async getClientAccessToken(): Promise<string | null> {
    try {
      const response = await fetch('/api/auth/token');
      if (!response.ok) {
        throw new Error('Failed to get access token');
      }
      
      const data = await response.json();
      return data.accessToken || null;
    } catch (error) {
      console.error("Failed to get client access token:", error);
      return null;
    }
  }

  /**
   * Check if a token is expired
   */
  isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode(token);
      const currentTime = Math.floor(Date.now() / 1000);
      return !decoded.exp || decoded.exp < currentTime;
    } catch (error) {
      return true; // Consider invalid tokens as expired
    }
  }

  /**
   * Clear token cache
   */
  clearCache(userId?: string): void {
    if (userId) {
      this.tokenCache.delete(userId);
    } else {
      this.tokenCache.clear();
    }
  }
}

export const tokenService = new TokenService();

/**
 * API Route Handler for Token Retrieval
 * Create this as /api/auth/token/route.ts
 */
export async function createTokenApiHandler() {
  return {
    async GET() {
      try {
        const session = await auth();
        
        if (!session?.user?.id) {
          return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // In a real implementation, you would:
        // 1. Retrieve the refresh token from secure storage (database)
        // 2. Use it to get a fresh access token from Keycloak
        // 3. Return the access token
        
        // For now, return null since we don't have token storage implemented
        return Response.json({ 
          accessToken: null,
          message: 'Token storage not implemented yet'
        });
      } catch (error) {
        console.error('Token API error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
      }
    }
  };
}
