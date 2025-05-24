'use client';

import { signOut } from 'next-auth/react';

/**
 * Handle logout from both Keycloak and Auth.js
 */
export async function handleLogout() {
  try {
    // The signOut function from next-auth/react will trigger the
    // NextAuth.js signout flow, which in turn executes the
    // events.signOut callback in src/auth.ts for Keycloak SLO.
    await signOut({ redirectTo: '/login' });
  } catch (error) {
    console.error('Logout error:', error);
    // Fallback signOut, though error during signOut itself is less common
    // unless network fails entirely or there's a config issue.
    await signOut({ redirectTo: '/login' });
  }
}