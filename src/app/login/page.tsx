'use client';

import { useEffect } from 'react';
import { Coffee } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');

  // Auto-redirect to Keycloak login
  useEffect(() => {
    // If there's an error, we don't auto-redirect to prevent login loops
    if (!error) {
      signIn('keycloak', { redirectTo });
    }
  }, [redirectTo, error]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center">
        <Coffee className="w-12 h-12 text-primary animate-bounce mb-4" />
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="mt-4 text-muted-foreground">
          {error ? `Error: ${error}. Please try again.` : 'Redirecting to login...'}
        </p>
        {error && (
          <button
            onClick={() => signIn('keycloak', { redirectTo })}
            className="mt-4 px-4 py-2 bg-primary text-white rounded"
          >
            Retry Login
          </button>
        )}
      </div>
    </div>
  );
}
