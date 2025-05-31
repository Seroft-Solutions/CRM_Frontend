'use client';

import { signOut } from 'next-auth/react';
import { springService } from '@/core/api/services/spring-service';

/**
 * Handle logout by invalidating local caches and then calling NextAuth's signOut.
 */
export async function handleLogout() {
  try {
    // Invalidate token cache in API services (client-side)
    // Ensure this service and method are designed for client-side execution.
    if (typeof springService?.invalidateTokenCache === 'function') {
      springService.invalidateTokenCache();
    }
    
    // Sign out from NextAuth, which will handle OIDC logout with Keycloak
    await signOut({ redirectTo: '/' });
  } catch (error: any) { // Added :any to error for accessing error.message
    // Log the error
    console.error('Error during logout process:', error);
    
    // Attempt a fallback signOut if the initial one failed for some reason,
    // though errors during signOut itself are less common.
    // This ensures redirection to home page even if cache invalidation or other steps failed.
    if (!error?.message?.includes('NEXT_REDIRECT')) { // Avoid double redirect if error is from signOut itself
        try {
            await signOut({ redirectTo: '/' });
        } catch (fallbackError) {
            console.error('Fallback signOut error:', fallbackError);
            // If even fallback fails, manually redirect (though less ideal)
            if (typeof window !== 'undefined') {
                window.location.href = '/';
            }
        }
    }
  }
}
