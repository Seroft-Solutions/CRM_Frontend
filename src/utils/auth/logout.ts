'use client';

import { signOut } from 'next-auth/react';
import { springService } from '@/core/api/services/spring-service';

/**
 * Handle logout from both Keycloak and Auth.js
 */
export async function handleLogout() {
  try {
    // Invalidate token cache in API services
    springService.invalidateTokenCache();
    
    // Call logout endpoint
    await fetch('/api/auth/logout', { method: 'GET' });

    // Sign out from NextAuth
    await signOut({ redirectTo: '/login' });
  } catch (error) {
    console.error('Logout error:', error);
    // Fallback logout
    await signOut({ redirectTo: '/login' });
  }
}
