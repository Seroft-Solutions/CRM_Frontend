/**
 * Auth Error Boundary
 * Client-side component that monitors for auth errors and triggers hard logout
 *
 * @module core/auth/components
 */

'use client';

import { useEffect } from 'react';
import { monitorSigninErrors } from '@/core/auth/utils/error-handler';

/**
 * Auth Error Boundary
 * Monitors for authentication errors and handles them appropriately
 */
export function AuthErrorBoundary({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Start monitoring signin errors (403 on signin endpoint)
    monitorSigninErrors();

    return () => {
      // Cleanup if needed (though fetch override persists)
    };
  }, []);

  return <>{children}</>;
}
