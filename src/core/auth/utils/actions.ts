'use server';

/**
 * Server-side authentication actions
 */

import { signOut } from '@/auth';

export async function logoutAction() {
  await signOut({ redirectTo: '/' });
}
