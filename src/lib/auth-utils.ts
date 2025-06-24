import { signOut } from 'next-auth/react';

/**
 * Logout utility function that handles both NextAuth and Keycloak logout
 */
export async function logout() {
  try {
    // NextAuth v5 will automatically handle Keycloak logout via the signOut event
    await signOut({
      callbackUrl: '/',
      redirect: true,
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Fallback: redirect to home page
    window.location.href = '/';
  }
}

/**
 * Silent logout (useful for token expiration scenarios)
 */
export async function silentLogout() {
  try {
    await signOut({
      redirect: false,
    });
  } catch (error) {
    console.error('Silent logout error:', error);
  }
}
