'use client';

import { signOut } from 'next-auth/react';

/**
 * Handle logout from both Keycloak and Auth.js
 */
export async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'GET' });

    await signOut({ redirectTo: '/login' });
  } catch (error) {
    console.error('Logout error:', error);
    await signOut({ redirectTo: '/login' });
  }
}